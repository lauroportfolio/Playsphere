"use server";

import { revalidatePath } from "next/cache";
import { connectToDB } from "../mongoose";

import User from "../models/user.model";
import Thread from "../models/thread.model";
import Community from "../models/community.model";

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
      path: "community",
      model: Community,
      select: "_id id name image",
    })
    // 🔁 quem repostou (para mostrar "repostado por @")
    .populate({
      path: "repostedBy",
      model: User,
      select: "_id id name username image",
    })
    // 🔁 lista de usuários que repostaram o post original
    .populate({
      path: "reposts",
      model: User,
      select: "_id id name username image",
    })
    // 🔁 post original (se for um repost)
    .populate({
      path: "repostOf",
      populate: [
        { path: "author", model: User, select: "_id id name username image" },
        { path: "community", model: Community, select: "_id id name image" },
      ],
    })
    .select("_id text author community children parentId createdAt likes reposts repostedBy repostOf");

  const totalPostsCount = await Thread.countDocuments({ parentId: { $in: [null, undefined] } });
  const posts = await postsQuery.exec();
  const plainPosts = posts.map((p) => JSON.parse(JSON.stringify(p)));

  const isNext = totalPostsCount > skipAmount + posts.length;

  return { posts: plainPosts, isNext };
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
    const thread = await Thread.findById(threadId)
      .select("text author likes children createdAt parentId community reposts repostOf repostedBy")
      .populate({
        path: "author",
        model: User,
        select: "_id id name username image",
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
        model: Thread,
        populate: [
          { path: "author", model: User, select: "_id id name username image" },
          { path: "community", model: Community, select: "_id id name image" },
        ],
      })
      .populate({
        path: "community",
        model: Community,
        select: "_id id name image",
      })
      .populate({
        path: "children",
        model: Thread,
        select: "text author likes children createdAt parentId reposts repostOf repostedBy",
        populate: [
          { path: "author", model: User, select: "_id id name image" },
          { path: "repostedBy", model: User, select: "_id id name username image" },
          { path: "reposts", model: User, select: "_id id name username image" },
        ],
      })
      .lean()
      .exec();

    if (!thread) return null;
    return JSON.parse(JSON.stringify(thread));
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
  connectToDB();

  try {
    // 🔹 Busca o post original
    const originalThread = await Thread.findById(threadId);

    if (!originalThread) {
      throw new Error("Post não encontrado");
    }

    // 🔹 Cria o comentário
    const commentThread = new Thread({
      text: commentText,
      author: userId,
      parentId: threadId,
    });

    // 🔹 Salva o comentário
    const savedCommentThread = await commentThread.save();

    // 🔹 Vincula ao post principal
    originalThread.children.push(savedCommentThread._id);
    await originalThread.save();

    await originalThread.save();

    // ✅ Corrige o problema dos likes sumirem
    revalidatePath(`/thread/${threadId}`, "page"); // força atualização da thread atual
    revalidatePath(`/profile/${originalThread.author}`); // revalida perfil

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

    // Garante que o campo likes sempre exista
    if (!Array.isArray(thread.likes)) {
      thread.likes = [];
    }

    // Remove likes vazios residuais (limpa DB temporariamente em memória)
    thread.likes = thread.likes.filter((id: string) => id && id.toString().trim() !== "");

    // sanitize incoming userId: remove aspas extras e normalize to string
    let sanitizedUserId = String(userId ?? "").trim();
    // se veio com aspas por conta de JSON.stringify -> remove
    sanitizedUserId = sanitizedUserId.replace(/^"+|"+$/g, "");

    if (!sanitizedUserId) {
      console.error("toggleLike: userId inválido recebido:", { original: userId, sanitized: sanitizedUserId });
      throw new Error("ID do usuário inválido ao curtir");
    }

    const hasLiked = thread.likes.map(String).includes(sanitizedUserId);

    if (hasLiked) {
      thread.likes = thread.likes.filter((id: string) => String(id) !== sanitizedUserId);
    } else {
      thread.likes.push(sanitizedUserId);
    }

    await thread.save();
    revalidatePath(path);

    return { liked: !hasLiked, likesCount: thread.likes.length };
  } catch (err: any) {
    console.error("Erro no toggleLike:", err);
    throw new Error("Falha ao alternar like");
  }
}

