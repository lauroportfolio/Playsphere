"use server";

import mongoose, { FilterQuery, SortOrder } from "mongoose";
import { revalidatePath } from "next/cache";

import Community from "../models/community.model";
import Thread from "../models/thread.model";
import User from "../models/user.model";

import { connectToDB } from "../mongoose";

export async function fetchUser(userId: string) {
  try {
    connectToDB();

    const user = await User.findOne({ id: userId })
      .select("id name username image bio onboarded followers following communities threads")
      .populate({
        path: "communities",
        model: Community,
      });

    return user || null;
  } catch (error: any) {
    throw new Error(`Erro ao buscar usuário: ${error.message}`);
  }
}

interface Params {
  userId: string;
  username: string;
  name: string;
  bio: string;
  image: string;
  path: string;
}

export async function updateUser({
  userId,
  bio,
  name,
  path,
  username,
  image,
}: Params): Promise<void> {
  try {
    connectToDB();

    await User.findOneAndUpdate(
      { id: userId },
      {
        username: username.toLowerCase(),
        name,
        bio,
        image,
        onboarded: true,
      },
      { upsert: true }
    );

    if (path === "/profile/edit") {
      revalidatePath(path);
    }
  } catch (error: any) {
    throw new Error(`Erro ao criar/atualizar usuário: ${error.message}`);
  }
}

export async function fetchUserPosts(userId: string) {
  try {
    await connectToDB();

    const user = (await User.findOne({ id: userId })
      .populate({
        path: "threads",
        model: Thread,
        populate: [
          {
            path: "community",
            model: Community,
            select: "name id image _id",
          },
          {
            path: "children",
            model: Thread,
            populate: {
              path: "author",
              model: User,
              select: "name image id",
            },
          },
        ],
      })
      .lean()) as {
        _id: string;
        id: string;
        threads: any[];
      } | null;

    if (!user) return null;

    // 1) Normalizar entries: podem ser objetos populados, ObjectId ou strings
    const rawThreads = Array.isArray(user.threads) ? user.threads : [];

    // separa ids que ainda são strings/ObjectId (não-populados) e objetos populados
    const missingIds: string[] = [];
    const populatedThreads: any[] = [];

    for (const entry of rawThreads) {
      if (!entry) continue;
      if (typeof entry === "string") {
        missingIds.push(entry);
      } else if (entry._id) {
        // já é objeto populado
        populatedThreads.push(entry);
      } else if (entry.toString && mongoose.Types.ObjectId.isValid(entry.toString())) {
        // algum ObjectId bruto
        missingIds.push(entry.toString());
      } else {
        // fallback — trata como string
        try {
          const s = String(entry);
          if (s) missingIds.push(s);
        } catch {
          // ignora
        }
      }
    }

    // 2) buscar os threads faltantes (se houver)
    let fetchedThreads: any[] = [];
    if (missingIds.length > 0) {
      // dedupe missingIds antes de buscar
      const uniqueMissing = Array.from(new Set(missingIds));
      fetchedThreads = await Thread.find({ _id: { $in: uniqueMissing } })
        .populate({
          path: "community",
          model: Community,
          select: "name id image _id",
        })
        .populate({
          path: "children",
          model: Thread,
          populate: {
            path: "author",
            model: User,
            select: "name image id",
          },
        })
        .lean();
    }

    // 3) juntar todos e remover duplicatas por _id (string)
    const all = [...populatedThreads, ...fetchedThreads];
    const map = new Map<string, any>();
    for (const t of all) {
      if (!t) continue;
      const idStr = t._id ? String(t._id) : null;
      if (!idStr) continue;
      if (!map.has(idStr)) map.set(idStr, t);
      // se tiver duplicata e quiser priorizar o populado, poderíamos atualizar aqui;
      // mantemos o primeiro encontro (populatedThreads vem antes de fetchedThreads)
    }

    const uniqueThreads = Array.from(map.values());

    // 4) substituir no objeto user e retornar no mesmo formato que o ThreadsTab espera
    // (se você precisa do objeto Mongoose com métodos, em vez de plain object, remova o .lean() acima)
    const userResult = { ...user, threads: uniqueThreads };

    return userResult;
  } catch (err) {
    console.error("Erro ao buscar posts do usuário (fetchUserPosts):", err);
    throw err;
  }
}

