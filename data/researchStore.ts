export const RESEARCH_EVENT = "quant-research-store-updated";
const RUNS_KEY = "quant-research-runs-v1";
const EXPERIMENTS_KEY = "quant-research-experiments-v1";

export type CodeRunRecord = { id: string; lessonId: string; createdAt: string; code: string; result: unknown; verified: boolean };
export type ExperimentRecord = { id: string; lessonId: string; createdAt: string; name: string; parameter: number; unit: string; label: string; result: unknown; baseline: unknown };

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(key) ?? "[]") as T[]; } catch { return []; }
}

function write<T>(key: string, values: T[]) {
  window.localStorage.setItem(key, JSON.stringify(values));
  window.dispatchEvent(new CustomEvent(RESEARCH_EVENT));
}

export const readCodeRuns = () => read<CodeRunRecord>(RUNS_KEY);
export const readExperiments = () => read<ExperimentRecord>(EXPERIMENTS_KEY);

export function saveCodeRun(record: Omit<CodeRunRecord, "id" | "createdAt">) {
  const next: CodeRunRecord = { ...record, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  write(RUNS_KEY, [next, ...readCodeRuns()].slice(0, 300));
  return next;
}

export function saveExperiment(record: Omit<ExperimentRecord, "id" | "createdAt">) {
  const next: ExperimentRecord = { ...record, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  write(EXPERIMENTS_KEY, [next, ...readExperiments()].slice(0, 300));
  return next;
}

export function renameExperiment(id: string, name: string) { write(EXPERIMENTS_KEY, readExperiments().map((item) => item.id === id ? { ...item, name } : item)); }
export function removeExperiment(id: string) { write(EXPERIMENTS_KEY, readExperiments().filter((item) => item.id !== id)); }
