import { currentUser } from "@clerk/nextjs/server";
import { fetchUser } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";

export default async function RedirectAfterLoginPage() {
  const user = await currentUser();

  // se por algum motivo o usuário não existir
  if (!user) redirect("/sign-in");

  // verifica se já completou o onboarding
  const userInfo = await fetchUser(user.id);

  if (userInfo?.onboarded) {
    redirect("/"); // ✅ volta pra home
  } else {
    redirect("/onboarding"); // 🧭 vai pra onboarding se for novo
  }
}
