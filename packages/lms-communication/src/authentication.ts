import { z } from "zod";

export const authPacketSchema = z.object({
  authVersion: z.literal(1),
  clientIdentifier: z.string().max(256),
  clientPasskey: z.string().max(256),
});

export type AuthPacket = z.infer<typeof authPacketSchema>;
