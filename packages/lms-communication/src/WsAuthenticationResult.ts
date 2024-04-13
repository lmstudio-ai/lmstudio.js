import { z } from "zod";

export const wsAuthenticationResultSchema = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(true),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
  }),
]);

export type WsAuthenticationResult = z.infer<typeof wsAuthenticationResultSchema>;
