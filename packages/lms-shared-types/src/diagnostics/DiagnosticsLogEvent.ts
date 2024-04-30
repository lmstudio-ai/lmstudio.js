import { z } from "zod";

export const diagnosticsLogEventDataSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("llm.prediction.input"),
    modelPath: z.string(),
    modelIdentifier: z.string(),
    input: z.string(),
  }),
]);
/**
 * @public
 */
export type DiagnosticsLogEventData = {
  type: "llm.prediction.input";
  modelPath: string;
  modelIdentifier: string;
  input: string;
};

export const diagnosticsLogEventSchema = z.object({
  timestamp: z.number(),
  data: diagnosticsLogEventDataSchema,
});
/**
 * @public
 */
export type DiagnosticsLogEvent = {
  timestamp: number;
  data: DiagnosticsLogEventData;
};
