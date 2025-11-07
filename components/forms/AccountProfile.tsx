"use client";

import * as z from "zod";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { usePathname, useRouter } from "next/navigation";
import { ChangeEvent, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { useUploadThing } from "@/lib/uploadthing";
import { isBase64Image } from "@/lib/utils";

import { UserValidation } from "@/lib/validations/user";
import { updateUser } from "@/lib/actions/user.actions";
import { toast } from "sonner";

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

type UploadThingResult = {
  ufsUrl?: string;
  url?: string;
  appUrl?: string;
  fileUrl?: string;
};

const AccountProfile = ({ user, btnTitle }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { startUpload } = useUploadThing("media");

  const [files, setFiles] = useState<File[]>([]);

  const form = useForm<z.infer<typeof UserValidation>>({
    resolver: zodResolver(UserValidation),
    defaultValues: {
      profile_photo: user?.image ? user.image : "",
      name: user?.name ? user.name : "",
      username: user?.username ? user.username : "",
      bio: user?.bio ? user.bio : "",
    },
  });

  const onSubmit = async (values: z.infer<typeof UserValidation>) => {
    if (isLoading) return;
    setIsLoading(true);

    toast("Salvando alterações...", {
      description: "Aguarde enquanto seu perfil é atualizado.",
      style: {
        background: "#1e1e2a",
        color: "#fff",
        border: "1px solid #877EFF",
        borderRadius: "10px",
        padding: "14px 18px",
        fontSize: "15px",
        boxShadow: "0 4px 12px rgba(135,126,255,0.3)",
      },
    });

    try {
      const blob = values.profile_photo;
      const hasImageChanged = isBase64Image(blob);

      if (hasImageChanged && files.length > 0) {
        console.log("🧩 Iniciando upload da nova imagem...");

        const imgRes = await startUpload(files);

        if (!imgRes || imgRes.length === 0) {
          console.error("⚠️ UploadThing retornou resposta vazia:", imgRes);
          toast.error("Falha ao enviar imagem. Tente novamente.");
          return;
        }

        const fileData = imgRes[0] as UploadThingResult;
        const uploadedUrl =
          fileData.ufsUrl || fileData.url || fileData.appUrl || fileData.fileUrl;

        if (!uploadedUrl) {
          console.error("⚠️ Nenhuma URL válida encontrada no resultado:", fileData);
          toast.error("Erro ao processar imagem. Tente novamente.");
          return;
        }

        // ✅ URL do arquivo obtida com sucesso
        console.log("✅ Upload bem-sucedido:", uploadedUrl);
        values.profile_photo = uploadedUrl;
      }

      // 🔹 Atualiza o usuário no banco
      await updateUser({
        name: values.name,
        username: values.username,
        userId: user.id,
        bio: values.bio,
        image: values.profile_photo,
        path: pathname,
      });

      toast.success("Perfil atualizado! ✅", {
        style: {
          background: "#1e1e2a",
          color: "#fff",
          border: "1px solid #877EFF",
          borderRadius: "10px",
          padding: "14px 18px",
          fontSize: "15px",
          boxShadow: "0 4px 12px rgba(135,126,255,0.3)",
        },
        icon: (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 250, damping: 10 }}>
            <Image src="/assets/heart-filled.svg" alt="Sucesso" width={22} height={22} className="invert" />
          </motion.div>
        ),
      });

      // 🔹 Redireciona
      if (pathname === "/profile/edit") {
        router.back();
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("❌ Erro ao atualizar perfil:", error);
      toast.error("Falha ao atualizar perfil. Tente novamente.", {
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
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 Função para selecionar nova imagem
  const handleImage = (
    e: ChangeEvent<HTMLInputElement>,
    fieldChange: (value: string) => void
  ) => {
    e.preventDefault();

    const fileReader = new FileReader();

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFiles(Array.from(e.target.files));

      if (!file.type.includes("image")) return;

      fileReader.onload = async (event) => {
        const imageDataUrl = event.target?.result?.toString() || "";
        fieldChange(imageDataUrl);
      };

      fileReader.readAsDataURL(file);
    }
  };

  return (
    <Form {...form}>
      <form
        className='flex flex-col justify-start gap-10'
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name='profile_photo'
          render={({ field }) => (
            <FormItem className='flex items-center gap-4'>
              <FormLabel className='account-form_image-label'>
                {field.value ? (
                  <Image
                    src={field.value}
                    alt='profile_icon'
                    width={96}
                    height={96}
                    priority
                    className='rounded-full object-contain'
                  />
                ) : (
                  <Image
                    src='/assets/profile.svg'
                    alt='profile_icon'
                    width={24}
                    height={24}
                    className='object-contain'
                  />
                )}
              </FormLabel>
              <FormControl className='flex-1 base-semibold text-gray-200'>
                <Input
                  type='file'
                  accept='image/*'
                  placeholder='Add profile photo'
                  className='account-form_image-input'
                  onChange={(e) => handleImage(e, field.onChange)}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem className='flex w-full flex-col gap-3'>
              <FormLabel className='base-semibold text-light-2'>
                Name
              </FormLabel>
              <FormControl>
                <Input
                  type='text'
                  className='account-form_input not-focus'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='username'
          render={({ field }) => (
            <FormItem className='flex w-full flex-col gap-3'>
              <FormLabel className='base-semibold text-light-2'>
                Username
              </FormLabel>
              <FormControl>
                <Input
                  type='text'
                  className='account-form_input not-focus'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='bio'
          render={({ field }) => (
            <FormItem className='flex w-full flex-col gap-3'>
              <FormLabel className='base-semibold text-light-2'>
                Bio
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={10}
                  className='account-form_input not-focus'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isLoading}
          className={`${isLoading ? "cursor-not-allowed opacity-50 flex items-center justify-center gap-2" : ""} cursor-pointer bg-[#877EFF] text-white hover:bg-[#6c62d9] px-4 py-2 rounded-md`}
        >
          {isLoading ? (
            <>
              <Image src="/assets/loading.svg" alt="Carregando" width={20} height={20} className="animate-spin" />
              <span>Salvando...</span>
            </>
          ) : (
            btnTitle
          )}
        </Button>
      </form>
    </Form>
  );
};

export default AccountProfile;