import AccountProfile from "@/components/forms/AccountProfile"
import { currentUser } from "@clerk/nextjs/server"

async function Page() {
    const user = await currentUser();

    const userInfo = {};

    const userData = {
        id: user?.id,
        objectId: userInfo?._id,
        username: userInfo?.username || user?.username,
        name: userInfo?.name || user?.firstName || "",
        bio: userInfo?.bio || "",
        image: userInfo?.image || user?.imageUrl,
    }

    return (
        <main className="onboarding-container">
            <h1 className="head-text">Onboarding</h1>
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