import { z } from "zod";

export const diagnosticsLogEventDataSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("llm.prediction"),
    modelPath: z.string(),
    modelIdentifier: z.string(),
    input: z.string(),
  }),
]);
export type DiagnosticsLogEventData = z.infer<typeof diagnosticsLogEventDataSchema>;

export const diagnosticsLogEventSchema = z.object({
  timestamp: z.number(),
  data: diagnosticsLogEventDataSchema,
});
export type DiagnosticsLogEvent = z.infer<typeof diagnosticsLogEventSchema>;