// Almost similar to Thead (search + pagination) and Community (search + pagination)
export async function fetchUsers({
  userId,
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  sortBy = "desc",
}: {
  userId: string;
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortOrder;
}) {
  try {
    connectToDB();

    // Calculate the number of users to skip based on the page number and page size.
    const skipAmount = (pageNumber - 1) * pageSize;

    // Create a case-insensitive regular expression for the provided search string.
    const regex = new RegExp(searchString, "i");

    // Create an initial query object to filter users.
    const query: FilterQuery<typeof User> = {
      id: { $ne: userId }, // Exclude the current user from the results.
    };

    // If the search string is not empty, add the $or operator to match either username or name fields.
    if (searchString.trim() !== "") {
      query.$or = [
        { username: { $regex: regex } },
        { name: { $regex: regex } },
      ];
    }

    // Define the sort options for the fetched users based on createdAt field and provided sort order.
    const sortOptions = { createdAt: sortBy };

    const usersQuery = User.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize);

    // Count the total number of users that match the search criteria (without pagination).
    const totalUsersCount = await User.countDocuments(query);

    const users = await usersQuery.exec();

    // Check if there are more users beyond the current page.
    const isNext = totalUsersCount > skipAmount + users.length;

    return { users, isNext };
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    throw error;
  }
}

export async function getActivity(userMongoId: string) {
  try {
    await connectToDB();

    // 1️⃣ Buscar todos os posts do usuário
    const userThreads = await Thread.find({ author: userMongoId })
      .populate({
        path: "children",
        populate: { path: "author", model: User, select: "name image _id id" },
      })
      .select("_id author text createdAt parentId likes children reposts");

    // 2️⃣ Filtrar replies (comentários de outras pessoas)
    const replies = userThreads.flatMap((thread) =>
      thread.children.filter(
        (child: any) => String(child.author._id) !== String(userMongoId)
      )
    );

    // 3️⃣ Montar atividades de curtidas
    const likes: any[] = [];
    for (const thread of userThreads) {
      if (!Array.isArray(thread.likes) || thread.likes.length === 0) continue;

      // Buscar usuários que curtiram (Clerk IDs)
      const usersWhoLiked = await User.find({
        id: { $in: thread.likes },
      }).select("name image _id id");

      for (const u of usersWhoLiked) {
        // Ignorar o próprio usuário curtindo o próprio post
        if (String(u._id) === String(userMongoId)) continue;
        likes.push({
          _id: `${thread._id}-${u._id}`,
          type: "like",
          author: u,
          parentId: thread._id,
        });
      }
    }

    // 4️⃣ Montar atividades de reposts
    const reposts: any[] = [];
    for (const thread of userThreads) {
      if (!Array.isArray(thread.reposts) || thread.reposts.length === 0)
        continue;

      // Buscar usuários que repostaram
      const usersWhoReposted = await User.find({
        _id: { $in: thread.reposts },
      }).select("name image _id id");

      for (const u of usersWhoReposted) {
        // Ignorar o dono repostando o próprio post
        if (String(u._id) === String(userMongoId)) continue;
        reposts.push({
          _id: `${thread._id}-repost-${u._id}`,
          type: "repost",
          author: u,
          parentId: thread._id,
        });
      }
    }

    // 5️⃣ Unir todas as atividades
    const activity = [
      ...replies.map((r: any) => ({
        _id: r._id,
        type: "reply",
        author: r.author,
        parentId: r.parentId,
      })),
      ...likes,
      ...reposts,
    ];

    // 6️⃣ Ordenar (opcional — mais recentes primeiro)
    activity.sort((a, b) => (a._id < b._id ? 1 : -1));

    return activity;
  } catch (err) {
    console.error("Erro ao buscar atividades:", err);
    throw err;
  }
}

// 🔹 Atualiza o contador de notificações locais
export async function incrementLocalNotificationCount() {
  if (typeof window === "undefined") return;
  const current = parseInt(localStorage.getItem("unreadCount") || "0", 10);
  localStorage.setItem("unreadCount", String(current + 1));

  // emite evento global (para Sidebar e Bottombar)
  window.dispatchEvent(new Event("notifications:update"));
}

// 🔹 Zera o contador de notificações locais
export async function resetLocalNotificationCount() {
  if (typeof window === "undefined") return;
  localStorage.setItem("unreadCount", "0");
  window.dispatchEvent(new Event("notifications:update"));
}

