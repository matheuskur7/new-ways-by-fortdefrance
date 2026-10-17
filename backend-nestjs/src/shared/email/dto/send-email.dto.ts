import { z } from 'zod';

const recipients = z.union([z.email(), z.array(z.email()).min(1).max(50)]);

export const sendEmailSchema = z
  .strictObject({
    to: recipients,
    subject: z
      .string()
      .trim()
      .min(1)
      .max(998)
      .regex(/^[^\r\n]+$/),
    text: z.string().min(1).optional(),
    html: z.string().min(1).optional(),
    replyTo: recipients.optional(),
    cc: recipients.optional(),
    bcc: recipients.optional(),
  })
  .refine((email) => email.text !== undefined || email.html !== undefined, {
    message: 'Informe text ou html.',
  })
  .refine(
    (email) =>
      [email.to, email.cc, email.bcc].reduce<number>(
        (total, value) => total + (Array.isArray(value) ? value.length : value ? 1 : 0),
        0,
      ) <= 50,
    {
      message: 'Informe no máximo 50 destinatários no total.',
    },
  );

export type SendEmailDto = z.infer<typeof sendEmailSchema>;
