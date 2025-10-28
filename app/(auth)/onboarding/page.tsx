import AccountProfile from "@/components/forms/AccountProfile"
import { fetchUser } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation";

async function Page() {
    const user = await currentUser();
    if (!user) return null;

    const userInfo = await fetchUser(user.id);
    if (userInfo?.onboarded) redirect("/");

    const userData = {
        id: user.id,
        objectId: userInfo?._id,
        username: userInfo ? userInfo?.username : user.username,
        name: userInfo ? userInfo?.name : user.firstName ?? "",
        bio: userInfo ? userInfo?.bio : "",
        image: userInfo ? userInfo?.image : user.imageUrl,
    };

    return (
        <main className="onboarding-container">
            <h1 className="head-text">Integração</h1>
            <p className="onboarding-p1 text-light-2">
                Complete seu perfil agora para usar o PlaySphere
            </p>

            <section className="onboarding-section">
                <AccountProfile
                    user={userData}
                    btnTitle="Continue"
                />
            </section>
        </main>
    )
}

export default Page