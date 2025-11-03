"use client";

import { sidebarLinks } from "@/constants";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

function Bottombar() {
  const pathname = usePathname();
  const { userId, isLoaded } = useAuth();

  if (!isLoaded) return null; // aguarda carregar

  // 🔹 Substitui "/profile" pelo perfil do usuário logado
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
              <Image
                src={link.imgURL}
                alt={link.label}
                width={24}
                height={24}
              />
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
