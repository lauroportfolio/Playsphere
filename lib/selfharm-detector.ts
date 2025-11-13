// /lib/selfharm-detector.ts
// Detector simples de risco de auto-harm / suicídio.
// Não usa serviços externos — usa listas de gatilhos e regras heurísticas.
// Exporta: getRiskLevel(text) -> 'none'|'low'|'medium'|'high'
//          detectSelfHarmRisk(text) -> boolean (true se risk >= 'medium')

const PORTUGUESE_HIGH = [
  "quero me matar",
  "vou me matar",
  "vou me suicidar",
  "quero me suicidar",
  "vou morrer",
  "quero morrer",
  "não quero mais viver",
  "não aguento mais viver",
  "acabar com minha vida",
  "tirar minha vida",
];

const PORTUGUESE_MEDIUM = [
  "não aguento mais",
  "não aguento",
  "não vejo saída",
  "quero sumir",
  "quero desaparecer",
  "desisti da vida",
  "não quero viver",
  "estou pensando em morrer",
];

const PORTUGUESE_LOW = [
  "depressão",
  "deprimido",
  "deprimida",
  "me sinto vazio",
  "me sinto sem esperança",
  "me sinto sozinho",
  "triste demais",
  "muito triste",
];

const EN_HIGH = [
  "i want to die",
  "i want to kill myself",
  "i'm going to kill myself",
  "i'm going to die",
  "i will kill myself",
  "i will die",
];

const EN_MEDIUM = [
  "i can't go on",
  "i can't live like this",
  "i want to disappear",
  "i want to be gone",
  "i want to end it all",
];

const EN_LOW = [
  "depressed",
  "depression",
  "feeling hopeless",
  "feeling empty",
  "feeling alone",
  "very sad",
];

function normalize(text?: string) {
  return (text || "").toLowerCase().normalize("NFKD").replace(/\p{Diacritic}/gu, "");
}

function anyMatch(text: string, list: string[]) {
  for (const phrase of list) {
    // word boundary-like check: check phrase as substring, but ensure common separators
    const safe = phrase.toLowerCase();
    if (text.includes(safe)) return true;
  }
  return false;
}

export function getRiskLevel(rawText: string): "none" | "low" | "medium" | "high" {
  const text = normalize(rawText);

  // high
  if (anyMatch(text, [...PORTUGUESE_HIGH, ...EN_HIGH])) return "high";

  // medium
  if (anyMatch(text, [...PORTUGUESE_MEDIUM, ...EN_MEDIUM])) return "medium";

  // low
  if (anyMatch(text, [...PORTUGUESE_LOW, ...EN_LOW])) return "low";

  return "none";
}

// retorna true se risco for >= medium (configurável)
export function detectSelfHarmRisk(rawText: string): boolean {
  const level = getRiskLevel(rawText);
  return level === "medium" || level === "high";
}
