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
    if (!currentUserId) {
      toast.error("Você precisa estar logado para repostar 🔁", {
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
      router.push("/sign-in");
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
          toast.success("Post repostado com sucesso 🔁", {
            style: {
              background: "#1e1e2a",
              color: "#fff",
              border: "1px solid #877EFF",
              borderRadius: "10px",
              padding: "14px 18px",
              fontSize: "15px",
              boxShadow: "0 4px 12px rgba(135,126,255,0.3)",
            },
            icon: (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type:"spring", stiffness:250, damping:10 }}>
                <Image src="/assets/repost-filled.svg" alt="Repostado" width={22} height={22} className="invert" />
              </motion.div>
            ),
          });

          window.dispatchEvent(new CustomEvent("repost:updated"));
          window.dispatchEvent(new CustomEvent("thread:refresh"));

          onRepostChange?.(true, count + 1);
        } else if (data.action === "unrepost") {
          setReposted(false);
          const newCount = Math.max(0, count - 1);
          setCount(newCount);
          toast.info("Repost removido 🗑️", {
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

          window.dispatchEvent(new CustomEvent("repost:updated"));
          window.dispatchEvent(new CustomEvent("thread:refresh"));

          onRepostChange?.(false, newCount);
        }
      } catch (err) {
        console.error("Erro ao repostar:", err);
        toast.error("Falha ao repostar publicação ❌", {
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
