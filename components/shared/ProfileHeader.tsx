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

  const followersData = await User.find({ id: { $in: followers } }).select(
    "id name username image"
  );
  const followingData = await User.find({ id: { $in: following } }).select(
    "id name username image"
  );

  return (
    <div className="flex w-full flex-col justify-start">
      {/* 🔹 Topo: Imagem + nome + botão (desktop apenas) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
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

        {/* 🔹 Botão no topo (somente desktop) */}
        <div className="hidden sm:flex justify-end w-auto">
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
                className={`cursor-pointer px-4 py-2 rounded-md ${
                  isFollowing
                    ? "bg-light-4 text-dark-1 hover:bg-light-3"
                    : "bg-primary-500 text-white hover:bg-primary-600"
                }`}
              >
                {isFollowing ? "Seguindo" : "Seguir"}
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* 🔹 Bio */}
      <p className="mt-4 max-w-lg base-regular text-light-2">{bio}</p>

      {/* 🔹 Seguidores / Seguindo */}
      <div className="flex gap-6 mt-4 flex-wrap text-light-2">
        {/* Seguidores */}
        <Dialog>
          <DialogTrigger asChild>
            <div className="cursor-pointer flex items-center gap-1">
              <span className="text-[#877EFF]">{followers.length}</span>
              <span>seguidor{followers.length !== 1 ? "es" : ""}</span>
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
                      <p className="text-light-1 font-semibold">{follower.name}</p>
                      <p className="text-gray-400 text-sm">@{follower.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Seguindo */}
        <Dialog>
          <DialogTrigger asChild>
            <div className="cursor-pointer flex items-center gap-1">
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
                      <p className="text-light-1 font-semibold">{followed.name}</p>
                      <p className="text-gray-400 text-sm">@{followed.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* 🔹 Botão para mobile — abaixo de seguidores */}
      <div className="mt-5 w-full flex justify-start sm:hidden">
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
              className={`w-full cursor-pointer px-4 py-2 rounded-md ${
                isFollowing
                  ? "bg-light-4 text-dark-1 hover:bg-light-3"
                  : "bg-primary-500 text-white hover:bg-primary-600"
              }`}
            >
              {isFollowing ? "Seguindo" : "Seguir"}
            </Button>
          </form>
        )}
      </div>

      {/* 🔹 Linha divisória */}
      <div className="mt-8 h-0.5 w-full bg-dark-3" />
    </div>
  );
};

export default ProfileHeader;
