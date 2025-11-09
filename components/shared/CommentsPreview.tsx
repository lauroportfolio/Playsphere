"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  targetThreadId: string;
  commenters: { id?: string; image?: string; name?: string }[];
  commentsCount: number;
}

export default function CommentsPreview({ targetThreadId, commenters, commentsCount }: Props) {
  const pathname = usePathname();

  // Se estamos na página /thread/[id] do mesmo thread, não mostrar
  if (pathname === `/thread/${targetThreadId}`) {
    return null;
  }

  return (
    <div className="ml-1 mt-3 flex items-center gap-0.5">
      <div className="flex -space-x-3">
        {commenters.map((author, idx) => (
          <div
            key={idx}
            className={`${idx !== 0 ? "-ml-1" : ""} w-6 h-6 rounded-full overflow-hidden`}
          >
            <Image
              src={author.image || "/assets/user.svg"}
              alt={author.name || "Usuário"}
              width={24}
              height={24}
              className="object-cover"
            />
          </div>
        ))}
      </div>

      <Link href={`/thread/${targetThreadId}`}>
        <span className="text-gray-1 text-sm ml-2 cursor-pointer">
          {commentsCount} comentário{commentsCount > 1 ? "s" : ""}
        </span>
      </Link>
    </div>
  );
}
