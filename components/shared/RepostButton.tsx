"use client";

import Image from "next/image";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  const handleRepost = async () => {
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
          onRepostChange?.(true, count + 1);
          router.refresh(); // 🔁 atualiza imediatamente a página

          toast.success("Post repostado com sucesso 🔁", {
            description: "Seu repost foi publicado na sua timeline.",
            style: {
              background: "#1e1e2a",
              color: "#fff",
              border: "1px solid #00BA7C",
              borderRadius: "10px",
              padding: "14px 18px",
              fontSize: "15px",
              boxShadow: "0 4px 12px rgba(0,186,124,0.3)",
            },
            icon: (
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 250, damping: 10 }}
              >
                <Image src="/assets/repost-filled.svg" alt="Repost" width={22} height={22} />
              </motion.div>
            ),
          });
        } else if (data.action === "unrepost") {
          setReposted(false);
          setCount((c) => Math.max(0, c - 1));
          onRepostChange?.(false, Math.max(0, count - 1));
          router.refresh(); // 🔁 atualiza imediatamente a página

          toast.info("Repost removido 🗑️", {
            description: "O repost foi desfeito com sucesso.",
            style: {
              background: "#1e1e2a",
              color: "#fff",
              border: "1px solid #888",
              borderRadius: "10px",
              padding: "14px 18px",
              fontSize: "15px",
              boxShadow: "0 4px 12px rgba(255,255,255,0.1)",
            },
          });
        }
      } catch (err) {
        console.error("Erro ao repostar:", err);
        toast.error("Falha ao repostar publicação ❌");
      }
    });
  };

  return (
    <motion.button
      onClick={handleRepost}
      whileTap={{ scale: 0.85 }}
      whileHover={{ scale: 1.1 }}
      disabled={isPending}
      className="cursor-pointer flex items-center gap-1 transition"
      title={reposted ? "Desfazer repost" : "Repostar"}
    >
      <Image
        src={reposted ? "/assets/repost-filled.svg" : "/assets/repost.svg"}
        alt="repost"
        width={24}
        height={24}
        className={`object-contain ${isPending ? "opacity-50" : ""}`}
      />
      <span className="text-gray-1 text-sm">{count}</span>
    </motion.button>
  );
}