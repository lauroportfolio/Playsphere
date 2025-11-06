"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton, SignedIn, SignedOut, useAuth } from "@clerk/nextjs";
import { sidebarLinks } from "@/constants";
import { useEffect, useState } from "react";

function LeftSidebar() {
  const pathname = usePathname();
  const { userId, isLoaded } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // 🧩 Novo: busca contador real de notificações
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

    // Atualiza sempre que notificações mudam
    window.addEventListener("notifications:update", fetchUnread);
    return () => window.removeEventListener("notifications:update", fetchUnread);
  }, [userId]);

  if (!isLoaded) return null;

  const linksWithUser = sidebarLinks.map((link) => {
    if (link.route === "/profile" && userId) {
      return { ...link, route: `/profile/${userId}` };
    }
    return link;
  });

  return (
    <section className="custom-scrollbar leftsidebar">
      <div className="flex-column">
        {linksWithUser.map((link) => {
          const isActive =
            (pathname.includes(link.route) && link.route.length > 1) ||
            pathname === link.route;

          return (
            <Link
              href={link.route}
              key={link.label}
              className={`leftsidebar_link noTextDecoration ${
                isActive ? "bg-primary-500" : ""
              }`}
            >
              <div className="relative">
                <Image src={link.imgURL} alt={link.label} width={24} height={24} />

                {/* 🔴 Badge de notificação */}
                {link.route === "/activity" && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-semibold rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>

              <p className="text-light-1 max-lg-hidden">{link.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="leftsidebar_signout">
        <SignedIn>
          <SignOutButton redirectUrl="/sign-in">
            <div className="signOutButton-leftsiderbar">
              <Image src="/assets/logout.svg" alt="logout" width={24} height={24} />
              <p className="text-light-2 max-lg-hidden">Sair</p>
            </div>
          </SignOutButton>
        </SignedIn>

        <SignedOut>
          <Link href="/sign-in" className="signOutButton-leftsiderbar">
            <Image src="/assets/logout.svg" alt="login" width={24} height={24} />
            <p className="text-light-2 max-lg-hidden">Entrar</p>
          </Link>
        </SignedOut>
      </div>
    </section>
  );
}

export default LeftSidebar;