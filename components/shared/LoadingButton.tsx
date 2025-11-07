"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Image from "next/image";

interface LoadingButtonProps {
  onClick: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export function LoadingButton({ onClick, children, className = "" }: LoadingButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handle = async () => {
    if (isLoading) return;
    setIsLoading(true);

    toast("Publicando...", {
      description: "Aguarde enquanto sua postagem é criada.",
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

    try {
      await onClick();
      toast.success("Post publicado! ✅", {
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
          <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ type:"spring", stiffness:250, damping:10 }}>
            <Image src="/assets/heart-filled.svg" alt="Sucesso" width={22} height={22} className="invert" />
          </motion.div>
        ),
      });
    } catch (error) {
      toast.error("Falha ao publicar ❌", {
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handle}
      disabled={isLoading}
      className={`${className} ${isLoading ? "cursor-not-allowed opacity-50 flex items-center justify-center gap-2" : ""}`}
    >
      {isLoading ? (
        <>
          <Image
            src="/assets/loading.svg"
            alt="Carregando"
            width={20}
            height={20}
            className="animate-spin"
          />
          <span>Publicando...</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
}
