"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface LikeButtonProps {
  threadId: string;
  currentUserId: string;
  isLiked: boolean;
  likeCount: number;
}

export default function LikeButton({
  threadId,
  currentUserId,
  isLiked,
  likeCount,
}: LikeButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleLike() {
    if (!currentUserId) {
      toast.error("Você precisa estar logado para curtir ❌");
      return;
    }

    startTransition(async () => {
      try {
        const { toggleLike } = await import("@/lib/actions/thread.actions");
        const path = typeof window !== "undefined" ? window.location.pathname : "/";
        const res = await toggleLike(threadId, currentUserId, path);

        // 🔁 Atualiza página e contador global de notificações
        router.refresh();
        window.dispatchEvent(new Event("notifications:update"));
      } catch (err) {
        console.error("Erro ao curtir:", err);
        toast.error("Falha ao curtir publicação ❌");
      }
    });
  }

  return (
    <motion.button
      type="button"
      onClick={handleLike}
      disabled={isPending}
      whileTap={{ scale: 0.85 }}
      whileHover={{ scale: 1.1 }}
      className="flex items-center gap-1 cursor-pointer disabled:opacity-50"
    >
      <Image
        src={isLiked ? "/assets/heart-filled.svg" : "/assets/heart-gray.svg"}
        alt="like"
        width={24}
        height={24}
        className="object-contain select-none"
      />
      <span className="text-gray-1 text-sm">{likeCount}</span>
    </motion.button>
  );
}