import { z } from "zod";
import { colorPaletteSchema, type ColorPalette } from "../ColorPalette";

/**
 * The style of a content block.
 *
 * @public
 */
export type ContentBlockStyle =
  | {
      type: "default";
    }
  | {
      type: "customLabel";
      label: string;
      color?: ColorPalette;
    }
  | {
      type: "thinking";
      done?: boolean;
      label?: string;
    };
export const contentBlockStyleSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("default"),
  }),
  z.object({
    type: z.literal("customLabel"),
    label: z.string(),
    color: z.optional(colorPaletteSchema),
  }),
  z.object({
    type: z.literal("thinking"),
    done: z.boolean().optional(),
    label: z.string().optional(),
  }),
]) as z.Schema<ContentBlockStyle>;
