import { useEffect, useState } from "react";
import { KeyRound, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAiSettings, type AiProvider } from "@/lib/aiSettings";
import { validateApiKey } from "@/lib/ai.functions";

const PROVIDER_INFO: Record<
  AiProvider,
  { label: string; placeholder: string; model: string }
> = {
  openai: {
    label: "OpenAI",
    placeholder: "sk-...",
    model: "gpt-4o-mini",
  },
  gemini: {
    label: "Google Gemini",
    placeholder: "AIza...",
    model: "gemini-2.0-flash",
  },
};

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { settings, saveSettings } = useAiSettings();
  const [provider, setProvider] = useState<AiProvider>(settings.provider);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync local form state whenever the dialog is (re)opened.
  useEffect(() => {
    if (open) {
      setProvider(settings.provider);
      setApiKey(settings.apiKey);
      setError(null);
      setChecking(false);
    }
  }, [open, settings]);

  const info = PROVIDER_INFO[provider];

  const handleSave = async () => {
    const key = apiKey.trim();
    if (!key) return;
    setChecking(true);
    setError(null);
    try {
      const result = await validateApiKey({ data: { provider, apiKey: key } });
      if (!result.valid) {
        setError(result.error);
        return;
      }
      saveSettings({ provider, apiKey: key });
      toast.success("API key verified and saved");
      onOpenChange(false);
    } catch {
      setError("Couldn't verify the key right now. Try again.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" /> AI settings
          </DialogTitle>
          <DialogDescription>
            Bring your own API key. It’s stored only in this browser and sent securely with each
            request — never shared with anyone else.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Provider</Label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(PROVIDER_INFO) as AiProvider[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    provider === p
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-input bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {PROVIDER_INFO[p].label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-key">API key</Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              autoComplete="off"
              placeholder={info.placeholder}
              onChange={(e) => {
                setApiKey(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && apiKey.trim() && !checking) handleSave();
              }}
            />
            <p className="text-xs text-muted-foreground">
              Uses the <span className="font-medium text-foreground">{info.model}</span> model.
            </p>
            {error && (
              <p className="flex items-start gap-1.5 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={checking}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!apiKey.trim() || checking}>
            {checking && <Loader2 className="h-4 w-4 animate-spin" />}
            {checking ? "Verifying…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}