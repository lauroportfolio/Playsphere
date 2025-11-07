import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { fetchUser, fetchUsers } from "@/lib/actions/user.actions";
import UserCard from "@/components/cards/UserCard";
import Searchbar from "@/components/shared/Searchbar";
import Pagination from "@/components/shared/Pagination";

async function Page({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const params = await searchParams;

  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const result = await fetchUsers({
    userId: user.id,
    searchString: params.q || "",
    pageNumber: params?.page ? +params.page : 1,
    pageSize: 10,
  });

  return (
    <section>
      <h1 className="head-text mb-10">Buscar Usuários</h1>

      {/* 🔍 Barra de busca */}
      <Searchbar routeType="search" />

      <div className="mt-14 flex flex-col gap-9">
        {result.users.length === 0 ? (
          <p className="no-result">Nenhum usuário encontrado.</p>
        ) : (
          <>
            {result.users.map((person) => (
              <UserCard
                key={person.id}
                id={person.id}
                name={person.name}
                username={person.username}
                imgUrl={person.image}
                personType="User"
              />
            ))}
          </>
        )}
      </div>

      {/* 🔄 Paginação */}
      <Pagination
        path="search"
        pageNumber={params?.page ? +params.page : 1}
        isNext={result.isNext}
      />
    </section>
  );
}

export default Page;