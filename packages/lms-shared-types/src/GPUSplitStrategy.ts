import { z } from "zod";
import { type GPUSetting } from ".";

export type GPUSplitStrategyType = "evenly" | "priorityOrder";
export const gpuSplitStrategyTypeSchema = z.enum(["evenly", "priorityOrder"]);

/**
 * Settings related to splitting work across multiple GPUs.
 *
 * Not currently exposed through the SDK, deduced from GPUSetting.
 *
 * @public
 */
export type GPUSplitStrategy = {
  /**
   * Different modalities for splitting work across multiple GPUs.
   */
  type: GPUSplitStrategyType;
  /**
   * Indices of GPUs to disable.
   */
  disabledGpus: number[];
  /**
   * GPU indices in order of priority.
   */
  priority: number[];
};
export const gpuSplitStrategySchema = z.object({
  type: gpuSplitStrategyTypeSchema,
  disabledGpus: z.array(z.number().int().min(0)),
  priority: z.array(z.number().int().min(0)),
});

export function convertGPUSettingToGPUSplitStrategy(gpuSetting?: GPUSetting): GPUSplitStrategy {
  return {
    type:
      gpuSetting?.splitStrategy == "favorMainGpu"
        ? "priorityOrder"
        : gpuSetting?.splitStrategy ?? "evenly",
    disabledGpus: gpuSetting?.disabledGpus ?? [],
    priority: gpuSetting?.mainGpu ? [gpuSetting.mainGpu] : [],
  };
}
