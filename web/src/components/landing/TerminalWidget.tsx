import { useState, useEffect, useCallback } from "preact/hooks";
import copyIcon from "../../assets/icons/copy.svg?raw";

const COMMAND = "npx -y ccpoke";
const ACCENT_START = 7;
const TYPING_SPEED_MS = 65;
const TYPING_START_DELAY_MS = 500;

interface Props {
  copyLabel: string;
  copiedLabel: string;
}

export default function TerminalWidget({ copyLabel, copiedLabel }: Props) {
  const [copied, setCopied] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [started, setStarted] = useState(false);

  const typingComplete = charCount >= COMMAND.length;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCharCount(COMMAND.length);
      return;
    }
    const timer = setTimeout(() => setStarted(true), TYPING_START_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!started || typingComplete) return;
    const timer = setTimeout(() => setCharCount((c) => c + 1), TYPING_SPEED_MS);
    return () => clearTimeout(timer);
  }, [started, charCount, typingComplete]);

  const handleCopy = useCallback(async () => {
    if (!typingComplete || copied) return;
    try {
      await navigator.clipboard.writeText(COMMAND);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }, [typingComplete, copied]);

  return (
    <div
      onClick={handleCopy}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleCopy();
      }}
      aria-label={copied ? copiedLabel : copyLabel}
      class={`group bg-bg-code rounded-xl overflow-hidden mx-auto w-full border border-border ${
        typingComplete ? "cursor-pointer" : ""
      }`}
    >
      <div class="flex items-center justify-between px-4 py-2.5 bg-bg-code-2">
        <div class="flex gap-2">
          <i class="w-3 h-3 rounded-full block bg-[#FF5F57]" />
          <i class="w-3 h-3 rounded-full block bg-[#FEBC2E]" />
          <i class="w-3 h-3 rounded-full block bg-[#28C840]" />
        </div>
      </div>
      <div class="flex items-center justify-between gap-4 px-6 py-4">
        <div class="font-mono text-[1.05rem] sm:text-[1.15rem] text-term-text min-w-0">
          <span class="text-accent select-none mr-2.5">$</span>
          {!typingComplete ? (
            <span>
              {COMMAND.slice(0, Math.min(charCount, ACCENT_START))}
              {charCount > ACCENT_START && (
                <span class="text-accent">
                  {COMMAND.slice(ACCENT_START, charCount)}
                </span>
              )}
              <span class="terminal-cursor">▎</span>
            </span>
          ) : (
            <span class="inline-grid overflow-hidden">
              <span
                class={`col-start-1 row-start-1 transition-all duration-300 ease-out ${
                  copied ? "opacity-0 -translate-y-full" : "opacity-100 translate-y-0"
                }`}
              >
                npx -y <span class="text-accent">ccpoke</span>
              </span>
              <span
                class={`col-start-1 row-start-1 transition-all duration-300 ease-out ${
                  copied ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full"
                }`}
              >
                {copiedLabel}
              </span>
            </span>
          )}
        </div>
        <span
          class={`w-[18px] h-[18px] inline-flex shrink-0 transition-opacity duration-200 ${
            !typingComplete
              ? "opacity-0"
              : "opacity-40 group-hover:opacity-80"
          } ${copied ? "!opacity-80" : ""} text-term-dim`}
          dangerouslySetInnerHTML={{ __html: copyIcon }}
        />
      </div>
      <div aria-live="polite" class="sr-only">
        {copied ? copiedLabel : ""}
      </div>
    </div>
  );
}
