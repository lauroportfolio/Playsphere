"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "../ui/input";

interface Props {
  routeType: string;
}

function Searchbar({ routeType }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  // Debounce da busca (0.3s após digitar)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (search.trim()) {
        router.push(`/${routeType}?q=${search.trim()}`);
      } else {
        router.push(`/${routeType}`);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, routeType]);

  return (
    <div className="searchbar">
      <Image
        src="/assets/search-gray.svg"
        alt="Buscar"
        width={22}
        height={22}
        className="object-contain"
      />
      <Input
        id="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={
          routeType === "search"
            ? "Buscar usuários por nome ou @"
            : "Buscar comunidades"
        }
        className="no-focus searchbar_input"
      />
    </div>
  );
}

export default Searchbar;