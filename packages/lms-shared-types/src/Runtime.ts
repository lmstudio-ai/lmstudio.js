import { z } from "zod";

export type AcceleratorType = "unknown" | "integratedGpu" | "dedicatedGpu";
export const acceleratorTypeSchema = z.enum(["unknown", "integratedGpu", "dedicatedGpu"]);

export interface Accelerator {
  name: string;
  deviceId: number;
  totalMemoryBytes: number;
  type: AcceleratorType;
}
export const acceleratorSchema = z.object({
  name: z.string(),
  deviceId: z.number().int(),
  totalMemoryBytes: z.number().int(),
  type: acceleratorTypeSchema,
});

export interface Runtime {
  key: string;
  name: string;
  accelerators: Array<Accelerator>;
  supports: Array<string>;
}
export const runtimeSchema = z.object({
  key: z.string(),
  name: z.string(),
  accelerators: z.array(acceleratorSchema),
});
