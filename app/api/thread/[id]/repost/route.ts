import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDB } from "@/lib/mongoose";
import Thread from "@/lib/models/thread.model";
import User from "@/lib/models/user.model";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Corrige acesso assíncrono aos params (Next.js 14+)
    const { id: threadId } = await context.params;
    await connectToDB();

    const body = await request.json();
    const { userId } = body;
    if (!userId)
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    // ✅ Busca o usuário pelo id do Clerk ou ObjectId do Mongo
    const query: any = [{ id: userId }];
    if (mongoose.Types.ObjectId.isValid(userId)) {
      query.push({ _id: new mongoose.Schema.Types.ObjectId(userId) });
    }

    const user = await User.findOne({ $or: query });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const userOid = user._id;

    // ✅ Busca o post original
    const original = await Thread.findById(threadId);
    if (!original)
      return NextResponse.json(
        { error: "Original thread not found" },
        { status: 404 }
      );

    const hasReposted = original.reposts.some(
      (r: any) => String(r) === String(userOid)
    );

    if (hasReposted) {
      // 🔁 Desfaz repost (remove usuário do array de reposts)
      original.reposts = original.reposts.filter(
        (r: any) => String(r) !== String(userOid)
      );
      await original.save();

      console.log(`🟡 Repost removido: ${user.id} → ${threadId}`);

      return NextResponse.json({
        success: true,
        action: "unrepost",
        repostsCount: original.reposts.length,
      });
    } else {
      // 🔁 Faz repost (adiciona o usuário no array)
      original.reposts.push(userOid);
      await original.save();

      console.log(`🟢 Repost criado: ${user.id} → ${threadId}`);

      return NextResponse.json({
        success: true,
        action: "repost",
        repostsCount: original.reposts.length,
      });
    }
  } catch (err: any) {
    console.error("Erro no repost route:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}