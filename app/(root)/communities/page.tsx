import ProfileHeader from "@/components/shared/ProfileHeader";
import { fetchUser } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { profileTabs } from "@/constants";
import Image from "next/image";
import ThreadsTab from "@/components/shared/ThreadsTab";
import UserCard from "@/components/cards/UserCard";
import { fetchCommunities } from "@/lib/actions/community.actions";
import CommunityCard from "@/components/cards/CommunityCard";

async function Page() {
    const user = await currentUser();
    if (!user) return null;

    const userInfo = await fetchUser(user.id);
    if (!userInfo?.onboarded) redirect('/onboarding');

    const result = await fetchCommunities({
        searchString: "",
        pageNumber: 1,
        pageSize: 25
    })

    return (
        <section>
            <h1 className="head-text mb-10">Buscar</h1>

            {/* SEARCH BAR */}
            <div className="mt-9 flex flex-wrap gap-4">
                {result.communities.length === 0 ? (
                    <p className="no-result">Nenhum usuário</p>
                ) : (
                    <>
                        {result.communities.map((community) => (
                            <CommunityCard 
                                key={community.id}
                                id={community.id}
                                name={community.name}
                                username={community.username}
                                imgUrl={community.image}
                                bio={community.bio}
                                members={community.members}
                            />
                        ))}
                    </>
                )}
            </div>
        </section>
    )
}

export default Page