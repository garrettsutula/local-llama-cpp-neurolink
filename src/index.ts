import "dotenv/config";
import { NeuroLink } from "@juspay/neurolink";

import { inputs, PromptSchema } from "./settings/example.js";

const neurolink = new NeuroLink();

async function structuredOutput() {
  const result = await neurolink.generate({
    input: { text: inputs[0] },
    schema: PromptSchema,
    output: { format: "json"},
    provider: "openai-compatible",
    temperature: 0.7,
    maxTokens: 500,
  });

  const { answer } = JSON.parse(result.content) as Record<string,any>;

  console.log(answer);
}

(async () => {
  await structuredOutput();
})();