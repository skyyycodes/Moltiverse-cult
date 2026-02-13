import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface Personality {
  name: string;
  symbol: string;
  style: string;
  systemPrompt: string;
  description: string;
}

let cachedPersonalities: Personality[] | null = null;

export function loadPersonalities(): Personality[] {
  if (cachedPersonalities) return cachedPersonalities;
  const path = join(__dirname, "../../data/personalities.json");
  const raw = readFileSync(path, "utf-8");
  cachedPersonalities = JSON.parse(raw) as Personality[];
  return cachedPersonalities;
}

export function getPersonality(index: number): Personality {
  const personalities = loadPersonalities();
  return personalities[index % personalities.length];
}
