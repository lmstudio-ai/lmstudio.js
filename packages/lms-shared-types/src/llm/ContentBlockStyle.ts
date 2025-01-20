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
  }),
]) as z.Schema<ContentBlockStyle>;
