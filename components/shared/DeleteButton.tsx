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
            border: "1px solid #877EFF",
            borderRadius: "10px",
            padding: "14px 18px",
            fontSize: "15px",
            boxShadow: "0 4px 12px rgba(135,126,255,0.3)",
          },
        });

        window.dispatchEvent(new Event("thread:refresh"));
        router.refresh();
        onDeleted?.();
      } catch (err) {
        console.error("Erro ao deletar:", err);
        toast.error("Falha ao excluir postagem ❌", {
          style: {
            background: "#1e1e2a",
            color: "#fff",
            border: "1px solid #ff5f5f",
            borderRadius: "10px",
            padding: "14px 18px",
            fontSize: "15px",
            boxShadow: "0 4px 12px rgba(255,95,95,0.3)",
          },
        });
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className={`flex items-center gap-2 bg-dark-3 hover:bg-dark-4 text-light-1 px-3 py-2 rounded-md transition ${className} ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
      title="Excluir postagem"
    >
      <Image src="/assets/delete.svg" alt="Excluir ícone" width={20} height={20} />
      <span>Excluir postagem</span>
    </button>
  );
}