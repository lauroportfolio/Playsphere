"use server";

import { revalidatePath } from "next/cache";
import { connectToDB } from "../mongoose";

import User from "../models/user.model";
import Thread from "../models/thread.model";
import Community from "../models/community.model";
import mongoose from "mongoose";
import Activity from "../models/activity.model";

export async function fetchPosts(pageNumber = 1, pageSize = 20) {
  await connectToDB();

  const skipAmount = (pageNumber - 1) * pageSize;

  const postsQuery = Thread.find({ parentId: { $in: [null, undefined] } })
    .sort({ createdAt: -1 })
    .skip(skipAmount)
    .limit(pageSize)
    .populate({
      path: "author",
      model: User,
      select: "_id id name username image",
    })
    .populate({
      path: "children",
      model: Thread,
      select: "_id author", // 👈 apenas o essencial
      populate: {
        path: "author",
        model: User,
        select: "_id id name username image", // 👈 mantém padrão com resto
      },
    })
    .populate({
      path: "community",
      model: Community,
      select: "_id id name image",
    })
    .populate({
      path: "repostedBy",
      model: User,
      select: "_id id name username image",
    })
    .populate({
      path: "reposts",
      model: User,
      select: "_id id name username image",
    })
    .populate({
      path: "repostOf",
      populate: [
        { path: "author", model: User, select: "_id id name username image" },
        { path: "community", model: Community, select: "_id id name image" },
      ],
    })
    .select(
      "_id text author community children parentId createdAt likes reposts repostedBy repostOf"
    );

  const totalPostsCount = await Thread.countDocuments({
    parentId: { $in: [null, undefined] },
  });

  const posts = await postsQuery.exec();

  const plainPosts = posts.map((p) => JSON.parse(JSON.stringify(p)));

  const virtualReposts = plainPosts.flatMap((post) => {
    if (!post.reposts?.length) return [];
    return post.reposts.map((user: any) => ({
      ...post,
      _id: `${post._id}-repost-${user.id || user._id}`,
      repostedBy: user,
      repostOf: post,
      reposts: post.reposts,
    }));
  });

  const allPosts = [...plainPosts, ...virtualReposts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const isNext = totalPostsCount > skipAmount + posts.length;

  return { posts: allPosts, isNext };
}

interface Params {
  text: string,
  author: string,
  communityId: string | null,
  path: string,
}

export async function createThread({ text, author, communityId, path }: Params) {
  try {
    connectToDB();

    const communityIdObject = await Community.findOne(
      { id: communityId },
      { _id: 1 }
    );

    const createdThread = await Thread.create({
      text,
      author,
      community: communityIdObject, // Assign communityId if provided, or leave it null for personal account
    });

    // em createThread, ao atualizar user:
    await User.findByIdAndUpdate(author, {
      $addToSet: { threads: createdThread._id }, // evita duplicatas
    });

    if (communityIdObject) {
      // Update Community model
      await Community.findByIdAndUpdate(communityIdObject, {
        $addToSet: { threads: createdThread._id },
      });
    }

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Falha ao criar postagem: ${error.message}`);
  }
}

async function fetchAllChildThreads(threadId: string): Promise<any[]> {
  const childThreads = await Thread.find({ parentId: threadId });

  const descendantThreads = [];
  for (const childThread of childThreads) {
    const descendants = await fetchAllChildThreads(childThread._id.toString());
    descendantThreads.push(childThread, ...descendants);
  }

  return descendantThreads;
}

export async function deleteThread(id: string, path: string): Promise<void> {
  try {
    await connectToDB();

    // Busca o thread que vai ser deletado
    const mainThread = await Thread.findById(id).populate("author community");

    if (!mainThread) {
      throw new Error("Post não encontrado");
    }

    // ✅ Caso seja um REPOST: remover o autor da lista de reposts do post original
    if (mainThread.repostOf) {
      const originalId = mainThread.repostOf;
      const repostAuthor = mainThread.author;

      // Remove o autor do array de reposts do post original
      await Thread.findByIdAndUpdate(originalId, {
        $pull: { reposts: repostAuthor },
      });

      // ✅ revalida a home e o perfil
      revalidatePath("/");
      if (mainThread.author && mainThread.author.id) {
        revalidatePath(`/profile/${String(mainThread.author.id)}`);
      }

      // ✅ dispara evento global (será capturado pelo listener client-side)
      if (typeof window !== "undefined") {
        const event = new CustomEvent("thread:refresh");
        window.dispatchEvent(event);
      }
    }

    // 🔁 Deleta recursivamente os comentários filhos
    const descendantThreads = await fetchAllChildThreads(id);
    const descendantThreadIds = [id, ...descendantThreads.map((t) => t._id.toString())];

    // Deleta todos (inclui o mainThread)
    await Thread.deleteMany({ _id: { $in: descendantThreadIds } });

    // Atualiza usuários
    await User.updateMany(
      { threads: { $in: descendantThreadIds } },
      { $pull: { threads: { $in: descendantThreadIds } } }
    );

    // Atualiza comunidades
    await Community.updateMany(
      { threads: { $in: descendantThreadIds } },
      { $pull: { threads: { $in: descendantThreadIds } } }
    );

    // Revalida path principal
    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Falha ao deletar postagem: ${error.message}`);
  }
}

