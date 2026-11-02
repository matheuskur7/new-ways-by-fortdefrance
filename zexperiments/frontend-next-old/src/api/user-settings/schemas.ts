import { z } from "zod";
import { signUpSchema } from "../../lib/auth-schemas.ts";

export const profileSchema = signUpSchema.pick({ name: true });
export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual.").max(128),
    newPassword: signUpSchema.shape.password,
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "A confirmação da senha não confere.",
    path: ["confirmPassword"],
  })
  .refine((value) => value.newPassword !== value.currentPassword, {
    message: "Escolha uma senha diferente da atual.",
    path: ["newPassword"],
  });
export const avatarFileSchema = z
  .instanceof(File)
  .refine(
    (file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
    "Selecione uma imagem JPEG, PNG ou WebP.",
  )
  .refine(
    (file) => file.size > 0 && file.size <= 10 * 1024 * 1024,
    "Selecione uma imagem de até 10 MB.",
  );
