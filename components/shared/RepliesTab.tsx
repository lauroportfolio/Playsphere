import { fetchUserReplies } from "@/lib/actions/thread.actions";
import ThreadCard from "@/components/cards/ThreadCard";

interface Props {
  userId: string;
  currentUserId: string;
}

const RepliesTab = async ({ userId, currentUserId }: Props) => {
  const replies = await fetchUserReplies(userId);

  if (!replies || replies.length === 0) {
    return <p className="text-gray-1 mt-4">Nenhuma resposta ainda.</p>;
  }

  return (
    <section className="mt-4 flex flex-col gap-6">
      {replies.map((reply: any) => (
        <div key={reply._id} className="bg-dark-2 rounded-xl p-6">
          {/* Post original */}
          {reply.parentId && (
            <ThreadCard
              id={reply.parentId._id}
              currentUserId={currentUserId}
              parentId={reply.parentId.parentId}
              content={reply.parentId.text}
              author={reply.parentId.author}
              community={reply.parentId.community || null}
              createdAt={reply.parentId.createdAt}
              comments={reply.parentId.children}
              isComment={false}
              likes={reply.parentId.likes || []}
              // já normalizados no fetchUserReplies
              reposts={reply.parentId.reposts || []}
              repostOf={reply.parentId.repostOf || null}
              repostedBy={reply.parentId.repostedBy || null}
            />
          )}

          {/* Resposta do usuário */}
          <div className="border-l border-gray-700 ml-8 pl-6 mt-4">
            <ThreadCard
              id={reply._id}
              currentUserId={currentUserId}
              parentId={reply.parentId?._id || null}
              content={reply.text}
              author={reply.author}
              community={null}
              createdAt={reply.createdAt}
              comments={reply.children || []}
              isComment
              likes={reply.likes || []}
              reposts={reply.reposts || []}
              repostOf={reply.repostOf || null}
              repostedBy={reply.repostedBy || null}
            />
          </div>
        </div>
      ))}
    </section>
  );
};

export default RepliesTab;
