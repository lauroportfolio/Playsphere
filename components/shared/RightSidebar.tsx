import Link from "next/link";
import Image from "next/image";
import { getRandomUsers, getRandomCommunities } from "@/lib/actions/suggestions.actions";

export default async function RightSidebar() {
    const suggestedUsers = await getRandomUsers(3);
    const suggestedCommunities = await getRandomCommunities(3);

    return (
        <section className="rightsidebar px-3 py-4 space-y-8 overflow-hidden">
            {/* 🧑‍🤝‍🧑 Comunidades sugeridas */}
            <div>
                <h3 className="text-heading4-medium text-light-1 mb-4">
                    Comunidades Sugeridas
                </h3>

                {suggestedCommunities.length > 0 ? (
                    <div className="flex flex-col gap-3">
                        {suggestedCommunities.map((community: any) => (
                            <Link
                                key={community._id}
                                href={`/communities/${community._id}`}
                                className="flex flex-col items-center justify-center bg-dark-3 p-3 rounded-lg hover:bg-dark-4 transition"
                            >
                                <div className="relative w-[50px] h-[50px] mb-2 rounded-full overflow-hidden">
                                    <Image
                                        src={
                                            community.image && community.image.trim() !== ""
                                                ? community.image
                                                : "/assets/community.svg"
                                        }
                                        alt={community.name || "Comunidade"}
                                        fill
                                        className="object-cover"
                                    />
                                </div>

                                <p
                                    className="text-light-2 text-center text-sm font-medium truncate max-w-[100px]"
                                    title={community.name}
                                >
                                    {community.name}
                                </p>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-light-3 text-sm">Nenhuma comunidade sugerida</p>
                )}
            </div>

            {/* 👤 Usuários sugeridos */}
            <div>
                <h3 className="heading4-medium text-light-1 mb-4">
                    Usuários Sugeridos
                </h3>

                {suggestedUsers.length > 0 ? (
                    <div className="flex flex-col gap-3">
                        {suggestedUsers.map((user: any) => (
                            <Link
                                key={user._id}
                                href={`/profile/${user.id}`}
                                className="flex flex-col items-center justify-center bg-dark-3 p-3 rounded-lg hover:bg-dark-4 transition"
                            >
                                <div className="relative w-[50px] h-[50px] mb-2">
                                    <Image
                                        src={user.image || "/assets/default-profile.png"}
                                        alt={user.name}
                                        fill
                                        className="rounded-full object-cover"
                                    />
                                </div>

                                <p
                                    className="text-light-2 text-center text-sm font-medium truncate max-w-[100px]"
                                    title={user.name}
                                >
                                    {user.name}
                                </p>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-light-3 text-sm">Nenhum usuário sugerido</p>
                )}
            </div>
        </section>
    );
}
