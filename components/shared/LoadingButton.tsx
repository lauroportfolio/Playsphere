"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface LoadingButtonProps {
  onClick: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export function LoadingButton({ onClick, children, className = "" }: LoadingButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // ← impede submit do formulário
    e.stopPropagation();

    if (isLoading) return;
    setIsLoading(true);

    try {
      await onClick();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"  // ← EVITA SUBMIT AUTOMÁTICO DO FORM
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
          <span>Verificando...</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
}