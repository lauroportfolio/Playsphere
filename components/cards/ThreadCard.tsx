import { formatDateString } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import ShareButton from "../shared/ShareButton";


interface Props {
    id: string;
    currentUserId: string;
    parentId: string | null;
    content: string;
    author: {
        name: string;
        image: string;
        id: string;
    };
    community: {
        id: string;
        name: string;
        image: string;
    } | null;
    createdAt: string;
    comments: {
        author: {
            image: string;
        };
    }[];
    isComment?: boolean;
    likes?: string[];
}

const ThreadCard = ({
    id,
    currentUserId,
    parentId,
    content,
    author,
    community,
    createdAt,
    comments,
    isComment,
    likes,
}: Props) => {
    // 🔹 Verifica se o usuário atual é o autor do post
    const isAuthor = currentUserId === author.id;

    return (
        <article
            className={`flex w-full flex-col rounded-xl ${isComment ? "px-0 xs-px-7" : " bg-dark-2 p-7"
                }`}
        >
            <div className="flex items-start justify-between">
                <div className="flex w-full flex-row gap-4">
                    <div className="flex flex-col items-center">
                        <Link href={`/profile/${author.id}`} className="relative h-11 w-11">
                            <Image
                                src={author.image}
                                alt="Profile Image"
                                fill
                                className="cursor-pointer rounded-full object-cover"
                            />
                        </Link>

                        <div className="thread-card_bar" />
                    </div>

                    <div className="flex w-full flex-col">
                        <Link href={`/profile/${author.id}`} className="w-fit">
                            <h4 className="cursor-pointer base-semibold text-light-1">
                                {author.name}
                            </h4>
                        </Link>

                        <p className="mt-2 small-regular text-light-2">{content}</p>

                        <div className={`${isComment && "mb-10"} mt-5 flex flex-col gap-3`}>
                            <div className="flex items-center justify-between">

                                <div className="flex gap-3.5 items-center">
                                    {/* ❤️ CURTIR (funciona tanto para posts quanto para comentários) */}
                                    {currentUserId ? (
                                        // 🔹 Usuário logado: pode curtir
                                        <form
                                            action={async () => {
                                                "use server";
                                                const { toggleLike } = await import("@/lib/actions/thread.actions");
                                                const path = typeof window !== "undefined" ? window.location.pathname : "/";
                                                await toggleLike(id, currentUserId, path);
                                            }}
                                        >
                                            <button type="submit" className="flex items-center gap-1">
                                                <Image
                                                    src={
                                                        likes?.includes(currentUserId)
                                                            ? "/assets/heart-filled.svg"
                                                            : "/assets/heart-gray.svg"
                                                    }
                                                    alt="like"
                                                    width={24}
                                                    height={24}
                                                    className="cursor-pointer object-contain"
                                                />
                                                <span className="text-gray-1 text-sm">{likes?.length || 0}</span>
                                            </button>
                                        </form>
                                    ) : (
                                        // 🔹 Usuário deslogado: botão abre modal do shadcn
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="flex items-center gap-1 opacity-80 hover:opacity-100 transition"
                                                    title="Entrar para curtir postagens"
                                                >
                                                    <Image
                                                        src="/assets/heart-gray.svg"
                                                        alt="like"
                                                        width={24}
                                                        height={24}
                                                        className="cursor-pointer object-contain"
                                                    />
                                                    <span className="text-gray-1 text-sm">{likes?.length || 0}</span>
                                                </button>
                                            </DialogTrigger>
                                            <DialogContent className="bg-dark-2 border-none text-light-1 max-w-sm">
                                                <DialogHeader>
                                                    <DialogTitle className="mb-5">Faça login para curtir postagens</DialogTitle>
                                                    <DialogDescription className="text-light-2">
                                                        Entre na sua conta PlaySphere para interagir com a comunidade.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <DialogFooter>
                                                    <Link
                                                        href="/sign-in"
                                                        className="w-full bg-primary-500 text-white py-2 rounded-md text-center hover:bg-primary-600 transition"
                                                    >
                                                        Entrar
                                                    </Link>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    )}



                                    {/* 💬 COMENTÁRIOS */}
                                    <Link href={`/thread/${id}`}>
                                        <Image
                                            src="/assets/reply.svg"
                                            alt="reply"
                                            width={24}
                                            height={24}
                                            className="cursor-pointer object-contain"
                                        />
                                    </Link>

                                    {/* 🔁 REPOSTAR (precisa ser feito) */}
                                    <Image
                                        src="/assets/repost.svg"
                                        alt="repost"
                                        width={24}
                                        height={24}
                                        className="cursor-pointer object-contain"
                                    />

                                    {/* 🔗 COMPARTILHAR (feito) */}
                                    <ShareButton id={id?.toString()} />

                                </div>
                                {/* 🗑️ DELETE — sem useState, Server Component puro */}
                                {isAuthor && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <button
                                                title="Excluir postagem"
                                                className="cursor-pointer hover:opacity-100 opacity-70 transition"
                                            >
                                                <Image
                                                    src="/assets/delete.svg"
                                                    alt="delete"
                                                    width={22}
                                                    height={22}
                                                    className="object-contain"
                                                />
                                            </button>
                                        </AlertDialogTrigger>

                                        <AlertDialogContent className="bg-dark-3 border border-dark-4 text-light-1">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    Deseja mesmo excluir esta postagem?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription className="text-light-3">
                                                    Essa ação é irreversível e removerá também todos os comentários vinculados.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="cursor-pointer bg-dark-2 hover:bg-dark-1 text-light-2">
                                                    Cancelar
                                                </AlertDialogCancel>

                                                {/* 🔥 Botão que executa a action do servidor */}
                                                <form
                                                    action={async () => {
                                                        "use server";
                                                        const { deleteThread } = await import("@/lib/actions/thread.actions");
                                                        await deleteThread(id, "/");
                                                    }}
                                                >
                                                    <AlertDialogAction
                                                        type="submit"
                                                        className="cursor-pointer bg-red-600 hover:bg-red-700 text-white"
                                                    >
                                                        Excluir
                                                    </AlertDialogAction>
                                                </form>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}

                            </div>

                            {isComment && comments.length > 0 && (
                                <Link href={`/thread/${id}`}>
                                    <p className="mt-1 subtle-medium text-gray-1">
                                        {comments.length} respostas
                                    </p>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {!isComment && community && (
                <Link href={`/communities/${community.id}`} className="mt-5 flex items-center">
                    <p className="subtle-medium text-gray-1">
                        {formatDateString(createdAt)} - Comunidade {community.name}
                    </p>

                    <Image
                        src={community.image}
                        alt={community.name}
                        width={14}
                        height={14}
                        className="ml-1 rounded-full object-cover"
                    />
                </Link>
            )}
        </article>
    );
};

export default ThreadCard;
