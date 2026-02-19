import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Shield, ShieldAlert, CheckCircle2, XCircle,
  AlertTriangle, ChevronLeft, RotateCcw, Wifi,
} from "lucide-react";
import { analyze, type DetectionResult } from "@/lib/phishingDetector";

const SCAN_DURATION = 2200;

const ThreatMeter = ({ score }: { score: number }) => {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 300);
    return () => clearTimeout(timer);
  }, [score]);

  const color =
    score < 30
      ? "hsl(var(--safe))"
      : score < 60
      ? "hsl(var(--warning))"
      : "hsl(var(--destructive))";

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between mono text-xs text-muted-foreground">
        <span>THREAT LEVEL</span>
        <span style={{ color }}>{animated}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${animated}%`, background: color, boxShadow: `0 0 8px ${color}` }}
        />
      </div>
    </div>
  );
};

const ResultCard = ({
  result,
  index,
}: {
  result: DetectionResult;
  index: number;
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), SCAN_DURATION + index * 200);
    return () => clearTimeout(timer);
  }, [index]);

  if (!visible) return null;

  const isSafe = result.isSafe;

  return (
    <div
      className={`panel animate-reveal border ${
        isSafe
          ? "border-safe/30 shadow-[0_0_20px_hsl(145_70%_45%/0.1)]"
          : "border-destructive/30 shadow-[0_0_20px_hsl(0_85%_58%/0.1)]"
      } overflow-hidden`}
    >
      {/* Card header */}
      <div
        className={`flex items-center justify-between px-5 py-4 ${
          isSafe ? "bg-safe/5" : "bg-destructive/5"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {isSafe ? (
            <CheckCircle2 className="w-5 h-5 text-safe flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
          )}
          <span className="mono text-xs text-muted-foreground truncate">
            {result.type === "email" ? "EMAIL" : "URL"} &nbsp;—&nbsp;
            <span className="text-foreground">{result.input}</span>
          </span>
        </div>

        {/* Verdict badge */}
        <div
          className={`flex-shrink-0 ml-4 px-4 py-1.5 rounded text-xs font-black tracking-widest animate-flicker ${
            isSafe
              ? "bg-safe/20 text-safe border border-safe/40 text-glow-green"
              : "bg-destructive/20 text-destructive border border-destructive/40 text-glow-red"
          }`}
        >
          {isSafe ? "✓ GO AHEAD" : "✕ SPAM"}
        </div>
      </div>

      {/* Card body */}
      <div className="px-5 py-4 space-y-4">
        <ThreatMeter score={result.score} />

        <div className="space-y-2">
          <div className="mono text-[10px] text-muted-foreground tracking-widest">
            ANALYSIS FINDINGS
          </div>
          <ul className="space-y-1.5">
            {result.reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <AlertTriangle
                  className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                    isSafe ? "text-safe/60" : "text-warning"
                  }`}
                />
                <span className="text-muted-foreground">{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const ScanAnimation = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);

  const phases = [
    "INITIALIZING SCANNER...",
    "CHECKING DOMAIN REGISTRY...",
    "ANALYZING URL PATTERNS...",
    "CROSS-REFERENCING THREAT DATABASE...",
    "GENERATING THREAT REPORT...",
  ];

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / SCAN_DURATION) * 100, 100);
      setProgress(pct);
      setPhase(Math.floor((pct / 100) * (phases.length - 1)));
      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(onComplete, 100);
      }
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-10">
      {/* Pulsing rings */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-full border border-primary/30 animate-pulse-ring"
            style={{ animationDelay: `${i * 0.5}s` }}
          />
        ))}
        <div className="relative z-10 w-16 h-16 rounded-full bg-primary/10 border border-primary/50 flex items-center justify-center glow-cyan">
          <Wifi className="w-8 h-8 text-primary animate-pulse" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm space-y-3">
        <div className="flex justify-between mono text-xs text-muted-foreground">
          <span>SCANNING</span>
          <span className="text-primary">{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-100 ease-linear glow-cyan"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mono text-xs text-primary/70 text-center animate-flicker tracking-widest">
          {phases[phase]}
        </div>
      </div>
    </div>
  );
};

const Detection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const inputs: string[] = location.state?.inputs ?? [];
  const [scanning, setScanning] = useState(true);
  const [results, setResults] = useState<DetectionResult[]>([]);

  useEffect(() => {
    if (inputs.length === 0) {
      navigate("/");
      return;
    }
    const computed = inputs.map((inp) => analyze(inp));
    setResults(computed);
  }, []);

  const handleScanComplete = () => setScanning(false);

  const spamCount = results.filter((r) => !r.isSafe).length;
  const safeCount = results.filter((r) => r.isSafe).length;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Scanline */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-scanline w-full" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-border/40">
        <div className="flex items-center gap-3">
          <Shield className="w-7 h-7 text-primary animate-flicker" />
          <span className="text-lg font-black tracking-widest text-primary text-glow-cyan">
            PHISHGUARD
          </span>
        </div>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 mono text-xs text-muted-foreground hover:text-primary border border-border/50 hover:border-primary/40 rounded px-4 py-2 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          NEW SCAN
        </button>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 px-4 py-10 max-w-3xl mx-auto w-full">
        {scanning ? (
          <ScanAnimation onComplete={handleScanComplete} />
        ) : (
          <div className="space-y-8 animate-slide-up">
            {/* Page title */}
            <div className="text-center">
              <div className="mono text-xs text-primary/70 tracking-[0.4em] mb-2">
                THREAT ANALYSIS COMPLETE
              </div>
              <h1 className="text-4xl font-black text-foreground mb-2">
                SCAN{" "}
                <span className="text-primary text-glow-cyan">RESULTS</span>
              </h1>
            </div>

            {/* Summary */}
            {results.length > 1 && (
              <div className="grid grid-cols-2 gap-3">
                <div className="panel-glow text-center py-5 border-safe/30">
                  <div className="text-3xl font-black text-safe text-glow-green">
                    {safeCount}
                  </div>
                  <div className="mono text-xs text-muted-foreground tracking-widest mt-1">
                    SAFE — GO AHEAD
                  </div>
                </div>
                <div className="panel-glow text-center py-5 border-destructive/30">
                  <div className="text-3xl font-black text-destructive text-glow-red">
                    {spamCount}
                  </div>
                  <div className="mono text-xs text-muted-foreground tracking-widest mt-1">
                    THREATS — SPAM
                  </div>
                </div>
              </div>
            )}

            {/* Big single result for single scan */}
            {results.length === 1 && (
              <div
                className={`panel-glow text-center py-12 space-y-4 ${
                  results[0].isSafe
                    ? "border-safe/40 shadow-[0_0_60px_hsl(145_70%_45%/0.15)]"
                    : "border-destructive/40 shadow-[0_0_60px_hsl(0_85%_58%/0.15)]"
                }`}
              >
                {results[0].isSafe ? (
                  <>
                    <ShieldAlert className="w-16 h-16 text-safe mx-auto text-glow-green" />
                    <div className="text-6xl font-black text-safe text-glow-green animate-flicker tracking-widest">
                      GO AHEAD
                    </div>
                    <p className="text-muted-foreground">
                      This target appears to be <span className="text-safe font-bold">safe</span>. No significant phishing indicators were detected.
                    </p>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-16 h-16 text-destructive mx-auto" />
                    <div className="text-6xl font-black text-destructive text-glow-red animate-flicker tracking-widest">
                      SPAM
                    </div>
                    <p className="text-muted-foreground">
                      This target shows <span className="text-destructive font-bold">phishing indicators</span>. Do not click or interact with this link or email.
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Result cards */}
            <div className="space-y-4">
              {results.map((result, i) => (
                <ResultCard key={i} result={result} index={i} />
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/")}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded border border-border hover:border-primary/40 text-muted-foreground hover:text-primary mono text-sm tracking-widest transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                BACK TO HOME
              </button>
              <button
                onClick={() => {
                  setScanning(true);
                  setTimeout(() => setScanning(false), SCAN_DURATION);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded bg-primary text-primary-foreground hover:bg-primary/90 mono text-sm font-bold tracking-widest glow-cyan transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                RE-SCAN
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="relative z-10 text-center py-4 border-t border-border/30">
        <p className="mono text-xs text-muted-foreground/50 tracking-widest">
          PHISHGUARD — HEURISTIC ANALYSIS ENGINE
        </p>
      </footer>
    </div>
  );
};

export default Detection;
