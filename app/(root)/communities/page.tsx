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
  const params = await searchParams;

  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const result = await fetchCommunities({
    searchString: params.q ?? "",
    pageNumber: params.page ? +params.page : 1,
    pageSize: 8,
  });

  return (
    <section>
      <h1 className="head-text mb-10">Buscar Comunidades</h1>

      {/* 🔍 Barra de busca */}
      <Searchbar routeType="communities" />

      <div className="mt-9 flex flex-wrap gap-4">
        {result.communities.length === 0 ? (
          <p className="no-result">Nenhuma comunidade encontrada</p>
        ) : (
          result.communities.map((community: any) => (
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

      {/* 🔄 Paginação */}
      <Pagination
        path="communities"
        pageNumber={params.page ? +params.page : 1}
        isNext={result.isNext}
      />
    </section>
  );
}

export default Page;