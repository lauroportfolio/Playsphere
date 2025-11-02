import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { connectToDB } from "@/lib/mongoose";
import User from "@/lib/models/user.model";
import EditProfileButton from "./EditProfileButton";

interface Props {
    accountId: string;
    authUserId: string;
    name: string;
    username: string;
    imgUrl: string;
    bio: string;
    followers?: string[];
    following?: string[];
    type?: "User" | "Community";
}

const ProfileHeader = async ({
    accountId,
    authUserId,
    name,
    username,
    imgUrl,
    bio,
    followers = [],
    following = [],
}: Props) => {
    const isOwnProfile = authUserId === accountId;
    const isFollowing = followers.includes(authUserId);

    await connectToDB();

    // 🔹 Carregar detalhes dos seguidores e seguindo
    const followersData = await User.find({ id: { $in: followers } }).select(
        "id name username image"
    );
    const followingData = await User.find({ id: { $in: following } }).select(
        "id name username image"
    );

    return (
        <div className="flex w-full flex-col justify-start">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative h-20 w-20 object-cover">
                        <Image
                            src={imgUrl}
                            alt="Imagem de Perfil"
                            fill
                            className="rounded-full object-cover shadow-2xl"
                        />
                    </div>

                    <div className="flex-1">
                        <h2 className="text-left text-heading3-bold text-light-1">
                            {name}
                        </h2>
                        <p className="base-medium text-gray-1">@{username}</p>
                    </div>
                </div>

                {/* 🔹 Botão Seguir ou Editar Perfil */}
                {isOwnProfile ? (
                    <EditProfileButton userId={accountId} />
                ) : (
                    <form
                        action={async () => {
                            "use server";
                            const { toggleFollow } = await import("@/lib/actions/user.actions");
                            await toggleFollow(authUserId, accountId, `/profile/${accountId}`);
                        }}
                    >
                        <Button
                            type="submit"
                            variant={isFollowing ? "secondary" : "default"}
                            className={`cursor-pointer px-4 py-2 rounded-md ${isFollowing
                                    ? "bg-light-4 text-dark-1 hover:bg-light-3"
                                    : "bg-primary-500 text-white hover:bg-primary-600"
                                }`}
                        >
                            {isFollowing ? "Seguindo" : "Seguir"}
                        </Button>
                    </form>
                )}


            </div>

            <p className="mt-6 max-w-lg base-regular text-light-2">{bio}</p>

            {/* --- Contadores + modais --- */}
            <div className="flex gap-6 mt-4">
                {/* 🔹 Modal Seguidores */}
                <Dialog>
                    <DialogTrigger asChild>
                        <div className="cursor-pointer text-light-2 flex items-center gap-1">
                            <span className="text-[#877EFF]">{followers.length}</span>
                            <span>
                                seguidor{followers.length !== 1 ? "es" : ""}
                            </span>
                        </div>
                    </DialogTrigger>
                    <DialogContent className="bg-dark-2 border-none max-w-md max-h-[60vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-light-1 text-lg">
                                Seguidores de {name}
                            </DialogTitle>
                        </DialogHeader>

                        {followersData.length === 0 ? (
                            <p className="text-light-2 text-sm mt-3">Nenhum seguidor ainda.</p>
                        ) : (
                            <div className="flex flex-col gap-3 mt-3">
                                {followersData.map((follower: any) => (
                                    <Link
                                        key={follower.id}
                                        href={`/profile/${follower.id}`}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-3 transition"
                                    >
                                        <Image
                                            src={follower.image || "/assets/default-profile.png"}
                                            alt={follower.name}
                                            width={40}
                                            height={40}
                                            className="rounded-full object-cover"
                                        />
                                        <div>
                                            <p className="text-light-1 font-semibold">
                                                {follower.name}
                                            </p>
                                            <p className="text-gray-400 text-sm">
                                                @{follower.username}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* 🔹 Modal Seguindo */}
                <Dialog>
                    <DialogTrigger asChild>
                        <div className="cursor-pointer text-light-2 flex items-center gap-1">
                            <span className="text-[#877EFF]">{following.length}</span>
                            <span>seguindo</span>
                        </div>
                    </DialogTrigger>
                    <DialogContent className="bg-dark-2 border-none max-w-md max-h-[60vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-light-1 text-lg">
                                {name} está seguindo
                            </DialogTitle>
                        </DialogHeader>

                        {followingData.length === 0 ? (
                            <p className="text-light-2 text-sm mt-3">
                                Não segue ninguém ainda.
                            </p>
                        ) : (
                            <div className="flex flex-col gap-3 mt-3">
                                {followingData.map((followed: any) => (
                                    <Link
                                        key={followed.id}
                                        href={`/profile/${followed.id}`}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-3 transition"
                                    >
                                        <Image
                                            src={followed.image || "/assets/default-profile.png"}
                                            alt={followed.name}
                                            width={40}
                                            height={40}
                                            className="rounded-full object-cover"
                                        />
                                        <div>
                                            <p className="text-light-1 font-semibold">
                                                {followed.name}
                                            </p>
                                            <p className="text-gray-400 text-sm">
                                                @{followed.username}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            <div className="mt-12 h-0.5 w-full bg-dark-3" />
        </div>
    );
};

export default ProfileHeader;
