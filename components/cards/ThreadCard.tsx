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
} from "@/components/ui/alert-dialog";

import ShareButton from "../shared/ShareButton";
import RepostButton from "../shared/RepostButton";
import DeleteButton from "../shared/DeleteButton";
import RepostController from "../shared/RepostController";

interface UserLite {
  id?: string;
  _id?: any;
  name?: string;
  username?: string;
  image?: string;
}

interface Props {
  id: string;
  currentUserId: string;
  parentId: string | null;
  content: string;
  author: UserLite;
  community: {
    id: string;
    name: string;
    image: string;
  } | null;
  createdAt: string;
  comments: any[];
  isComment?: boolean;
  likes?: string[];
  reposts?: any[];
  repostOf?: any | null;
  repostedBy?: UserLite | null;
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
  likes = [],
  reposts = [],
  repostOf = null,
  repostedBy = null,
}: Props) => {
  const isRepostThread = Boolean(repostOf);

  // ✅ Se for repost visual, usar reposts do original para refletir contador real
  const effectiveReposts = isRepostThread ? repostOf?.reposts ?? [] : reposts;
  const repostCount = effectiveReposts?.length || 0;

  const displayPost = isRepostThread
    ? repostOf
    : { text: content, author, createdAt, community, likes, children: comments };

  const displayAuthor: UserLite =
    displayPost?.author || author || { id: "", name: "Usuário", image: "" };

  const hasLiked = !!displayPost?.likes?.map?.(String).includes?.(
    String(currentUserId)
  );

  // ✅ Define o id do post original para ações (like, comentar, compartilhar)
  const targetThreadId = isRepostThread
    ? String(repostOf?._id)
    : String(id);

  const canRepost = Boolean(currentUserId);

  // 🧩 Corrige a detecção de repost preenchido mesmo em páginas de repost
  const isRepostedByMe = Array.isArray(effectiveReposts)
  ? effectiveReposts.some((r: any) => {
      const repostId =
        typeof r === "string"
          ? r
          : r?.id || r?._id?.toString?.() || "";
      const cleanA = repostId?.toString()?.replace("user_", "").toLowerCase();
      const cleanB = currentUserId?.toString()?.replace("user_", "").toLowerCase();
      return cleanA === cleanB;
    })
  : false;

  const isAuthorOfThisThread = currentUserId === author?.id;

  return (
    <article
      className={`flex w-full flex-col rounded-xl ${isComment ? "px-0 xs:px-7" : "bg-dark-2 p-7"
        }`}
    >
      {/* 🔁 Barra “Repostado por” */}
      {isRepostThread && repostedBy && (
        <div className="mb-3 flex items-center gap-2 text-sm text-gray-400">
          <Image
            src={repostedBy.image || "/assets/default-profile.png"}
            alt={repostedBy.name || "Reposter"}
            width={18}
            height={18}
            className="rounded-full object-cover"
          />
          <p>
            Repostado por{" "}
            <Link
              href={`/profile/${repostedBy.id}`}
              className="text-[#877EFF] transition"
            >
              @{repostedBy.username ?? repostedBy.id}
            </Link>
          </p>
        </div>
      )}

      {/* 🧱 Corpo do Post */}
      <div className="flex items-start justify-between">
        <div className="flex w-full flex-row gap-4">
          <div className="flex flex-col items-center">
            <Link
              href={`/profile/${displayAuthor.id || displayAuthor._id}`}
              className="relative h-11 w-11"
            >
              <Image
                src={displayAuthor.image || "/assets/default-profile.png"}
                alt={displayAuthor.name || "Profile Image"}
                fill
                className="cursor-pointer rounded-full object-cover"
              />
            </Link>
            <div className="thread-card_bar" />
          </div>

          <div className="flex w-full flex-col">
            <Link
              href={`/profile/${displayAuthor.id || displayAuthor._id}`}
              className="w-fit"
            >
              <h4 className="cursor-pointer base-semibold text-light-1">
                {displayAuthor.name}
              </h4>
            </Link>

            {/* 📝 Texto do post */}
            {isRepostThread ? (
              <Link href={`/thread/${repostOf?._id}`}>
                <p className="mt-2 small-regular text-light-2 hover:underline cursor-pointer">
                  {displayPost.text}
                </p>
              </Link>
            ) : (
              <p className="mt-2 small-regular text-light-2">
                {displayPost.text}
              </p>
            )}

            {/* 🔘 Ações */}
            <div
              className={`${isComment ? "mb-10" : ""} mt-5 flex flex-col gap-3`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {/* ❤️ LIKE */}
                  {currentUserId && (
                    <form
                      action={async () => {
                        "use server";
                        const { toggleLike } = await import(
                          "@/lib/actions/thread.actions"
                        );
                        const path =
                          typeof window !== "undefined"
                            ? window.location.pathname
                            : "/";
                        await toggleLike(targetThreadId, currentUserId, path);
                      }}
                    >
                      <button
                        type="submit"
                        className="flex items-center gap-1 align-middle"
                      >
                        <Image
                          src={
                            hasLiked
                              ? "/assets/heart-filled.svg"
                              : "/assets/heart-gray.svg"
                          }
                          alt="like"
                          width={24}
                          height={24}
                          className="cursor-pointer object-contain"
                        />
                        <span className="text-gray-1 text-sm">
                          {displayPost?.likes?.length ?? 0}
                        </span>
                      </button>
                    </form>
                  )}

                  {/* 💬 COMENTÁRIOS */}
                  <Link href={`/thread/${targetThreadId}`}>
                    <Image
                      src="/assets/reply.svg"
                      alt="reply"
                      width={24}
                      height={24}
                      className="cursor-pointer object-contain"
                    />
                  </Link>

                  {/* 🔁 REPOST */}
                  <RepostController
                    threadId={targetThreadId}
                    originalId={isRepostThread ? String(repostOf?._id) : String(id)}
                    currentUserId={currentUserId}
                    initialReposted={isRepostedByMe}
                    initialCount={repostCount}
                  />

                  {/* 🔗 SHARE */}
                  <ShareButton id={targetThreadId.toString()} />
                </div>

                {/* 🗑️ DELETE */}
                {isAuthorOfThisThread && (
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
                          Essa ação é irreversível e removerá também todos os
                          comentários vinculados.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer bg-dark-2 hover:bg-dark-1 text-light-2">
                          Cancelar
                        </AlertDialogCancel>
                        <DeleteButton
                          threadId={targetThreadId}
                          className="cursor-pointer bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                        />
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>

              {/* 📣 Respostas */}
              {isComment && comments.length > 0 && (
                <Link href={`/thread/${targetThreadId}`}>
                  <p className="mt-1 subtle-medium text-gray-1">
                    {comments.length} respostas
                  </p>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 📍 Comunidade */}
      {!isComment && displayPost.community && (
        <Link
          href={`/communities/${displayPost.community.id}`}
          className="mt-5 flex items-center"
        >
          <p className="subtle-medium text-gray-1">
            {formatDateString(displayPost.createdAt || createdAt)} - Comunidade{" "}
            {displayPost.community.name}
          </p>

          <Image
            src={displayPost.community.image}
            alt={displayPost.community.name}
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