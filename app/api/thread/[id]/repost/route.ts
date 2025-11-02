// app/api/thread/[id]/repost/route.ts
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoose";
import Thread from "@/lib/models/thread.model";
import User from "@/lib/models/user.model";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id: threadId } = params;
    const body = await request.json();
    const { userId } = body;
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    connectToDB();

    const original = await Thread.findById(threadId);
    if (!original) return NextResponse.json({ error: "Original thread not found" }, { status: 404 });

    const alreadyReposted = original.reposts.some((id: any) => id.toString() === userId);

    if (alreadyReposted) {
      original.reposts = original.reposts.filter((id: any) => id.toString() !== userId);
      await original.save();

      await Thread.deleteOne({ repostId: original._id, author: userId });

      return NextResponse.json({ success: true, action: "unrepost", repostsCount: original.reposts.length });
    } else {
      original.reposts.push(userId);
      await original.save();

      const repostThread = await Thread.create({
        text: original.text,
        author: userId,
        community: original.community || null,
        repostId: original._id,
      });

      await User.findByIdAndUpdate(userId, { $push: { threads: repostThread._id } });

      return NextResponse.json({ success: true, action: "repost", repostsCount: original.reposts.length });
    }
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
