"use client";

import Image from "next/image";
import { toast } from "sonner";
import { motion } from "framer-motion"; // ✨ animação sutil opcional

export default function ShareButton({ id }: { id: string }) {
  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/thread/${id}`;
      await navigator.clipboard.writeText(shareUrl);

      // ✅ Toast estilizado com tema PlaySphere
      toast.success("Link copiado com sucesso! ⚡", {
        description: "O link foi copiado para a área de transferência.",
        duration: 2500,
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
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 250, damping: 10 }}
          >
            <Image
              src="/assets/share.svg"
              alt="Compartilhar"
              width={22}
              height={22}
              className="invert"
            />
          </motion.div>
        ),
      });
    } catch (err) {
      console.error("Erro ao copiar link:", err);
      toast.error("Erro ao copiar link 😢", {
        style: {
          background: "#2a1e1e",
          color: "#ffbcbc",
          border: "1px solid #ff5b5b",
          borderRadius: "10px",
          padding: "14px 18px",
          fontSize: "15px",
        },
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="cursor-pointer object-contain hover:opacity-80 transition"
      title="Compartilhar"
    >
      <Image
        src="/assets/share.svg"
        alt="Compartilhar"
        width={24}
        height={24}
        className="object-contain"
      />
    </button>
  );
}
