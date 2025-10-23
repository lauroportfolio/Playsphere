"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton, SignedIn, useAuth } from "@clerk/nextjs";

import { sidebarLinks } from "@/constants";

function LeftSidebar() {
  const pathname = usePathname();
  const { userId, isLoaded } = useAuth(); 

  if (!isLoaded || !userId) return null;

  const linksWithUser = sidebarLinks.map((link) => {
    if (link.route === "/profile") {
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
              <Image src={link.imgURL} alt={link.label} width={24} height={24} />
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
      </div>
    </section>
  );
}

export default LeftSidebar;
