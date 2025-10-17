"use client"

import { sidebarLinks } from "@/constants/index.js"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { SignedIn, SignOutButton } from "@clerk/nextjs"

function LeftSidebar() {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <section className="custom-scrollbar leftsidebar">
            <div className="flex-column">
                {sidebarLinks.map((link) => {
                    const isActive = (pathname.includes(link.route) && link.route.length > 1) || pathname === link.route;

                    return (
                        <Link
                            href={link.route}
                            key={link.label}
                            className={`leftsidebar_link noTextDecoration ${isActive && 'bg-primary-500'}`}
                        >
                            <Image
                                src={link.imgURL}
                                alt={link.label}
                                width={24}
                                height={24}
                            />

                            <p className="text-light-1 max-lg-hidden">{link.label}</p>
                        </Link>
                    )
                })}
            </div>

            <div className="leftsidebar_signout">
                <SignedIn>
                    <SignOutButton redirectUrl="/sign-in">
                        <div className="signOutButton-leftsiderbar">
                            <Image
                                src="/assets/logout.svg"
                                alt="logout"
                                width={24}
                                height={24}
                            />
                            
                            <p className="text-light-2 max-lg-hidden">Logout</p>
                        </div>
                    </SignOutButton>
                </SignedIn>
            </div>
        </section>
    )
}

export default LeftSidebar