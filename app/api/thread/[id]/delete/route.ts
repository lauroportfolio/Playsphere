import { NextResponse } from "next/server";
import { deleteThread } from "@/lib/actions/thread.actions";
import { connectToDB } from "@/lib/mongoose";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params; // 👈 precisa de await agora
    await connectToDB();

    await deleteThread(id, "/");

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Erro ao deletar via API:", err);
    return NextResponse.json({ error: err?.message || "Erro" }, { status: 500 });
  }
}
