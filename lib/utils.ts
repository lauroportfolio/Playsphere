// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// shadcn-ui helper
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isBase64Image(imageData: string) {
  const base64Regex = /^data:image\/(png|jpe?g|gif|webp);base64,/;
  return base64Regex.test(imageData);
}

export function formatDateString(dateString: string) {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString(undefined, options);
  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${time} - ${formattedDate}`;
}

export function formatThreadCount(count: number): string {
  if (count === 0) {
    return "No Threads";
  } else {
    const threadCount = count.toString().padStart(2, "0");
    const threadWord = count === 1 ? "Thread" : "Threads";
    return `${threadCount} ${threadWord}`;
  }
}

// ─── Filtro anti-toxidade usando bad-words ───
import { Filter } from "bad-words";  // import correto para versão 4.x
const badWordsFilter = new Filter({ placeHolder: "***" });

// Lista custom de termos ofensivos em português
const extraBannedWordsPT = [
  "puta",
  "filha da puta",
  "caralho",
  "merda",
  "porra",
  "foda-se",
  "vai tomar no cu",
  "cacete",
  "babaca",
  "corno",
  "arrombado",
  "fdp",
  "vtnc",
  "estupro"
];

// Lista custom de termos ofensivos em inglês
const extraBannedWordsEN = [
  "fuck",
  "shit",
  "asshole",
  "bastard",
  "bitch",
  "dickhead",
  "cunt",
  "motherfucker",
  "dick",
  "piss off",
  "nigger"
];

// Adiciona essas palavras ao filtro
badWordsFilter.addWords(...extraBannedWordsPT);
badWordsFilter.addWords(...extraBannedWordsEN);

// Funções de uso exportadas
export function containsBadWords(text: string): boolean {
  return badWordsFilter.isProfane(text);
}

export function cleanBadWords(text: string): string {
  return badWordsFilter.clean(text);
}

export function formatRelativeOrDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const oneMin = 1000 * 60;
  const oneHour = oneMin * 60;
  const oneDay = oneHour * 24;

  if (diffMs < oneHour) {
    const minutes = Math.floor(diffMs / oneMin);
    if (minutes >= 1) return `há ${minutes}m`;
    const seconds = Math.floor(diffMs / 1000);
    return `há ${seconds}s`;
  }

  if (diffMs < oneDay) {
    const hours = Math.floor(diffMs / oneHour);
    return `há ${hours}h`;
  }

  // se for mais de 24h
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
  };
  if (date.getFullYear() !== now.getFullYear()) {
    options.year = "numeric";
  }
  return date.toLocaleDateString(undefined, options);
}