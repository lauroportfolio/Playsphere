import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { fetchUser } from "@/lib/actions/user.actions";

export default async function RedirectAfterLoginPage() {
  const user = await currentUser();

  if (!user) redirect("/sign-in");

  const existingUser = await fetchUser(user.id);

  if (!existingUser) {
    // cria um novo usuário se ainda não existir
    redirect("/onboarding");
  }

  // ⚡ evita redirecionamento em loop
  if (existingUser.onboarded === false) {
    redirect("/onboarding");
  }

  redirect("/");
}
