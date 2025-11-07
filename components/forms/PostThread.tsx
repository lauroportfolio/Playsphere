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
import { Button } from "../ui/button";

import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";
import { useOrganization } from "@clerk/nextjs";

// import { updateUser } from "@/lib/actions/user.actions";
import { ThreadValidation } from "@/lib/validations/thread";
import { createThread } from "@/lib/actions/thread.actions";
import { LoadingButton } from "../shared/LoadingButton";

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

function PostThread({ userId }: { userId: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const { organization } = useOrganization();

    const form = useForm({
        resolver: zodResolver(ThreadValidation),
        defaultValues: {
            thread: '',
            accountId: userId,
        },
    });

    const onSubmit = async (values: z.infer<typeof ThreadValidation>) => {
        await createThread({
            text: values.thread,
            author: userId,
            communityId: organization ? organization.id : null,
            path: pathname,
        });

        router.push("/");
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='mt-10 flex flex-col justify-start gap-10'
            >
                <FormField
                    control={form.control}
                    name='thread'
                    render={({ field }) => (
                        <FormItem className='flex w-full flex-col gap-3'>
                            <FormLabel className='base-semibold text-light-2'>
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
                        await createThread({
                            text: form.getValues().thread,
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
    )
}

export default PostThread