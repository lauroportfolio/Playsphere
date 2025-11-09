"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { LoadingButton } from "../shared/LoadingButton";

import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";
import { useOrganization, useUser } from "@clerk/nextjs";

import { ThreadValidation } from "@/lib/validations/thread";
import { createThread } from "@/lib/actions/thread.actions";

import { containsBadWords, cleanBadWords } from "@/lib/utils";
import { toast } from "sonner";

import Image from "next/image";

interface Props {
  userId: string;
  userName: string;
  userImage: string;
  userUsername: string;
}

function PostThread({ userId, userName, userImage, userUsername }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { organization } = useOrganization();

  const form = useForm({
    resolver: zodResolver(ThreadValidation),
    defaultValues: {
      thread: "",
      accountId: userId,
    },
  });

  const onSubmit = async (values: z.infer<typeof ThreadValidation>) => {
    if (containsBadWords(values.thread)) {
      toast.error("Há palavras ofensivas no texto. Por favor, revise.", {
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

    await createThread({
      text: safeText,
      author: userId,
      communityId: organization ? organization.id : null,
      path: pathname,
    });
    
    router.push("/");
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-10 flex flex-col justify-start gap-10"
      >
        <FormField
          control={form.control}
          name="thread"
          render={({ field }) => (
            <FormItem className="flex w-full flex-col gap-3">
              <FormLabel className="base-semibold text-light-2">
                Conteúdo
              </FormLabel>
              <FormControl className="not-focus border bg-border-dark-3 text-light-1">
                <Textarea
                  rows={15}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <LoadingButton
          onClick={async () => {
            const values = form.getValues();
            // mesma lógica dentro do click para o botão loading
            if (containsBadWords(values.thread)) {
              toast.error("Há palavras ofensivas no texto. Por favor, revise.", {
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
            await createThread({
              text: safeText,
              author: userId,
              communityId: organization ? organization.id : null,
              path: pathname,
            });
            router.push("/");
          }}
          className="cursor-pointer bg-[#877EFF] hover:bg-[#6c62d9] text-white px-4 py-2 rounded-md"
        >
          Publicar
        </LoadingButton>

      </form>
    </Form>
  );
}

export default PostThread;