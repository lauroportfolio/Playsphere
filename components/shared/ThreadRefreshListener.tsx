"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ThreadRefreshListener() {
  const router = useRouter();

  useEffect(() => {
    const handleRefresh = () => {
      // 🔁 Atualiza a home e qualquer lista de posts imediatamente
      router.refresh();
    };

    window.addEventListener("thread:refresh", handleRefresh);

    // 🔁 Atualiza também a cada 30s como fallback
    const timer = setInterval(() => {
      router.refresh();
    }, 10000);

    return () => {
      window.removeEventListener("thread:refresh", handleRefresh);
      clearInterval(timer);
    };
  }, [router]);

  return null;
}