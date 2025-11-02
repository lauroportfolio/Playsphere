"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Props {
  onConfirm: () => Promise<void>;
}

export default function SaveProfileButton({ onConfirm }: Props) {
  const handleClick = async () => {
    try {
      await onConfirm();
      toast.success("✅ Perfil atualizado com sucesso!", {
        duration: 3000,
        position: "top-center",
      });
    } catch (err) {
      console.error(err);
      toast.error("❌ Erro ao salvar alterações.", {
        duration: 3000,
        position: "top-center",
      });
    }
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      className="w-full bg-primary-500 text-white hover:bg-primary-600"
    >
      Confirmar
    </Button>
  );
}
