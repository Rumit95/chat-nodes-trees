import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AiProvider = "openai" | "gemini";

export interface AiSettings {
  provider: AiProvider;
  apiKey: string;
}

const STORAGE_KEY = "chatnodes.aiSettings";

export const PROVIDER_LABELS: Record<AiProvider, string> = {
  openai: "OpenAI",
  gemini: "Google Gemini",
};

function loadSettings(): AiSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AiSettings>;
      if (parsed && (parsed.provider === "openai" || parsed.provider === "gemini")) {
        return { provider: parsed.provider, apiKey: parsed.apiKey ?? "" };
      }
    }
  } catch {
    /* ignore corrupt storage */
  }
  return { provider: "openai", apiKey: "" };
}

interface AiSettingsContextValue {
  settings: AiSettings;
  hasKey: boolean;
  saveSettings: (next: AiSettings) => void;
}

const AiSettingsContext = createContext<AiSettingsContextValue | null>(null);

export function AiSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AiSettings>({ provider: "openai", apiKey: "" });

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const saveSettings = useCallback((next: AiSettings) => {
    const cleaned: AiSettings = { provider: next.provider, apiKey: next.apiKey.trim() };
    setSettings(cleaned);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    } catch {
      /* storage full / unavailable */
    }
  }, []);

  const value = useMemo<AiSettingsContextValue>(
    () => ({ settings, hasKey: settings.apiKey.trim().length > 0, saveSettings }),
    [settings, saveSettings],
  );

  return <AiSettingsContext.Provider value={value}>{children}</AiSettingsContext.Provider>;
}

export function useAiSettings(): AiSettingsContextValue {
  const ctx = useContext(AiSettingsContext);
  if (!ctx) throw new Error("useAiSettings must be used within AiSettingsProvider");
  return ctx;
}