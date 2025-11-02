import AccountProfile from "@/components/forms/AccountProfile";
import { fetchUser } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import type { User } from "@clerk/nextjs/server";

export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) throw new Error("Usuário não autenticado");
  return user;
}

async function Page() {
  const user = await requireUser();

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding"); // se ainda não fez onboarding, redireciona pra lá

  const userData = {
    id: user.id,
    objectId: userInfo?._id,
    username: userInfo?.username || user.username,
    name: (userInfo?.name || user.firstName) ?? "",
    bio: userInfo?.bio || "",
    image: userInfo?.image || user.imageUrl,
  };

  return (
    <main className="onboarding-container">
      <h1 className="head-text">Editar Perfil</h1>
      <p className="onboarding-p1 text-light-2">
        Altere as informações da sua conta abaixo
      </p>

      <section className="onboarding-section">
        <AccountProfile user={userData} btnTitle="Salvar alterações" />
      </section>
    </main>
  );
}

export default Page;