// 🔹 Buscar posts e comentários curtidos por um usuário específico (compatível com Clerk ID e ObjectId)
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

    return JSON.parse(JSON.stringify(filteredReplies));
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

    // 🔹 Busca o usuário MongoDB a partir do Clerk ID
    const user = await User.findOne({ id: userId });
    if (!user) throw new Error("Usuário não encontrado no banco de dados.");

    const thread = await Thread.findById(threadId)
      .populate("author")
      .populate("community");

    if (!thread) throw new Error("Post original não encontrado.");

    const userObjectId = user._id.toString();

    // 🔹 Verifica se o usuário já repostou esse post
    const existingRepost = await Thread.findOne({
      author: user._id,
      repostOf: thread._id,
    });

    if (existingRepost) {
      console.log("🟡 Desfazendo repost...");

      // 🔹 Remove repost
      await Thread.findByIdAndDelete(existingRepost._id);

      // 🔹 Remove usuário do array de reposts do post original
      thread.reposts = thread.reposts.filter(
        (r: any) => r.toString() !== userObjectId
      );
      await thread.save();

      console.log(`✅ Repost removido: ${user.id} → ${thread._id}`);

      revalidatePath(path); // 🔁 atualiza a página automaticamente
      return { action: "unrepost", success: true };
    }

    // 🔹 Evita duplicatas antes de criar novo repost
    const alreadyInArray = thread.reposts.some(
      (r: any) => r.toString() === userObjectId
    );

    if (!alreadyInArray) {
      thread.reposts.push(user._id);
      await thread.save();
    }

    // 🔹 Cria novo repost
    const repostThread = await Thread.create({
      text: thread.text,
      author: user._id,
      community: thread.community || null,
      repostOf: thread._id,
      repostedBy: user._id,
    });

    // 🔹 Vincula repost ao usuário
    await User.findByIdAndUpdate(user._id, {
      $push: { threads: repostThread._id },
    });

    console.log(`✅ Repost criado: ${user.id} → ${thread._id}`);

    revalidatePath(path); // 🔁 atualiza automaticamente após repostar
    return { action: "repost", success: true };
  } catch (err) {
    console.error("Erro ao repostar:", err);
    throw new Error("Falha ao repostar publicação");
  }
}

export async function toggleRepost(userId: string, threadId: string, path: string) {
  try {
    await connectToDB();

    // ✅ Detecta se é ID do Clerk (user_...) ou ObjectId
    const query = userId.startsWith("user_")
      ? { id: userId }
      : { _id: userId };

    const user = await User.findOne(query);
    if (!user) throw new Error("Usuário não encontrado");

    const thread = await Thread.findById(threadId).populate("author");
    if (!thread) throw new Error("Post não encontrado");

    // ✅ Verifica se já repostou
    const alreadyReposted = thread.reposts?.some(
      (id) => id.toString() === user._id.toString()
    );

    if (alreadyReposted) {
      // ➖ Remover repost
      thread.reposts = thread.reposts.filter(
        (id) => id.toString() !== user._id.toString()
      );
      thread.repostedBy = undefined as any;
      await thread.save();
      console.log(`Repost removido por ${user.name}`);
    } else {
      // ➕ Adicionar repost
      thread.reposts.push(user._id);
      thread.repostedBy = user._id;
      await thread.save();
      console.log(`Post repostado por ${user.name}`);
    }

    revalidatePath(path);
  } catch (err) {
    console.error("Erro no toggleRepost:", err);
    throw new Error("Falha ao alternar repost");
  }
}