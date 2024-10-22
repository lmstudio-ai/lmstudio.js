import { z } from "zod";

/**
 * Theme color options
 *
 * @public
 */
export type ColorPalette = "red" | "green" | "blue" | "yellow" | "orange" | "purple" | "default";
export const colorPalette = z.enum([
  "red",
  "green",
  "blue",
  "yellow",
  "orange",
  "purple",
  "default",
]);