// 🧩 Alternar seguir/desseguir usuário (debug-friendly, usa Clerk IDs)
export async function toggleFollow(authUserId: string, targetUserId: string, path: string) {
  try {
    await connectToDB();

    console.log("toggleFollow called", { authUserId, targetUserId, path });

    // não pode seguir a si mesmo
    if (!authUserId || !targetUserId) {
      console.warn("toggleFollow missing ids", { authUserId, targetUserId });
      return { ok: false, reason: "missing-ids" };
    }
    if (authUserId === targetUserId) {
      console.warn("toggleFollow: same user");
      return { ok: false, reason: "self-follow" };
    }

    // busca ambos usuários pelo campo "id" (Clerk)
    const currentUser = await User.findOne({ id: authUserId }).exec();
    const targetUser = await User.findOne({ id: targetUserId }).exec();

    console.log("toggleFollow found users", {
      currentUserExists: !!currentUser,
      targetUserExists: !!targetUser,
    });

    if (!currentUser || !targetUser) {
      console.error("Usuário não encontrado no toggleFollow", { authUserId, targetUserId });
      return { ok: false, reason: "user-not-found" };
    }

    // garante que os arrays existem
    if (!Array.isArray(currentUser.following)) currentUser.following = [];
    if (!Array.isArray(targetUser.followers)) targetUser.followers = [];

    console.log("before arrays", {
      following: currentUser.following.slice(0, 50),
      followers: targetUser.followers.slice(0, 50),
    });

    // verifica se já está seguindo
    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // deixar de seguir
      currentUser.following = currentUser.following.filter((id: string) => id !== targetUserId);
      targetUser.followers = targetUser.followers.filter((id: string) => id !== authUserId);

    } else {
      // seguir
      currentUser.following.push(targetUserId);
      targetUser.followers.push(authUserId);
      console.log("toggleFollow -> following");
    }

    await currentUser.save();
    await targetUser.save();

    console.log("after save arrays", {
      following: currentUser.following.slice(0, 50),
      followers: targetUser.followers.slice(0, 50),
    });

    // revalidate the route you passed
    try {
      revalidatePath(path);
      console.log("revalidated path", path);
    } catch (e) {
      console.warn("revalidatePath failed:", e);
    }

    return { ok: true, following: !isFollowing };
  } catch (error: any) {
    console.error("Erro no toggleFollow:", error);
    throw new Error("Falha ao seguir/deixar de seguir usuário");
  }
}

// 🧲 Buscar lista de seguidores de um usuário
export async function fetchFollowers(userId: string) {
  try {
    await connectToDB();

    // Busca o usuário pelo id do Clerk
    const user = await User.findOne({ id: userId }).select("followers");

    if (!user) throw new Error("Usuário não encontrado");

    // Busca os usuários correspondentes aos IDs em followers
    const followers = await User.find({ id: { $in: user.followers } }).select(
      "id name username image"
    );

    // Retorna JSON puro pra evitar problemas de serialização no Next
    return JSON.parse(JSON.stringify(followers));
  } catch (error) {
    console.error("Erro ao buscar seguidores:", error);
    throw new Error("Falha ao buscar seguidores");
  }
}

// 🧲 Buscar lista de usuários que o perfil segue
export async function fetchFollowing(userId: string) {
  try {
    await connectToDB();

    const user = await User.findOne({ id: userId }).select("following");

    if (!user) throw new Error("Usuário não encontrado");

    const following = await User.find({ id: { $in: user.following } }).select(
      "id name username image"
    );

    return JSON.parse(JSON.stringify(following));
  } catch (error) {
    console.error("Erro ao buscar seguindo:", error);
    throw new Error("Falha ao buscar seguindo");
  }
}

// 🔹 Contador de notificações não lidas
export async function getUnreadActivityCount(userMongoId: string) {
  try {
    await connectToDB();

    const activities = await Thread.aggregate([
      { $match: { author: new mongoose.Types.ObjectId(userMongoId) } },
      {
        $project: {
          unreadReplies: {
            $size: {
              $filter: {
                input: "$children",
                as: "child",
                cond: { $ne: ["$$child.isRead", true] },
              },
            },
          },
          unreadLikes: {
            $cond: [
              { $gt: [{ $size: "$likes" }, 0] },
              { $size: "$likes" },
              0,
            ],
          },
        },
      },
    ]);

    const total = activities.reduce(
      (acc, a) => acc + (a.unreadReplies || 0) + (a.unreadLikes || 0),
      0
    );

    return total;
  } catch (error) {
    console.error("Erro ao buscar contador de notificações:", error);
    return 0;
  }
}

// 🔹 Marca todas as atividades como lidas
export async function markActivitiesAsRead(userMongoId: string) {
  try {
    await connectToDB();

    // Encontra todos os posts do usuário
    const userThreads = await Thread.find({ author: userMongoId });

    // Marca todos os filhos (respostas) desses posts como "lidos"
    for (const thread of userThreads) {
      await Thread.updateMany(
        { _id: { $in: thread.children } },
        { $set: { isRead: true } }
      );
    }

    // Aqui futuramente podemos incluir likes e reposts se forem armazenados separadamente
    return true;
  } catch (error) {
    console.error("Erro ao marcar atividades como lidas:", error);
    return false;
  }
}

export async function fetchCommunities({ limit = 5 }: { limit?: number } = {}) {
  try {
    await connectToDB();
    const communities = await Community.find()
      .sort({ membersCount: -1 }) // mais populares primeiro
      .limit(limit);
    return JSON.parse(JSON.stringify(communities));
  } catch (err) {
    console.error("Erro ao buscar comunidades sugeridas:", err);
    return [];
  }
}