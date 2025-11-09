import { currentUser } from "@clerk/nextjs/server";
import ThreadCard from "@/components/cards/ThreadCard";
import GlobalRefreshListener from "@/components/shared/GlobalRefreshListener";
import { fetchPosts } from "@/lib/actions/thread.actions";

export default async function Home() {
  const result = await fetchPosts(1, 30);
  const user = await currentUser();

  return (
    <>
      {/* 🔁 Atualiza automaticamente quando deletar repost */}
      <GlobalRefreshListener />

      <h1 className="home-container">Home</h1>

      <section className="mt-9 flex flex-col gap-10">
        {result.posts.length === 0 ? (
          <p className="no-result base-regular">Nenhuma postagem encontrada</p>
        ) : (
          result.posts.map((post) => (
            <ThreadCard
              key={post._id}
              id={post._id}
              currentUserId={user?.id || ""}
              parentId={post.parentId}
              content={post.text}
              author={post.author}
              community={post.community}
              createdAt={post.createdAt}
              comments={post.children}
              likes={post.likes}
              reposts={post.reposts}
              repostOf={post.repostOf}
              repostedBy={post.repostedBy}
            />
          ))
        )}
      </section>
    </>
  );
}