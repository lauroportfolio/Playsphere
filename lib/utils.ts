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

// 🔤 Normaliza texto removendo acentos e colocando em minúsculas
function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "");
}

// 🔎 Verifica se alguma frase da lista aparece no texto
function anyMatch(text: string, list: string[]) {
  for (const phrase of list) {
    const p = phrase.toLowerCase();
    if (text.includes(p)) return true;
  }
  return false;
}

export function detectSelfHarmRisk(input: string): boolean {
  if (!input) return false;

  const text = normalize(input);

  // -------------------------------------
  // PT/BR – risco alto (mais direto)
  // -------------------------------------
  const PT_HIGH = [
    "quero me matar",
    "vou me matar",
    "vou me suicidar",
    "quero me suicidar",
    "vou morrer",
    "quero morrer",
    "nao quero mais viver",
    "nao aguento mais viver",
    "acabar com minha vida",
    "tirar minha vida",
    "tirar a minha vida",
    "morrer agora",
    "acabar com tudo",
    "acabar com a minha vida",
  ];

  // -------------------------------------
  // PT/BR – risco médio
  // -------------------------------------
  const PT_MEDIUM = [
    "nao aguento mais",
    "nao vejo saida",
    "quero sumir",
    "quero desaparecer",
    "desisti da vida",
    "estou pensando em morrer",
    "estou com depressao",
    "depressao pesada",
  ];

  // -------------------------------------
  // PT/BR – risco leve
  // -------------------------------------
  const PT_LOW = [
    "depressao",
    "deprimido",
    "deprimida",
    "me sinto vazio",
    "me sinto sem esperanca",
    "me sinto sozinho",
    "triste demais",
    "muito triste",
    "to mal",
    "estou mal",
    "dor emocional",
    "nao presto",
    "odio de mim mesmo",
    "ninguem se importa",
    "quero desistir",
    "nao quero viver",
    "nao tenho motivos",
    "sofrimento",
  ];

  // -------------------------------------
  // INGLÊS – risco alto
  // -------------------------------------
  const EN_HIGH = [
    "i want to die",
    "i want to kill myself",
    "im going to kill myself",
    "i will kill myself",
    "im going to die",
    "i want to end my life",
    "end my life",
  ];

  // -------------------------------------
  // INGLÊS – risco médio
  // -------------------------------------
  const EN_MEDIUM = [
    "i cant go on",
    "i cant live like this",
    "i want to disappear",
    "i want to be gone",
    "i want to end it all",
  ];

  // -------------------------------------
  // INGLÊS – risco leve
  // -------------------------------------
  const EN_LOW = [
    "depressed",
    "depression",
    "feeling hopeless",
    "feeling empty",
    "feeling alone",
    "very sad",
  ];

  // -------------------------------------
  // SEU detector original preservado
  // -------------------------------------
  const ORIGINAL = [
    "morrer",
    "morrer agora",
    "quero morrer",
    "acabar com tudo",
    "não aguento mais",
    "me matar",
    "tirar minha vida",
    "quero sumir",
    "depressão",
    "estou com depressão",
    "me sinto sozinho",
    "não vejo saída",
    "não quero viver",
    "não tenho motivos",
    "sofrimento",
    "dor emocional",
    "não presto",
    "ódio de mim mesmo",
    "ninguém se importa",
    "tô mal",
    "estou mal",
    "quero desistir",
    "acabar com a minha vida",
  ].map(normalize);

  // -------------------------------------
  // VERIFICAÇÃO EM NÍVEIS
  // (basta dar match em qualquer nível)
  // -------------------------------------

  if (anyMatch(text, PT_HIGH) || anyMatch(text, EN_HIGH)) return true;
  if (anyMatch(text, PT_MEDIUM) || anyMatch(text, EN_MEDIUM)) return true;
  if (anyMatch(text, PT_LOW) || anyMatch(text, EN_LOW)) return true;
  if (anyMatch(text, ORIGINAL)) return true;

  return false;
}