import { fetchUser } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { fetchCommunities } from "@/lib/actions/community.actions";
import CommunityCard from "@/components/cards/CommunityCard";
import Searchbar from "@/components/shared/Searchbar";
import Pagination from "@/components/shared/Pagination";

async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  // ✔ Agora estamos seguindo exatamente o que o Next exige
  const params = await searchParams;

  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const page = params.page ? Number(params.page) : 1;

  const result = await fetchCommunities({
    searchString: params.q ?? "",
    pageNumber: page,
    pageSize: 4,
  });

  return (
    <section>
      <h1 className="head-text mb-10">Buscar Comunidades</h1>

      <Searchbar routeType="communities" />

      <div className="communities-container mt-9">
        {result.communities.length === 0 ? (
          <p className="no-result">Nenhuma comunidade encontrada</p>
        ) : (
          result.communities.map((community) => (
            <CommunityCard
              key={community.id}
              id={community.id}
              name={community.name}
              username={community.username}
              imgUrl={community.image}
              bio={community.bio}
              members={community.members}
            />
          ))
        )}
      </div>

      <Pagination
        path="communities"
        pageNumber={page}
        isNext={result.isNext}
      />
    </section>
  );
}

export default Page;