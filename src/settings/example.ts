import { z } from "zod";

import { Settings } from "../types";

export const PromptSchema = z.object({
  answer: z.string().describe("The answer to the question"),
});

export const inputs: string[] = ["What is the capital of France?"];


export const defaultSettings: Settings = {
  temperature: 0.7,
}
