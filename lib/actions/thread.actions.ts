"use server";

import { revalidatePath } from "next/cache";
import { connectToDB } from "../mongoose";

import User from "../models/user.model";
import Thread from "../models/thread.model";
import Community from "../models/community.model";

export async function fetchPosts(pageNumber = 1, pageSize = 20) {
  connectToDB();

  // Calculate the number of posts to skip based on the page number and page size.
  const skipAmount = (pageNumber - 1) * pageSize;

  // Create a query to fetch the posts that have no parent (top-level threads) (a thread that is not a comment/reply).
  const postsQuery = Thread.find({ parentId: { $in: [null, undefined] } })
    .sort({ createdAt: "desc" })
    .skip(skipAmount)
    .limit(pageSize)
    .populate({
      path: "author",
      model: User,
    })
    .populate({
      path: "community",
      model: Community,
    })
    .populate({
      path: "children",
      populate: {
        path: "author",
        model: User,
        select: "_id name parentId image",
      },
    })
    .select("_id text author community children parentId createdAt likes"); // ✅ inclui likes

  // Count the total number of top-level posts (threads) i.e., threads that are not comments.
  const totalPostsCount = await Thread.countDocuments({
    parentId: { $in: [null, undefined] },
  }); // Get the total count of posts

  const posts = await postsQuery.exec();

  const plainPosts = posts.map((post) => JSON.parse(JSON.stringify(post)));

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
    connectToDB();

    // Find the thread to be deleted (the main thread)
    const mainThread = await Thread.findById(id).populate("author community");

    if (!mainThread) {
      throw new Error("Post não encontrado");
    }

    // Fetch all child threads and their descendants recursively
    const descendantThreads = await fetchAllChildThreads(id);

    // Get all descendant thread IDs including the main thread ID and child thread IDs
    const descendantThreadIds = [
      id,
      ...descendantThreads.map((thread) => thread._id),
    ];

    // Extract the authorIds and communityIds to update User and Community models respectively
    const uniqueAuthorIds = new Set(
      [
        ...descendantThreads.map((thread) => thread.author?._id?.toString()), // Use optional chaining to handle possible undefined values
        mainThread.author?._id?.toString(),
      ].filter((id) => id !== undefined)
    );

    const uniqueCommunityIds = new Set(
      [
        ...descendantThreads.map((thread) => thread.community?._id?.toString()), // Use optional chaining to handle possible undefined values
        mainThread.community?._id?.toString(),
      ].filter((id) => id !== undefined)
    );

    // Recursively delete child threads and their descendants
    await Thread.deleteMany({ _id: { $in: descendantThreadIds } });

    // Update User model
    await User.updateMany(
      { _id: { $in: Array.from(uniqueAuthorIds) } },
      { $pull: { threads: { $in: descendantThreadIds } } }
    );

    // Update Community model
    await Community.updateMany(
      { _id: { $in: Array.from(uniqueCommunityIds) } },
      { $pull: { threads: { $in: descendantThreadIds } } }
    );

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Falha ao deletar postagem: ${error.message}`);
  }
}

export async function fetchThreadById(threadId: string) {
  connectToDB();

  try {
    const thread = await Thread.findById(threadId)
      .populate({
        path: "author",
        model: User,
        select: "_id id name image",
      }) // Populate the author field with _id and username
      .populate({
        path: "community",
        model: Community,
        select: "_id id name image",
      }) // Populate the community field with _id and name
      .populate({
        path: "children", // Populate the children field
        populate: [
          {
            path: "author", // Populate the author field within children
            model: User,
            select: "_id id name parentId image", // Select only _id and username fields of the author
          },
          {
            path: "children", // Populate the children field within children
            model: Thread, // The model of the nested children (assuming it's the same "Thread" model)
            populate: {
              path: "author", // Populate the author field within nested children
              model: User,
              select: "_id id name parentId image", // Select only _id and username fields of the author
            },
          },
        ],
      })
      .exec();

    return thread;
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
    // Find the original thread by its ID
    const originalThread = await Thread.findById(threadId);

    if (!originalThread) {
      throw new Error("Post não encontrado");
    }

    // Create the new comment thread
    const commentThread = new Thread({
      text: commentText,
      author: userId,
      parentId: threadId, // Set the parentId to the original thread's ID
    });

    // Save the comment thread to the database
    const savedCommentThread = await commentThread.save();

    // Add the comment thread's ID to the original thread's children array
    originalThread.children.push(savedCommentThread._id);

    // Save the updated original thread to the database
    await originalThread.save();

    revalidatePath(path);
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

    const hasLiked = thread.likes.map(String).includes(String(userId));


    if (hasLiked) {
      thread.likes = thread.likes.filter((id: string) => id !== userId);
    } else {
      thread.likes.push(userId);
    }

    await thread.save();
    revalidatePath(path);

    return { liked: !hasLiked, likesCount: thread.likes.length };
  } catch (err: any) {
    console.error("Erro no toggleLike:", err);
    throw new Error("Falha ao alternar like");
  }
}

// 🔹 Buscar posts curtidos por um usuário específico (compatível com Clerk ID e ObjectId)
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
    const searchIds = [user._id.toString(), user.id]; // 👈 busca posts curtidos com qualquer dos dois formatos

    // 3️⃣ Busca os posts curtidos (de forma decrescente)
    const likedPosts = await Thread.find({ likes: { $in: searchIds } })
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
      .populate({
        path: "children",
        model: Thread,
        populate: {
          path: "author",
          model: User,
          select: "_id id name image",
        },
      })
      .select("_id text author community children parentId createdAt likes");

    // 4️⃣ Retorna em formato puro
    return likedPosts.map((post) => JSON.parse(JSON.stringify(post)));
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