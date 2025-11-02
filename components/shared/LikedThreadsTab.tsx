import { fetchLikedPosts } from "@/lib/actions/thread.actions";
import ThreadCard from "@/components/cards/ThreadCard";

interface Props {
  userId: string;
  currentUserId: string;
}

const LikedThreadsTab = async ({ userId, currentUserId }: Props) => {
  const likedPosts = await fetchLikedPosts(userId);

  if (!likedPosts || likedPosts.length === 0) {
    return <p className="text-gray-1 mt-4">Nenhum post curtido ainda.</p>;
  }

  return (
    <section className="mt-4 flex flex-col gap-6">
      {likedPosts.map((post) => (
        <ThreadCard
          key={post._id}
          id={post._id}
          currentUserId={currentUserId}
          parentId={post.parentId}
          content={post.text}
          author={post.author}
          community={post.community || null}
          createdAt={post.createdAt}
          comments={post.children || []}
          likes={post.likes || []}
        />
      ))}
    </section>
  );
};

export default LikedThreadsTab;
