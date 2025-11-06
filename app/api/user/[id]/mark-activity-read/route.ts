import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoose";
import Activity from "@/lib/models/activity.model";
import User from "@/lib/models/user.model";
import mongoose from "mongoose";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    const { id } = await context.params;

    // 🔍 Verifica se o id é um ObjectId válido ou um Clerk ID
    let user;
    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findById(id);
    } else {
      user = await User.findOne({ id }); // Clerk ID
    }

    if (!user) {
      console.warn("⚠️ Usuário não encontrado para mark-activity-read:", id);
      return NextResponse.json({ success: false, message: "Usuário não encontrado" });
    }

    // 🟢 Marca todas as atividades não lidas como lidas
    const result = await Activity.updateMany(
      { targetUser: user._id, isRead: false },
      { $set: { isRead: true } }
    );

    console.log(`✅ ${result.modifiedCount} notificações marcadas como lidas para ${user.id}`);

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Erro ao marcar notificações como lidas:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}