export async function fetchThreadById(threadId: string): Promise<any | null> {
  await connectToDB();

  try {
    const baseThread = await Thread.findById(threadId)
      .populate("author", "_id id name username image")
      .populate("repostedBy", "_id id name username image")
      .populate("reposts", "_id id name username image")
      .populate("community", "_id id name image")
      .populate({
        path: "children",
        model: Thread,
        populate: [
          { path: "author", model: User, select: "_id id name image" },
          { path: "repostedBy", model: User, select: "_id id name username image" },
        ],
      })
      .lean();

    if (!baseThread) return null;

    // ✅ Caso seja um repost, buscar o post original
    if (baseThread.repostOf) {
      const original = await Thread.findById(baseThread.repostOf)
        .populate("author", "_id id name username image")
        .populate("community", "_id id name image")
        .populate("reposts", "_id id name username image")
        .populate({
          path: "children",
          model: Thread,
          populate: [
            { path: "author", model: User, select: "_id id name username image" },
            { path: "repostedBy", model: User, select: "_id id name username image" },
          ],
        })
        .lean();

      if (!original) return null;

      // ✅ Normaliza reposts (garante sempre array de strings)
      const normalizedReposts = (original.reposts || []).map((r: any) => {
        if (typeof r === "string") return r;
        return r?.id || r?._id?.toString?.() || "";
      });

      return JSON.parse(
        JSON.stringify({
          _id: baseThread._id,
          repostOf: { ...original, reposts: normalizedReposts },
          repostedBy: baseThread.repostedBy,
          createdAt: baseThread.createdAt,
          isRepostView: true,
        })
      );
    }

    // ✅ Normaliza reposts no post original (sem repostOf)
    const normalizedBaseReposts = (baseThread.reposts || []).map((r: any) => {
      if (typeof r === "string") return r;
      return r?.id || r?._id?.toString?.() || "";
    });

    return JSON.parse(
      JSON.stringify({
        ...baseThread,
        reposts: normalizedBaseReposts,
      })
    );
  } catch (err) {
    console.error("Erro ao buscar postagem:", err);
    throw new Error("Não foi possível buscar o post");
  }
}

export async function addCommentToThread(
  threadId: string,
  commentText: string,
  userId: string,
  path: string
) {
  await connectToDB();

  try {
    // 🧩 Normaliza threadId
    if (!threadId || typeof threadId !== "string") {
      console.error("❌ addCommentToThread: threadId inválido:", threadId);
      throw new Error("ID da thread inválido");
    }

    const cleanThreadId = threadId.includes("-repost-")
      ? threadId.split("-repost-")[0]
      : threadId;

    // 🧩 Busca o usuário corretamente
    let user;
    if (userId.startsWith("user_")) {
      user = await User.findOne({ id: userId });
    } else if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    }

    if (!user) {
      console.error("❌ Usuário não encontrado para comentar:", userId);
      throw new Error("Usuário não encontrado");
    }

    // 🔹 Busca o post original
    const originalThread = await Thread.findById(cleanThreadId);
    if (!originalThread) {
      console.error("❌ Post não encontrado:", cleanThreadId);
      throw new Error("Post não encontrado");
    }

    // 🔹 Cria o comentário com ObjectId do autor
    const commentThread = new Thread({
      text: commentText,
      author: user._id,
      parentId: cleanThreadId,
    });

    await commentThread.save();

    // 🔹 Vincula o comentário ao post principal
    originalThread.children.push(commentThread._id);
    await originalThread.save();

    // 🔁 Revalida as páginas relacionadas
    revalidatePath(`/thread/${cleanThreadId}`, "page");
    revalidatePath(`/profile/${user.id}`);

    console.log(`💬 Comentário adicionado por ${user.name} → thread ${cleanThreadId}`);

    // 🟢 Cria Activity (notificação)
    const postAuthor = await User.findById(originalThread.author);
    if (postAuthor && String(postAuthor._id) !== String(user._id)) {
      await Activity.create({
        user: user._id,              // quem comentou
        targetUser: postAuthor._id,  // dono do post
        thread: originalThread._id,  // post comentado
        type: "reply",               // tipo de atividade
        isRead: false,               // não lida
      });
    }

    // 🔔 Atualiza contador global de notificações no client
    if (typeof window !== "undefined") {
      const unread = parseInt(localStorage.getItem("unreadCount") || "0", 10);
      localStorage.setItem("unreadCount", (unread + 1).toString());
      window.dispatchEvent(new Event("notifications:update"));
    }

  } catch (err) {
    console.error("Erro ao adicionar comentário:", err);
    throw new Error("Não foi possível adicionar o comentário");
  }
}

