"use client";

import { sidebarLinks } from "@/constants";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

function Bottombar() {
  const pathname = usePathname();
  const { userId, isLoaded } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // 🔔 Busca o contador de notificações
  useEffect(() => {
    if (!userId) return;

    const fetchUnread = async () => {
      try {
        const res = await fetch(`/api/user/${userId}/unread-activity`);
        const data = await res.json();
        if (data.success) setUnreadCount(data.unreadCount || 0);
      } catch (err) {
        console.error("Erro ao buscar contador de notificações:", err);
      }
    };

    fetchUnread();
    window.addEventListener("notifications:update", fetchUnread);
    return () => window.removeEventListener("notifications:update", fetchUnread);
  }, [userId]);

  if (!isLoaded) return null;

  // Substitui "/profile" pelo perfil real do usuário
  const linksWithUser = sidebarLinks.map((link) => {
    if (link.route === "/profile" && userId) {
      return { ...link, route: `/profile/${userId}` };
    }
    return link;
  });

  return (
    <section className="bottombar">
      <div className="bottombar-container">
        {linksWithUser.map((link) => {
          const isActive =
            (pathname.includes(link.route) && link.route.length > 1) ||
            pathname === link.route;

          return (
            <Link
              href={link.route}
              key={link.label}
              className={`bottombar_link noTextDecoration ${
                isActive ? "bg-primary-500" : ""
              }`}
            >
              <div className="relative">
                <Image
                  src={link.imgURL}
                  alt={link.label}
                  width={24}
                  height={24}
                />

                {/* 🔴 Badge de notificações */}
                {link.route === "/activity" && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-semibold rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>

              <p className="text-subtle-medium text-light-1 max-sm-hidden">
                {link.label.split(/\s+/)[0]}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default Bottombar;