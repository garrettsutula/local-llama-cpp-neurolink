import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

export const InputSchema = {
  type: "object",
  properties: {
    outputFilePath: { type: "string", minLength: 1 },
    inputs: {
      type: "array",
      items: { type: "string", minLength: 1 },
      minItems: 1,
    },
    iterationsPerInput: { type: "integer", minimum: 1 },
    prefix: { type: "string" },
    examples: {
      type: "array",
      items: { type: "string" },
    },
    separator: { type: "string", default: "\n" },
    outputDescription: { type: "string", minLength: 1 },
  },
  required: ["outputFilePath", "inputs", "iterationsPerInput"],
  additionalProperties: false,
} as const;

export function validateInput(data: unknown) {
  const validate = ajv.compile(InputSchema);
  if (!validate(data)) {
    const errors = ajv.errorsText(validate.errors, { separator: "\n  " });
    throw new Error(`Input validation failed:\n  ${errors}`);
  }
  return data as InputPayload;
}

export interface InputPayload {
  outputFilePath: string;
  inputs: string[];
  iterationsPerInput: number;
  prefix?: string;
  examples?: string[];
  separator?: string;
  outputDescription: string;
}
