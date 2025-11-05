"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";

interface Props {
  threadId: string;
  onDeleted?: () => void;
  className?: string;
}

export default function DeleteButton({ threadId, onDeleted, className = "" }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/thread/${threadId}/delete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Erro ao deletar");

        toast.success("Post excluído 🗑️", {
          description: "A postagem foi removida com sucesso.",
          style: {
            background: "#1e1e2a",
            color: "#fff",
            border: "1px solid #FF4D4F",
            borderRadius: "10px",
            padding: "14px 18px",
            fontSize: "15px",
            boxShadow: "0 4px 12px rgba(255,77,79,0.3)",
          },
        });

        // 🔁 Emite evento global para atualizar Home
        window.dispatchEvent(new Event("thread:refresh"));

        // 🔁 Atualiza rota atual
        router.refresh();

        // callback opcional (caso precise)
        onDeleted?.();
      } catch (err) {
        console.error("Erro ao deletar:", err);
        toast.error("Falha ao excluir postagem.");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className={`cursor-pointer hover:opacity-90 transition ${className}`}
      title="Excluir postagem"
    >
      <Image src="/assets/delete.svg" alt="delete" width={22} height={22} />
    </button>
  );
}