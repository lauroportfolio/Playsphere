import Image from "next/image";
import { currentUser } from "@clerk/nextjs/server";
import { communityTabs } from "@/constants";
import { fetchCommunityDetails } from "@/lib/actions/community.actions";

import ProfileHeader from "@/components/shared/ProfileHeader";
import ThreadsTab from "@/components/shared/ThreadsTab";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import UserCard from "@/components/cards/UserCard";
import { redirect } from "next/navigation";

type Member = {
  _id?: any;
  id?: string;
  name?: string;
  username?: string;
  image?: string;
};

async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const communityDetails: any | null = await fetchCommunityDetails(id);

  if (!communityDetails) {
    return (
      <section className="text-center mt-20 text-light-3">
        <h2 className="text-heading2-bold">Comunidade não encontrada</h2>
        <p className="text-base-regular mt-2">
          A comunidade pode ter sido removida ou o link está incorreto.
        </p>
      </section>
    );
  }

  // Normaliza id do recurso (prefere `id` string, senão usa `_id`)
  const communityPublicId = communityDetails.id || communityDetails._id?.toString();

  return (
    <section>
      <ProfileHeader
        accountId={communityPublicId}
        authUserId={user.id}
        name={communityDetails?.name ?? "Comunidade"}
        username={communityDetails?.username ?? communityPublicId}
        imgUrl={communityDetails?.image ?? "/assets/community.svg"}
        bio={communityDetails?.bio ?? ""}
        type="Community"
      />

      <div className="mt-9">
        <Tabs defaultValue="threads" className="w-full">
          <TabsList className="tab">
            {communityTabs.map((tab) => (
              <TabsTrigger key={tab.label} value={tab.value} className="tab">
                <Image
                  src={tab.icon}
                  alt={tab.label}
                  width={24}
                  height={24}
                  className="object-contain"
                />
                <p className="text-left max-sm:hidden">{tab.label}</p>

                {tab.label === "Posts" && (
                  <p className="rounded-sm bg-light-4 px-2 py-1 text-light-2 tiny-medium">
                    {Array.isArray(communityDetails?.threads)
                      ? communityDetails.threads.length
                      : 0}
                  </p>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="threads" className="w-full text-light-1">
            <ThreadsTab
              currentUserId={user.id}
              accountId={communityDetails._id}
              accountType="Community"
            />
          </TabsContent>

          <TabsContent value="members" className="w-full text-light-1">
            <section className="mt-9 flex flex-col gap-8">
              {Array.isArray(communityDetails?.members) && communityDetails.members.length > 0 ? (
                communityDetails.members.map((member: Member) => {
                  const memberId = member?.id || member?._id?.toString();
                  return (
                    <div
                      key={memberId}
                      className="flex items-center gap-3 bg-dark-3 p-3 rounded-xl"
                    >
                      <div className="flex-1">
                        <UserCard
                          id={memberId}
                          name={member?.name ?? "Usuário"}
                          username={member?.username ?? ""}
                          imgUrl={member?.image || "/assets/user.svg"}
                          personType="User"
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-light-3 text-center mt-5">Nenhum membro ainda.</p>
              )}
            </section>
          </TabsContent>

          <TabsContent value="requests" className="w-full text-light-1">
            <p className="text-light-3 ml-4 mt-6">Sem solicitações no momento.</p>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

export default Page;
