import ProfileHeader from "@/components/shared/ProfileHeader";
import { fetchUser } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { profileTabs } from "@/constants";
import Image from "next/image";
import ThreadsTab from "@/components/shared/ThreadsTab";
import LikedThreadsTab from "@/components/shared/LikedThreadsTab";
import RepliesTab from "@/components/shared/RepliesTab";
import { fetchUserPostCount } from "@/lib/actions/thread.actions";

async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(id);
  const plainUserInfo = JSON.parse(JSON.stringify(userInfo));

  if (!plainUserInfo || !plainUserInfo?.onboarded) redirect("/onboarding");

  return (
    <section>
      <ProfileHeader
        accountId={plainUserInfo.id}
        authUserId={user.id}
        name={plainUserInfo.name}
        username={plainUserInfo.username}
        imgUrl={plainUserInfo.image}
        bio={plainUserInfo.bio}
        followers={plainUserInfo.followers || []}
        following={plainUserInfo.following || []}
      />

      <div className="mt-9">
        <Tabs defaultValue="threads" className="w-full">
          <TabsList className="tab">
            {profileTabs.map((tab) => (
              <TabsTrigger key={tab.label} value={tab.value} className="tab cursor-pointer">
                <Image
                  src={tab.icon}
                  alt={tab.label}
                  width={24}
                  height={24}
                  className="object-contain"
                />
                <p className="text-left max-sm:hidden">{tab.label}</p>

                {tab.label === "Posts" && (
                  <DynamicPostCount userId={plainUserInfo.id} />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ✅ Mantém apenas este bloco! */}
          {profileTabs.map((tab) => (
            <TabsContent
              key={`content-${tab.label}`}
              value={tab.value}
              className="w-full text-light-1"
            >
              {tab.value === "threads" && (
                <ThreadsTab
                  currentUserId={user.id}
                  accountId={plainUserInfo.id}
                  accountType="User"
                />
              )}
              {tab.value === "replies" && (
                <RepliesTab userId={plainUserInfo._id} currentUserId={user.id} />
              )}
              {tab.value === "tagged" && (
                <LikedThreadsTab
                  userId={plainUserInfo._id}
                  currentUserId={user.id}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}

// 🔹 Componente dinâmico para contar posts reais no banco
async function DynamicPostCount({ userId }: { userId: string }) {
  const count = await fetchUserPostCount(userId);

  return (
    <p className="rounded-sm bg-light-4 px-2 py-1 text-light-2 tiny-medium">
      {count}
    </p>
  );
}

export default Page;
