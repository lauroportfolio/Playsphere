import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoose";
import Activity from "@/lib/models/activity.model";
import User from "@/lib/models/user.model";
import mongoose from "mongoose";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    const { id } = await context.params;

    // 🔍 Se o ID for um ObjectId válido, pesquisa diretamente
    // Caso contrário, busca pelo Clerk ID
    let user;
    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findById(id);
    } else {
      user = await User.findOne({ id }); // Clerk ID
    }

    if (!user) {
      console.warn("⚠️ Usuário não encontrado para unread-activity:", id);
      return NextResponse.json({ success: true, unreadCount: 0 });
    }

    // 🧮 Conta notificações não lidas
    const unreadCount = await Activity.countDocuments({
      targetUser: user._id,
      isRead: false,
    });

    console.log(`📬 ${unreadCount} notificações não lidas para ${user.id}`);

    return NextResponse.json({ success: true, unreadCount });
  } catch (error) {
    console.error("Erro ao buscar contador de notificações:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}