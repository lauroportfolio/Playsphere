"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "../ui/button";

import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";
import { CommentValidation } from "@/lib/validations/thread";
import Image from "next/image";
import { addCommentToThread } from "@/lib/actions/thread.actions";

import { containsBadWords, cleanBadWords } from "@/lib/utils";  // ← import filtro
import { toast } from "sonner";

interface Props {
  threadId: string;
  currentUserImg: string;
  currentUserId: string;
}

const Comment = ({ threadId, currentUserImg, currentUserId }: Props) => {
  const router = useRouter();
  const pathname = usePathname();

  const form = useForm({
    resolver: zodResolver(CommentValidation),
    defaultValues: {
      thread: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof CommentValidation>) => {
    // Verifica filtro de palavras ofensivas
    if (containsBadWords(values.thread)) {
      toast.error("Seu comentário contém palavras não permitidas. Por favor revise.", {
        style: {
          background: "#1e1e2a",
          color: "#fff",
          border: "1px solid #ff5f5f",
          borderRadius: "10px",
          padding: "14px 18px",
          fontSize: "15px",
          boxShadow: "0 4px 12px rgba(255,95,95,0.3)",
        },
      });
      return;
    }

    const safeText = cleanBadWords(values.thread);

    await addCommentToThread(
      threadId,
      safeText,
      currentUserId,
      pathname
    );

    form.reset();
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="comment-form"
      >
        <FormField
          control={form.control}
          name="thread"
          render={({ field }) => (
            <FormItem className="flex w-full items-center gap-3">
              <FormLabel>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden flex items-center justify-center">
                  <Image
                    src={currentUserImg}
                    alt="Imagem de Perfil"
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                </div>
              </FormLabel>
              <FormControl className="border-none bg-transparent flex-1">
                <Input
                  type="text"
                  placeholder="Responder..."
                  className="no-focus text-light-1 outline-none"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" className="cursor-pointer comment-form_btn">
          Enviar
        </Button>
      </form>
    </Form>
  );
};

export default Comment;