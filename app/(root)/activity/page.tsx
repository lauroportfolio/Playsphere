import { fetchUser, getActivity } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

async function Page() {
    const user = await currentUser();
    if (!user) return null;

    const userInfo = await fetchUser(user.id);
    if (!userInfo?.onboarded) redirect('/onboarding');

    const activity = await getActivity(userInfo._id);

    return (
        <section>
            <h1 className="head-text mb-10">Atividades</h1>

            <section className="mt-10 flex flex-col gap-5">
                {activity.length > 0 ? (
                    <>
                        {activity.map((activity) => (
                            <Link
                                key={activity._id}
                                href={`/thread/${activity.parentId}`}
                            >
                                <article className="activity-card">
                                    <Image
                                        src={activity.author.image}
                                        alt="Foto de Perfil"
                                        width={20}
                                        height={20}
                                        className="rounded-full object-cover"
                                    />

                                    <p className="small-regular text-light-1">
                                        <span className="mr-1 text-primary-500">
                                            {activity.author.name}
                                        </span>{" "}
                                        respondeu seu post
                                    </p>
                                </article>
                            </Link>
                        ))}
                    </>
                ) : <p className="!base-regular text-light-3">Nenhuma notificação</p>}
            </section>
        </section>
    )
}

export default Page
