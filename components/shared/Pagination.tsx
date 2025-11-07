"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Props {
  pageNumber: number;
  isNext: boolean;
  path: string;
}

export default function Pagination({ pageNumber, isNext, path }: Props) {
  const router = useRouter();

  const navigateTo = (targetPage: number) => {
    if (targetPage > 1) {
      router.push(`/${path}?page=${targetPage}`);
    } else {
      router.push(`/${path}`);
    }
  };

  const handlePrev = () => {
    const prev = Math.max(1, pageNumber - 1);
    navigateTo(prev);
  };

  const handleNext = () => {
    const next = pageNumber + 1;
    navigateTo(next);
  };

  // Se não tem próxima página e estamos na página 1, não mostra nada
  if (!isNext && pageNumber === 1) return null;

  return (
    <div className="pagination mt-8 flex items-center justify-center gap-4">
      <Button
        onClick={handlePrev}
        disabled={pageNumber === 1}
        className="cursor-pointer bg-dark-3 hover:bg-dark-4 text-light-2 small-regular px-4 py-2 rounded-md"
      >
        Anterior
      </Button>

      <p className="small-semibold text-light-1">Página {pageNumber}</p>

      <Button
        onClick={handleNext}
        disabled={!isNext}
        className="cursor-pointer bg-[#877EFF] hover:bg-[#6c62d9] text-white small-regular px-4 py-2 rounded-md"
      >
        Próxima
      </Button>
    </div>
  );
}
