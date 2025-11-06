"use client";

import Image from "next/image";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Props {
  threadId: string;
  currentUserId: string;
  isReposted: boolean;
  initialCount: number;
  onRepostChange?: (isReposted: boolean, newCount: number) => void;
}

export default function RepostButton({
  threadId,
  currentUserId,
  isReposted,
  initialCount,
  onRepostChange,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [reposted, setReposted] = useState(isReposted);
  const [count, setCount] = useState(initialCount);

  const handleRepost = async () => {
    if (!currentUserId) {
      toast.error("Você precisa estar logado para repostar ❌");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/thread/${threadId}/repost`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUserId }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao repostar");

        if (data.action === "repost") {
          setReposted(true);
          setCount((c) => c + 1);
          toast.success("Post repostado com sucesso 🔁");

          // 🔁 Atualiza UI local e global
          onRepostChange?.(true, count + 1);

          // 🔔 Atualiza contador de notificações (LeftSidebar/Bottombar)
          window.dispatchEvent(new Event("notifications:update"));
        } else if (data.action === "unrepost") {
          setReposted(false);
          setCount((c) => Math.max(0, c - 1));
          toast.info("Repost removido 🗑️");

          onRepostChange?.(false, count - 1);
          window.dispatchEvent(new Event("notifications:update"));
        }

        // 🔁 Atualiza todos os componentes escutando mudanças de repost
        window.dispatchEvent(new CustomEvent("repost:updated"));
        window.dispatchEvent(new CustomEvent("thread:refresh"));
      } catch (err) {
        console.error("Erro ao repostar:", err);
        toast.error("Falha ao repostar publicação ❌");
      }
    });
  };

  return (
    <motion.button
      onClick={handleRepost}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      disabled={isPending}
      className="cursor-pointer flex items-center gap-1 transition"
      title={reposted ? "Desfazer repost" : "Repostar"}
    >
      <Image
        src={reposted ? "/assets/repost-filled.svg" : "/assets/repost.svg"}
        alt="repost"
        width={24}
        height={24}
        className={`object-contain transition-all duration-200 ${isPending ? "opacity-50" : ""}`}
      />
      <span className="text-gray-1 text-sm min-w-[10px]">{count}</span>
    </motion.button>
  );
}