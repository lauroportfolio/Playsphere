import { fetchLikedPosts } from "@/lib/actions/thread.actions";
import ThreadCard from "@/components/cards/ThreadCard";

interface Props {
  userId: string;
  currentUserId: string;
}

const LikedThreadsTab = async ({ userId, currentUserId }: Props) => {
  const likedThreads = await fetchLikedPosts(userId);

  if (!likedThreads || likedThreads.length === 0) {
    return <p className="text-gray-1 mt-4">Nenhum post curtido ainda.</p>;
  }

  return (
    <section className="mt-4 flex flex-col gap-6">
      {likedThreads.map((thread: any) => (
        <div key={thread._id} className="bg-dark-2 rounded-xl p-6">
          {/* 🔹 Se for um comentário curtido, mostra o post original acima */}
          {thread.parentId && (
            <div className="mb-4 border-l border-gray-700 pl-4">
              <ThreadCard
                id={thread.parentId._id}
                currentUserId={currentUserId}
                parentId={thread.parentId.parentId || null}
                content={thread.parentId.text}
                author={thread.parentId.author}
                community={thread.parentId.community || null}
                createdAt={thread.parentId.createdAt}
                comments={thread.parentId.children || []}
                isComment={false}
                likes={thread.parentId.likes || []}
              />
            </div>
          )}

          {/* 🔹 Mostra o post ou comentário curtido */}
          <ThreadCard
            key={thread._id}
            id={thread._id}
            currentUserId={currentUserId}
            parentId={thread.parentId?._id || null}
            content={thread.text}
            author={thread.author}
            community={thread.community || null}
            createdAt={thread.createdAt}
            comments={thread.children || []}
            isComment={!!thread.parentId} // mostra diferente se for comentário
            likes={thread.likes || []}
          />
        </div>
      ))}
    </section>
  );
};

export default LikedThreadsTab;
