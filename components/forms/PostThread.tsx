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
import { useOrganization } from "@clerk/nextjs";

import { ThreadValidation } from "@/lib/validations/thread";
import { createThread } from "@/lib/actions/thread.actions";

import { containsBadWords, cleanBadWords, detectSelfHarmRisk } from "@/lib/utils";
import { toast } from "sonner";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface Props {
  userId: string;
  userName: string;
  userImage: string;
  userUsername: string;
}

function PostThread({ userId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { organization } = useOrganization();

  const [showRiskDialog, setShowRiskDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingText, setPendingText] = useState("");

  const form = useForm({
    resolver: zodResolver(ThreadValidation),
    defaultValues: {
      thread: "",
      accountId: userId,
    },
  });

  // 🔥 Publica final (somente quando tudo foi aprovado)
  const publishPost = async (text: string) => {
    const cleaned = cleanBadWords(text);

    await createThread({
      text: cleaned,
      author: userId,
      communityId: organization ? organization.id : null,
      path: pathname,
    });

    toast.success("Post publicado com sucesso! ❤️", {
      style: {
        background: "#1e1e2a",
        color: "#fff",
        border: "1px solid #877EFF",
        borderRadius: "10px",
        padding: "14px 18px",
        fontSize: "15px",
      },
    });

    router.push("/");
  };

  // 🔥 Fluxo ao clicar em publicar
  const handlePublish = async () => {
    const text = form.getValues("thread").trim();
    setPendingText(text); // guarda temporariamente

    // ➤ 1) Risco detectado
    if (detectSelfHarmRisk(text)) {
      setShowRiskDialog(true);
      return;
    }

    // ➤ 2) Palavrões detectados
    if (containsBadWords(text)) {
      toast.error("Há palavras ofensivas no texto. Por favor, revise.", {
        style: {
          background: "#1e1e2a",
          color: "#fff",
          border: "1px solid #ff5f5f",
          borderRadius: "10px",
          padding: "14px 18px",
          fontSize: "15px",
        },
      });
      return;
    }

    // ➤ 3) OK para publicar
    await publishPost(text);
  };

  return (
    <>
      {/* ⚠️ DIALOGO 1 — “Você está bem?” */}
      <AlertDialog open={showRiskDialog} onOpenChange={setShowRiskDialog}>
        <AlertDialogContent className="bg-dark-3 border border-dark-4 text-light-1">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">
              Você está bem?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-light-3">
              Percebemos que sua mensagem pode indicar que você está passando por um momento difícil.
              Você quer conversar com alguém?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            {/* “Estou bem” → confirma se quer mesmo ignorar o aviso */}
            <AlertDialogCancel
              className="cursor-pointer bg-dark-2 hover:bg-dark-1 text-light-2"
              onClick={() => {
                setShowRiskDialog(false);
                setShowConfirmDialog(true);
              }}
            >
              Estou bem
            </AlertDialogCancel>

            {/* “Preciso conversar” → NÃO publica, mostra toast humano */}
            <Button
              className="cursor-pointer bg-[#ff6b6b] text-white"
              onClick={() => {
                setShowRiskDialog(false);

                toast(
                  "Seu contato foi encaminhado. Um voluntário irá conversar com você em breve ❤️",
                  {
                    duration: 7000,
                    position: "top-center", // ← TOAST NO MEIO DA TELA
                    closeButton: true,  // ← botão X para fechar
                    style: {
                      background: "#1e1e2a",
                      color: "#fff",
                      border: "1px solid #ff6b6b",
                      borderRadius: "12px",
                      padding: "18px 22px",
                      fontSize: "16px",
                      textAlign: "center",
                      maxWidth: "400px",
                    },
                  }
                );
              }}
            >
              Preciso conversar
            </Button>

          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ⚠️ DIALOGO 2 — “Tem certeza?” (ao clicar “Estou bem”) */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-dark-3 border border-dark-4 text-light-1">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">
              Tem certeza?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-light-3">
              Caso continue, sua publicação será enviada normalmente.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              className="cursor-pointer bg-dark-2 hover:bg-dark-1 text-light-2"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancelar
            </AlertDialogCancel>

            <Button
              className="cursor-pointer bg-[#877EFF] text-white"
              onClick={async () => {
                setShowConfirmDialog(false);
                await publishPost(pendingText); // publica após confirmação
              }}
            >
              Confirmar Publicação
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 🧾 FORMULÁRIO */}
      <Form {...form}>
        <form className="mt-10 flex flex-col justify-start gap-10">
          <FormField
            control={form.control}
            name="thread"
            render={({ field }) => (
              <FormItem className="flex w-full flex-col gap-3">
                <FormLabel className="base-semibold text-light-2">
                  Conteúdo
                </FormLabel>
                <FormControl className="not-focus border bg-border-dark-3 text-light-1">
                  <Textarea rows={15} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <LoadingButton
            onClick={handlePublish}
            className="cursor-pointer bg-[#877EFF] hover:bg-[#6c62d9] text-white px-4 py-2 rounded-md"
          >
            Publicar
          </LoadingButton>
        </form>
      </Form>
    </>
  );
}

export default PostThread;