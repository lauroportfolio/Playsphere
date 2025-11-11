import * as z from "zod";

export const ThreadValidation = z.object({
  thread: z
    .string()
    .nonempty({ message: "O conteúdo da postagem não pode estar vazio." })
    .min(3, { message: "Mínimo de 3 caracteres." })
    .max(360, { message: "Máximo de 360 caractere." }),
  accountId: z.string(),
});


export const CommentValidation = z.object({
  thread: z
    .string()
    .nonempty()
    .min(3, { message: "Mínimo de 3 caracteres." })
    .max(360, { message: "Máximo de 360 caractere." }),
})