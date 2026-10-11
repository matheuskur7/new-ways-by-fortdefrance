import { z } from "zod";

const email = z.string().trim().pipe(z.email("Informe um email válido."));
const password = z
  .string()
  .min(8, "Use pelo menos 8 caracteres na senha.")
  .max(128, "Use no máximo 128 caracteres na senha.");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Informe sua senha.").max(128),
});
export const signUpSchema = signInSchema.extend({
  name: z.string().trim().min(1, "Informe seu nome.").max(200),
  password,
});
export const organizationSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da empresa.").max(200),
  slug: z
    .string()
    .trim()
    .min(1, "Informe o identificador da empresa.")
    .max(100)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use letras minúsculas, números e hífens entre palavras.",
    ),
});
export const authContextSchema = z.object({
  user: z.object({ id: z.string(), name: z.string(), email: z.email() }),
  organization: z
    .object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      role: z.string(),
    })
    .nullable(),
});
export type AuthContext = z.infer<typeof authContextSchema>;
