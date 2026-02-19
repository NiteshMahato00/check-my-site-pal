import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Link, Mail, Search, AlertTriangle, ChevronRight, Plus, X } from "lucide-react";
import cyberHero from "@/assets/cyber-hero.jpg";

type InputEntry = {
  id: string;
  value: string;
  type: "url" | "email";
};

const Index = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<InputEntry[]>([
    { id: "1", value: "", type: "url" },
  ]);
  const [error, setError] = useState("");

  const addEntry = (type: "url" | "email") => {
    setEntries((prev) => [
      ...prev,
      { id: Date.now().toString(), value: "", type },
    ]);
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const updateEntry = (id: string, value: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, value } : e))
    );
    setError("");
  };

  const handleAnalyze = () => {
    const filled = entries.filter((e) => e.value.trim());
    if (filled.length === 0) {
      setError("Please enter at least one URL or email to analyze.");
      return;
    }
    const inputs = filled.map((e) => e.value.trim());
    navigate("/detection", { state: { inputs } });
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Hero background */}
      <div className="absolute inset-0 z-0">
        <img
          src={cyberHero}
          alt="Cyber security background"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
      </div>

      {/* Scanline overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-scanline w-full" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Shield className="w-8 h-8 text-primary animate-flicker" />
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
          </div>
          <div>
            <span className="text-xl font-bold text-primary text-glow-cyan tracking-widest">
              PHISHGUARD
            </span>
            <div className="mono text-[10px] text-muted-foreground tracking-widest">
              THREAT DETECTION SYSTEM v2.1
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 mono text-xs text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full bg-safe animate-pulse" />
          SYSTEM ONLINE
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16">
        {/* Title block */}
        <div className="text-center mb-12 animate-slide-up">
          <div className="mono text-xs text-primary/70 tracking-[0.4em] mb-3">
            INITIALIZE THREAT SCAN
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-foreground leading-tight mb-4">
            DETECT{" "}
            <span className="text-primary text-glow-cyan">PHISHING</span>
            <br />
            INSTANTLY
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto font-medium">
            Enter website URLs or email addresses to scan for phishing attempts, malicious patterns, and cyber threats.
          </p>
        </div>

        {/* Input panel */}
        <div className="w-full max-w-2xl">
          <div className="panel-glow p-6 md:p-8 space-y-4">
            {/* Panel header */}
            <div className="flex items-center gap-2 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
              <span className="mono text-xs text-primary/70 tracking-widest px-3">
                INPUT TARGETS
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/50 to-transparent" />
            </div>

            {/* Entries */}
            <div className="space-y-3">
              {entries.map((entry, index) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 group animate-slide-up"
                >
                  {/* Type icon */}
                  <div className="flex-shrink-0 w-9 h-9 rounded border border-border flex items-center justify-center bg-muted/50">
                    {entry.type === "url" ? (
                      <Link className="w-4 h-4 text-primary" />
                    ) : (
                      <Mail className="w-4 h-4 text-primary" />
                    )}
                  </div>

                  {/* Input */}
                  <input
                    type="text"
                    value={entry.value}
                    onChange={(e) => updateEntry(entry.id, e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                    placeholder={
                      entry.type === "url"
                        ? "https://example.com  or  suspicious-site.tk"
                        : "user@example.com  or  noreply@phish.ml"
                    }
                    className="flex-1 mono text-sm bg-muted/40 border border-border hover:border-primary/40 focus:border-primary focus:outline-none rounded px-4 py-2.5 text-foreground placeholder:text-muted-foreground/40 transition-colors"
                  />

                  {/* Remove button */}
                  {entries.length > 1 && (
                    <button
                      onClick={() => removeEntry(entry.id)}
                      className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded border border-border/50 text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm mono">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* Add more buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => addEntry("url")}
                className="flex items-center gap-1.5 text-xs mono text-muted-foreground hover:text-primary border border-border/50 hover:border-primary/40 rounded px-3 py-1.5 transition-colors"
              >
                <Plus className="w-3 h-3" />
                ADD URL
              </button>
              <button
                onClick={() => addEntry("email")}
                className="flex items-center gap-1.5 text-xs mono text-muted-foreground hover:text-primary border border-border/50 hover:border-primary/40 rounded px-3 py-1.5 transition-colors"
              >
                <Plus className="w-3 h-3" />
                ADD EMAIL
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-border/40 pt-4 mt-2">
              {/* Analyze button */}
              <button
                onClick={handleAnalyze}
                className="w-full group relative flex items-center justify-center gap-3 py-4 rounded font-bold tracking-widest text-sm uppercase overflow-hidden transition-all duration-300
                  bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan"
              >
                <Search className="w-5 h-5" />
                ANALYZE THREATS
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: "Patterns Detected", value: "500+" },
              { label: "Accuracy Rate", value: "94.7%" },
              { label: "Threats Blocked", value: "∞" },
            ].map((stat) => (
              <div key={stat.label} className="panel text-center py-3 px-2">
                <div className="text-xl font-black text-primary text-glow-cyan">{stat.value}</div>
                <div className="mono text-[10px] text-muted-foreground tracking-widest mt-0.5">
                  {stat.label.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-4 border-t border-border/30">
        <p className="mono text-xs text-muted-foreground/50 tracking-widest">
          PHISHGUARD — POWERED BY HEURISTIC THREAT INTELLIGENCE
        </p>
      </footer>
    </div>
  );
};

export default Index;
