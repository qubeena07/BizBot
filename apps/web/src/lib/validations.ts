import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    businessName: z.string().min(2, "Business name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const knowledgeSourceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["file", "text", "url"]),
  content: z.string().optional(),
  url: z.string().url().optional(),
});

export const botSettingsSchema = z.object({
  name: z.string().min(1).max(50),
  welcomeMessage: z.string().min(1).max(500),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  position: z.enum(["bottom-right", "bottom-left"]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type KnowledgeSourceInput = z.infer<typeof knowledgeSourceSchema>;
export type BotSettingsInput = z.infer<typeof botSettingsSchema>;
