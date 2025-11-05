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

    // ✅ Garante que só tenta usar _id se for ObjectId válido
    const query: any = [{ id: userId }];
    if (mongoose.Types.ObjectId.isValid(userId)) {
      query.push({ _id: new mongoose.Types.ObjectId(userId) });
    }

    const user = await User.findOne({ $or: query });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const userOid = user._id;
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
      // ✅ Desfazer repost
      original.reposts = original.reposts.filter(
        (r: any) => String(r) !== String(userOid)
      );
      await original.save();

      // Remove documento de repost criado antes
      await Thread.deleteOne({ repostOf: original._id, author: userOid });

      return NextResponse.json({
        success: true,
        action: "unrepost",
        repostsCount: original.reposts.length,
      });
    } else {
      // ✅ Criar repost
      original.reposts.push(userOid);
      await original.save();

      const repost = await Thread.create({
        text: original.text,
        author: userOid,
        community: original.community || null,
        repostOf: original._id,
        repostedBy: userOid,
      });

      await User.findByIdAndUpdate(userOid, { $push: { threads: repost._id } });

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