export async function toggleLike(threadId: string, userId: string, path: string) {
  try {
    await connectToDB();

    const thread = await Thread.findById(threadId);
    if (!thread) throw new Error("Post não encontrado");

    if (!Array.isArray(thread.likes)) thread.likes = [];

    thread.likes = thread.likes.filter((id: string) => id && id.toString().trim() !== "");

    const sanitizedUserId = String(userId ?? "").trim().replace(/^"+|"+$/g, "");
    if (!sanitizedUserId) throw new Error("ID do usuário inválido ao curtir");

    const hasLiked = thread.likes.map(String).includes(sanitizedUserId);

    if (hasLiked) {
      // ➖ Remove curtida
      thread.likes = thread.likes.filter((id: string) => String(id) !== sanitizedUserId);
    } else {
      // ➕ Adiciona curtida
      thread.likes.push(sanitizedUserId);

      // 🔹 Cria Activity (notificação de curtida)
      const liker = await User.findOne({ id: sanitizedUserId });
      const postAuthor = await User.findById(thread.author);

      if (liker && postAuthor && String(liker._id) !== String(postAuthor._id)) {
        await Activity.create({
          user: liker._id,
          targetUser: postAuthor._id,
          thread: thread._id,
          type: "like",
          isRead: false, // nova notificação não lida
        });
      }
    }

    await thread.save();
    revalidatePath(path);

    return { liked: !hasLiked, likesCount: thread.likes.length };
  } catch (err: any) {
    console.error("Erro no toggleLike:", err);
    throw new Error("Falha ao alternar like");
  }
}

export async function fetchLikedPosts(userId: string) {
  try {
    await connectToDB();

    // 1️⃣ Busca o usuário correspondente (tanto por id do Clerk quanto _id do Mongo)
    const user = await User.findOne({
      $or: [{ id: userId }, { _id: userId }],
    });

    if (!user) {
      console.warn("⚠️ Usuário não encontrado para likes:", userId);
      return [];
    }

    // 2️⃣ Cria filtro compatível com ambos os formatos
    const searchIds = [user._id.toString(), user.id];

    // 3️⃣ Busca as threads curtidas (posts OU comentários)
    const likedThreads = await Thread.find({
      likes: { $in: searchIds },
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "author",
        model: User,
        select: "_id id name image",
      })
      .populate({
        path: "community",
        model: Community,
        select: "_id id name image",
      })
      // ✅ Popula o post original se o like for em um comentário
      .populate({
        path: "parentId",
        model: Thread,
        populate: [
          {
            path: "author",
            model: User,
            select: "_id id name image",
          },
          {
            path: "community",
            model: Community,
            select: "_id id name image",
          },
        ],
      })
      // ✅ Popula também os filhos do post, para contagem de comentários
      .populate({
        path: "children",
        model: Thread,
        select: "_id author text createdAt likes",
        populate: {
          path: "author",
          model: User,
          select: "_id id name image",
        },
      })
      .lean();

    // 4️⃣ Garante que o resultado seja puro e seguro para SSR
    return JSON.parse(JSON.stringify(likedThreads));
  } catch (error) {
    console.error("Erro ao buscar posts curtidos:", error);
    throw new Error("Falha ao buscar posts curtidos");
  }
}

