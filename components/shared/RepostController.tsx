"use client";

import { useEffect, useState } from "react";
import RepostButton from "./RepostButton";

interface Props {
  threadId: string;          // id que o RepostButton usa para a API
  originalId?: string | null; // id do original caso este seja um repost view
  currentUserId: string;
  initialReposted: boolean;
  initialCount: number;
}

export default function RepostController({
  threadId,
  originalId,
  currentUserId,
  initialReposted,
  initialCount,
}: Props) {
  const [reposted, setReposted] = useState<boolean>(initialReposted);
  const [count, setCount] = useState<number>(initialCount);

  useEffect(() => {
    const handler = (ev: Event) => {
      const e = ev as CustomEvent;
      const d = e.detail || {};
      if (!d.threadId) return;

      // Se o evento veio do thread atual ou do original (repost view), respondemos
      const matches =
        d.threadId === threadId || (originalId && d.threadId === originalId);

      if (!matches) return;

      if (d.action === "repost") {
        setCount((c) => c + 1);
      } else if (d.action === "unrepost") {
        setCount((c) => Math.max(0, c - 1));
      }

      // se o evento foi provocado pelo mesmo usuário logado, atualizamos o estado 'filled'
      if (d.userId === currentUserId) {
        setReposted(d.action === "repost");
      } else {
        // para outros usuários, podemos opcionalmente forçar re-checagem (aqui assumimos que o contador já sinaliza mudanças)
        // se quiser forçar re-check do reposted por efeito colateral, poderia refetch do servidor
      }
    };

    window.addEventListener("repost:changed", handler as EventListener);
    window.addEventListener("repost:updated", handler as EventListener); // compatibilidade
    window.addEventListener("thread:refresh", handler as EventListener); // fallback

    return () => {
      window.removeEventListener("repost:changed", handler as EventListener);
      window.removeEventListener("repost:updated", handler as EventListener);
      window.removeEventListener("thread:refresh", handler as EventListener);
    };
  }, [threadId, originalId, currentUserId]);

  return (
    <RepostButton
      threadId={threadId}
      currentUserId={currentUserId}
      isReposted={reposted}
      initialCount={count}
    />
  );
}
