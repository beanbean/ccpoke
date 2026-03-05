const MODEL_PROVIDER_PREFIXES: Record<string, string> = {
  "claude-": "",
  "gpt-": "GPT-",
  "gemini-": "Gemini ",
  "deepseek-": "DeepSeek ",
  "mistral-": "Mistral ",
  "codestral-": "Codestral ",
  "grok-": "Grok ",
  "moonshot-": "Moonshot ",
  "qwen-": "Qwen ",
};

function prettifyModelSegment(segment: string): string {
  return segment
    .replace(/-/g, " ")
    .replace(/(\d+)\s(\d+)/g, "$1.$2")
    .replace(/(^| )[a-z]/g, (c) => c.toUpperCase());
}

export function formatModelName(model: string): string {
  const dashIndex = model.indexOf("-");
  if (dashIndex === -1) return prettifyModelSegment(model);

  const prefix = model.slice(0, dashIndex + 1);
  const display = MODEL_PROVIDER_PREFIXES[prefix];
  if (display === undefined) return prettifyModelSegment(model);

  const rest = model.slice(dashIndex + 1);
  return rest ? `${display}${prettifyModelSegment(rest)}` : model;
}
