"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "../ui/button";

import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserValidation } from "@/lib/validations/user";
import Image from "next/image";
import { ChangeEvent, useState } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import { updateUser } from "@/lib/actions/user.actions";
import { usePathname, useRouter } from "next/navigation";

interface Props {
  user: {
    id: string;
    objectId: string;
    username: string;
    name: string;
    bio: string;
    image: string;
  };
  btnTitle: string;
}

const AccountProfile = ({ user, btnTitle }: Props) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string>(user.image || "");
  const { startUpload } = useUploadThing("media");
  const router = useRouter();
  const pathname = usePathname();

  const form = useForm({
    resolver: zodResolver(UserValidation),
    defaultValues: {
      profile_photo: user?.image || "",
      name: user?.name || "",
      username: user?.username || "",
      bio: user?.bio || "",
    },
  });

  // 🔹 Submissão do formulário
  const onSubmit = async (values: z.infer<typeof UserValidation>) => {
    let imageUrl = user.image; // Começa com a URL antiga

    // Se o usuário selecionou uma nova imagem, faz upload
    if (files.length > 0) {
      try {
        const uploadRes = await startUpload(files);
        if (uploadRes && uploadRes[0]) {
          imageUrl = uploadRes[0].ufsUrl ?? uploadRes[0].url;
          console.log("✅ Upload concluído:", imageUrl);
        }
      } catch (error) {
        console.error("❌ Erro ao enviar imagem:", error);
      }
    }

    // Atualiza o usuário no MongoDB
    await updateUser({
      userId: user.id,
      username: values.username,
      name: values.name,
      bio: values.bio,
      image: imageUrl,
      path: pathname,
    });

    if (pathname === "/profile/edit") {
      router.back();
    } else {
      router.push("/");
    }
  };

  // 🔹 Função para selecionar nova imagem
  const handleImage = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    if (!file.type.includes("image")) return;

    setFiles([file]);

    // Atualiza apenas o preview, não o valor que vai para o Mongo
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col justify-start gap-10"
      >
        {/* FOTO DE PERFIL */}
        <FormField
          control={form.control}
          name="profile_photo"
          render={() => (
            <FormItem className="flex items-center gap-4">
              <FormLabel className="account-form_image-label">
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="profile photo"
                    width={96}
                    height={96}
                    priority
                    className="rounded-full object-cover"
                  />
                ) : (
                  <Image
                    src="/assets/profile.svg"
                    alt="profile photo"
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                )}
              </FormLabel>

              <FormControl className="flex-1 base-semibold text-gray-200">
                <Input
                  type="file"
                  accept="image/*"
                  placeholder="Escolha uma foto"
                  className="account-form_image-input"
                  onChange={handleImage}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* NOME */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-3 w-full">
              <FormLabel className="base-semibold text-light-2">Nome</FormLabel>
              <FormControl>
                <Input type="text" {...field} className="account-form_input not-focus" />
              </FormControl>
            </FormItem>
          )}
        />

        {/* USUÁRIO */}
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-3 w-full">
              <FormLabel className="base-semibold text-light-2">Usuário</FormLabel>
              <FormControl>
                <Input type="text" {...field} className="account-form_input not-focus" />
              </FormControl>
            </FormItem>
          )}
        />

        {/* BIOGRAFIA */}
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-3 w-full">
              <FormLabel className="base-semibold text-light-2">Biografia</FormLabel>
              <FormControl>
                <Textarea rows={10} {...field} className="account-form_input not-focus" />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="bg-primary-500">
          {btnTitle}
        </Button>
      </form>
    </Form>
  );
};

export default AccountProfile;