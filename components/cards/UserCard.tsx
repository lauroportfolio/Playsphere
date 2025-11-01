"use client"

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

interface Props {
    id: string;
    name: string;
    username: string;
    imgUrl: string;
    personType: string;
}

const UserCard = ({
    id,
    name,
    username,
    imgUrl,
    personType
}: Props) => {
    const router = useRouter();

    return (
        <article className="user-card">
            <div className="user-card_avatar">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
                    <Image
                        src={imgUrl}
                        alt="logo"
                        fill
                        style={{ flexShrink: 0 }}
                        className="object-cover object-center"
                    />
                </div>

                <div className="flex-1 text-ellipsis">
                    <h4 className="base-semibold text-light-1">{name}</h4>
                    <p className="small-medium text-gray-1">@{username}</p>
                </div>
            </div>

            <Button className="user-card_btn cursor-pointer" onClick={() => router.push(`/profile/${id}`)}>
                View
            </Button>
        </article>
    )
}

export default UserCard