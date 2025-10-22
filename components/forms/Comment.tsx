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

// import { updateUser } from "@/lib/actions/user.actions";
// import { createThread } from "@/lib/actions/thread.actions";

interface Props {
    threadId: string,
    currentUserImg: string,
    currentUserId: string
}

const Comment = ({ threadId, currentUserImg, currentUserId }: Props) => {
    const router = useRouter();
    const pathname = usePathname();

    const form = useForm({
        resolver: zodResolver(CommentValidation),
        defaultValues: {
            thread: '',
        },
    });

    const onSubmit = async (values: z.infer<typeof CommentValidation>) => {
        /*await createThread({
            text: values.thread,
            author: userId,
            communityId: null, // mudar dps
            path: pathname,
        });
        */

        router.push("/");
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='comment-form'
            >
                <FormField
                    control={form.control}
                    name='thread'
                    render={({ field }) => (
                        <FormItem className='flex w-full items-center gap-3'>
                            <FormLabel>
                                <Image
                                    src={currentUserImg}
                                    alt="Imagem de Perfil"
                                    width={48}
                                    height={48}
                                    className="rounded-full object-cover"
                                />
                            </FormLabel>
                            <FormControl className="border-none bg-transparent">
                                <Input
                                    type="text"
                                    placeholder="Responder..."
                                    className="not-focus text-light-1 outline-none"
                                    {...field}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <Button type="submit" className="comment-form_btn">Enviar</Button>
            </form>
        </Form>
    )
}

export default Comment;