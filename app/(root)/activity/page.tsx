import ActivityClient from "./ActivityClient";
import { fetchUser, getActivity } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

async function Page() {
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const activity = await getActivity(userInfo._id.toString());

  return (
    <section>
      {/* 🔹 Esse componente cuida do localStorage e da chamada API */}
      <ActivityClient />

      <h1 className="head-text mb-10">Atividades</h1>

      <section className="mt-10 flex flex-col gap-5">
        {activity.length > 0 ? (
          activity.map((a) => (
            <Link key={a._id} href={`/thread/${a.parentId}`}>
              <article className="activity-card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden">
                    <Image
                      src={a.author.image}
                      alt={a.author.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="small-regular text-light-1">
                    <span className="mr-1 text-primary-500">{a.author.name}</span>
                    {a.type === "reply"
                      ? "respondeu seu post"
                      : a.type === "repost"
                      ? "repostou seu post"
                      : "curtiu seu post"}
                  </p>
                </div>
                <div className="flex-shrink-0 w-5 h-5">
                  {a.type === "reply" ? (
                    <Image src="/assets/reply-filled.svg" alt="comentário" width={22} height={22} />
                  ) : a.type === "repost" ? (
                    <Image src="/assets/repost-filled.svg" alt="repost" width={22} height={22} />
                  ) : (
                    <Image src="/assets/heart-filled.svg" alt="curtida" width={22} height={22} />
                  )}
                </div>
              </article>
            </Link>
          ))
        ) : (
          <p className="!base-regular text-light-3">Nenhuma notificação</p>
        )}
      </section>
    </section>
  );
}

export default Page;
