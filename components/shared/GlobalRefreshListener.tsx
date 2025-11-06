"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * 🔄 Atualiza automaticamente a página quando eventos importantes ocorrem
 * (repost, like, delete, comment, etc.)
 * Também faz refresh leve a cada 30s.
 */
export default function GlobalRefreshListener() {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => router.refresh();

    // 🎯 Eventos customizados emitidos no client
    const events = [
      "thread:refresh",   // usado por ações de criação/exclusão
      "repost:updated",   // usado pelo RepostButton
      "like:updated",     // caso queira expandir depois
      "comment:updated",  // idem
    ];

    // Escuta todos os eventos relevantes
    events.forEach((evt) => window.addEventListener(evt, refresh));

    // 🔁 Atualiza a cada 30 segundos (auto-refresh leve)
    const timer = setInterval(refresh, 30000);

    // Cleanup
    return () => {
      events.forEach((evt) => window.removeEventListener(evt, refresh));
      clearInterval(timer);
    };
  }, [router]);

  return null;
}
