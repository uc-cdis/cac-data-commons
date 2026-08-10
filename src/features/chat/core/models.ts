// Aliases from the agent's model-config.yaml.
// TODO: fetch from the commons (an endpoint) so this can't drift.
export const CHAT_MODELS: readonly string[] = [
  "(On-Prem) GPT OSS 120B",
  "(Bedrock) GPT OSS 120B",
  "(On-Prem) Qwen3.6 27b",
];

export const DEFAULT_CHAT_MODEL = CHAT_MODELS[0];
