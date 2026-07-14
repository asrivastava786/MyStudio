// lib/validation.ts
import { z } from "zod";

// letters incl. accents + space, dot, apostrophe, hyphen (2–56 chars)
const countryRegex = /^[\p{L} .'-]{2,56}$/u;
// handle = letters/numbers/._, 2–30
const handleRegex = /^[a-z0-9._]{2,30}$/i;
// password: min 8, at least one letter & one number; max 128
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,128}$/;

export const RegisterSchema = z.object({
  email: z.string().email("Nieprawidłowy adres e-mail"),
  handle: z
    .string()
    .min(2, "Nick za krótki (min 2)")
    .max(30, "Nick za długi (max 30)")
    .regex(handleRegex, "Dozwolone: litery, cyfry, kropka, podkreślenie"),
  name: z
    .string()
    .min(2, "Imię i nazwisko za krótkie")
    .max(80, "Za długie (max 80)")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  country: z
    .string()
    .regex(countryRegex, "Podaj poprawną nazwę kraju (2–56 znaków)"),
  password: z
    .string()
    .regex(passwordRegex, "Hasło min. 8 znaków, musi zawierać literę i cyfrę"),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

const PrintZoneSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
});

export const CatalogTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  blueprintId: z.number().int().positive(),
  printProviderId: z.number().int().positive(),
  mockupUrl: z.string().url(),
  overlayUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  blendMode: z.enum(["normal", "multiply", "screen", "overlay"]).default("multiply"),
  canvasW: z.number().int().positive(),
  canvasH: z.number().int().positive(),
  zones: z.array(PrintZoneSchema).min(1),
  defaultVariants: z.array(z.number().int().positive()).min(1),
  active: z.boolean().optional().default(true),
});
export type CatalogTemplateInput = z.infer<typeof CatalogTemplateSchema>;