export async function fetchUserReplies(userId: string) {
  try {
    await connectToDB();

    // Busca somente posts que são respostas (têm parentId válido)
    const replies = await Thread.find({
      author: userId,
      parentId: { $nin: [null, undefined, "null", ""] }, // garante que só respostas reais venham
    })
      .populate({
        path: "author",
        model: User,
        select: "_id id name image",
      })
      .populate({
        path: "parentId",
        model: Thread,
        match: { parentId: { $in: [null, undefined, "null", ""] } }, // só parent real (post raiz)
        populate: [
          {
            path: "author",
            model: User,
            select: "_id id name image",
          },
          {
            path: "community",
            model: Community,
            select: "_id id name image",
          },
          {
            path: "children",
            model: Thread,
            select: "_id",
          },
          // populate reposts and repostOf on parent
          {
            path: "reposts",
            model: User,
            select: "_id id name username image",
          },
          {
            path: "repostOf",
            model: Thread,
            populate: [
              { path: "author", model: User, select: "_id id name username image" },
              { path: "community", model: Community, select: "_id id name image" },
            ],
          },
          {
            path: "repostedBy",
            model: User,
            select: "_id id name username image",
          },
        ],
      })
      .sort({ createdAt: -1 }) // mais recente primeiro
      .lean();

    // Filtra apenas as respostas que têm um post pai válido (evita posts próprios)
    const filteredReplies = replies.filter((reply: any) => {
      const parent: any = reply.parentId;
      return (
        parent &&
        typeof parent === "object" &&
        parent.author &&
        parent.author.id !== userId
      );
    });

    // Normaliza reposts (tanto do reply quanto do parent) antes de retornar
    const normalized = filteredReplies.map((reply: any) => {
      const normReplyReposts = (reply.reposts || []).map((r: any) =>
        typeof r === "string" ? r : r?.id || r?._id?.toString?.() || ""
      );

      const normParent = reply.parentId
        ? {
          ...reply.parentId,
          reposts: (reply.parentId.reposts || []).map((r: any) =>
            typeof r === "string" ? r : r?.id || r?._id?.toString?.() || ""
          ),
          repostOf: reply.parentId.repostOf || null,
          repostedBy: reply.parentId.repostedBy || null,
        }
        : null;

      return {
        ...reply,
        reposts: normReplyReposts,
        parentId: normParent,
      };
    });

    return JSON.parse(JSON.stringify(normalized));
  } catch (error) {
    console.error("Erro ao buscar respostas do usuário:", error);
    throw new Error("Falha ao buscar respostas do usuário");
  }
}

export async function fetchUserPostCount(clerkUserId: string) {
  try {
    await connectToDB();

    // Busca o usuário no Mongo pelo id do Clerk
    const user = await User.findOne({ id: clerkUserId });
    if (!user) return 0;

    // Conta apenas posts originais (sem parentId)
    const postCount = await Thread.countDocuments({
      author: user._id, // agora sim: ObjectId válido
      parentId: { $in: [null, undefined, ""] },
    });

    return postCount;
  } catch (err) {
    console.error("Erro ao contar posts do usuário:", err);
    return 0;
  }
}

export async function repostThread(userId: string, threadId: string, path: string) {
  try {
    await connectToDB();

    const user = await User.findOne({ id: userId });
    if (!user) throw new Error("Usuário não encontrado no banco de dados.");

    const thread = await Thread.findById(threadId);
    if (!thread) throw new Error("Post original não encontrado.");

    if (!Array.isArray(thread.reposts)) thread.reposts = [];

    const normalizedUserId = String(user.id || userId).trim();
    const hasReposted = thread.reposts.map(String).includes(normalizedUserId);

    if (hasReposted) {
      console.log("🟡 Desfazendo repost...");
      thread.reposts = thread.reposts.filter((r: any) => String(r) !== normalizedUserId);
      await thread.save();
      revalidatePath(path);
      return { action: "unrepost", success: true };
    } else {
      console.log("🟢 Criando repost...");
      thread.reposts.push(normalizedUserId);
      await thread.save();

      // 🔹 Cria Activity no Mongo
      const postAuthor = await User.findById(thread.author);
      if (postAuthor && String(postAuthor._id) !== String(user._id)) {
        await Activity.create({
          user: user._id,          // quem repostou
          targetUser: postAuthor._id, // dono do post original
          thread: thread._id,
          type: "repost",
          isRead: false, // marca como não lida
        });
      }

      revalidatePath(path);
      return { action: "repost", success: true };
    }
  } catch (err) {
    console.error("Erro ao repostar:", err);
    throw new Error("Falha ao repostar publicação");
  }
}

export async function toggleRepost(userId: string, threadId: string, path: string) {
  try {
    await connectToDB();

    // 🔹 Busca o usuário pelo Clerk ID (mantém compatibilidade)
    const user = await User.findOne({ id: userId });
    if (!user) throw new Error("Usuário não encontrado");

    const thread = await Thread.findById(threadId).populate("author");
    if (!thread) throw new Error("Post não encontrado");

    // 🔹 Garante que o campo reposts é um array
    if (!Array.isArray(thread.reposts)) {
      thread.reposts = [];
    }

    // 🔹 Normaliza sempre para Clerk ID
    const normalizedUserId = String(user.id || userId).trim();

    // 🔹 Verifica se já repostou
    const alreadyReposted = thread.reposts
      .map(String)
      .includes(normalizedUserId);

    if (alreadyReposted) {
      // ➖ Remover repost
      thread.reposts = thread.reposts.filter(
        (r: any) => String(r) !== normalizedUserId
      );
      thread.repostedBy = undefined as any;
      await thread.save();
      console.log(`Repost removido por ${user.name}`);
    } else {
      // ➕ Adicionar repost
      thread.reposts.push(normalizedUserId);
      thread.repostedBy = user.id;
      await thread.save();
      console.log(`Post repostado por ${user.name}`);
    }

    revalidatePath(path);
  } catch (err) {
    console.error("Erro no toggleRepost:", err);
    throw new Error("Falha ao alternar repost");
  }
}