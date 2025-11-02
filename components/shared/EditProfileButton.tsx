"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Props {
  userId: string;
}

export default function EditProfileButton({ userId }: Props) {
  return (
    <Link href={`/profile/${userId}/edit`}>
      <Button
        className="cursor-pointer px-4 py-2 rounded-md bg-primary-500 text-dark-1"
      >
        Editar Perfil
      </Button>
    </Link>
  );
}
