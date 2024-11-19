import { z, type ZodSchema } from "zod";

/**
 * @public
 */
export interface BackendNotification {
  title: string;
  description?: string;
  noAutoDismiss?: boolean;
}
export const backendNotificationSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  noAutoDismiss: z.boolean().optional(),
}) as ZodSchema<BackendNotification>;
