import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoose";
import Thread from "@/lib/models/thread.model";
import { revalidatePath } from "next/cache";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDB();

    const { userId, path } = await req.json();
    const threadId = params.id;

    const thread = await Thread.findById(threadId);
    if (!thread) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    }

    // Toggle do like
    const hasLiked = thread.likes.includes(userId);
    if (hasLiked) {
      thread.likes = thread.likes.filter((id: string) => id !== userId);
    } else {
      thread.likes.push(userId);
    }

    await thread.save();
    revalidatePath(path);

    return NextResponse.json({
      success: true,
      liked: !hasLiked,
      likesCount: thread.likes.length,
    });
  } catch (err: any) {
    console.error("Erro ao alternar like:", err);
    return NextResponse.json({ error: "Erro ao processar like" }, { status: 500 });
  }
}
