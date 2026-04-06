import "dotenv/config";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { NeuroLink } from "@juspay/neurolink";
import { z } from "zod";
import { validateInput, InputPayload } from "./schema.js";

const neurolink = new NeuroLink();

// CLI argument parsing (Node.js built-in -- argument convention)
const args = process.argv.slice(2);
const inputJsonPath = args[0];

if (!inputJsonPath) {
  console.error("Usage: npx tsx src/index.ts <input.json>");
  process.exit(1);
}

let inputData: InputPayload;
try {
  const raw = readFileSync(inputJsonPath, "utf-8");
  const parsed = JSON.parse(raw);
  inputData = validateInput(parsed);
} catch (err) {
  if (err instanceof Error) {
    console.error(err.message);
  } else {
    console.error("Failed to read or parse input JSON");
  }
  process.exit(1);
}

function buildPrompt(input: string): string {
  const sep = inputData.separator ?? "\n";
  const parts: string[] = [];
  if (inputData.prefix) parts.push(inputData.prefix);
  if (inputData.examples?.length) parts.push(inputData.examples.join(sep));
  parts.push(input);
  return parts.join(sep);
}

function buildPromptSchema(description: string) {
  return z.object({
    output: z.string().describe(description),
  });
}

async function generateForInput(input: string): Promise<string> {
  const text = buildPrompt(input);
  const result = await neurolink.generate({
    input: { text },
    schema: buildPromptSchema(inputData.outputDescription),
    output: { format: "json" },
    provider: "openai-compatible",
    temperature: 0.7,
    maxTokens: 500,
  });

  const parsed = JSON.parse(result.content) as Record<string, unknown>;
  return (parsed[Object.keys(parsed)[0]] as string) ?? "";
}

async function run() {
  const outputs: string[] = [];

  for (const input of inputData.inputs) {
    for (let i = 0; i < inputData.iterationsPerInput; i++) {
      process.stdout.write(`[${inputData.inputs.indexOf(input) + 1}/${inputData.inputs.length}] iteration ${i + 1}/${inputData.iterationsPerInput}... `);
      const answer = await generateForInput(input);
      outputs.push(answer);
      console.log("done");
    }
  }

  const dir = inputData.outputFilePath.replace(/[/\\][^/\\]*$/, "") || ".";
  if (dir !== ".") mkdirSync(dir, { recursive: true });
  writeFileSync(inputData.outputFilePath, outputs.join("\n") + "\n");
  console.log(`Wrote ${outputs.length} outputs to ${inputData.outputFilePath}`);
  process.exit(0);
}

run().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
