"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

/**
 * Esse componente é montado automaticamente dentro da página `/activity`.
 * Assim que a página abre, ele:
 *  1️⃣ Marca todas as notificações como lidas no backend;
 *  2️⃣ Zera o contador salvo no localStorage;
 *  3️⃣ Dispara o evento "notifications:update" para atualizar sidebar e bottombar.
 */
export default function ActivityClient() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !user) return;

    const markAsRead = async () => {
      try {
        // 🧭 Faz o POST para marcar notificações como lidas
        const res = await fetch(
          `/api/user/${user.id}/mark-activity-read`,
          { method: "POST" }
        );

        const data = await res.json();
        if (data.success) {
          console.log(`🔔 ${data.modifiedCount} notificações marcadas como lidas.`);

          // 🧹 Zera o contador local
          localStorage.setItem("unreadCount", "0");

          // 🪄 Atualiza UI das barras
          window.dispatchEvent(new Event("notifications:update"));
        } else {
          console.warn("⚠️ Falha ao marcar como lidas:", data.error);
        }
      } catch (error) {
        console.error("Erro ao marcar notificações como lidas:", error);
        toast.error("Falha ao atualizar notificações ❌");
      }
    };

    markAsRead();
  }, [isLoaded, user]);

  return null; // não renderiza nada visível
}