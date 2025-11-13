"use server";

import mongoose, { FilterQuery, SortOrder } from "mongoose";

import Community from "../models/community.model";
import Thread from "../models/thread.model";
import User from "../models/user.model";

import { connectToDB } from "../mongoose";

export async function createCommunity(
  id: string,
  name: string,
  username: string,
  image: string,
  bio: string,
  createdById: string // Change the parameter name to reflect it's an id
) {
  try {
    connectToDB();

    // Find the user with the provided unique id
    const user = await User.findOne({ id: createdById });

    if (!user) {
      throw new Error("Usuário não encontrado"); // Handle the case if the user with the id is not found
    }

    const newCommunity = new Community({
      id,
      name,
      username,
      image,
      bio: bio?.trim() || "Comunidade sem descrição",
      createdBy: user._id, // Use the mongoose ID of the user
    });

    const createdCommunity = await newCommunity.save();

    // Update User model
    user.communities.push(createdCommunity._id);
    await user.save();

    return createdCommunity;
  } catch (error) {
    // Handle any errors
    console.error("Erro ao criar comunidade:", error);
    throw error;
  }
}

type MemberPlain = {
  id?: string;
  _id?: string;
  name: string;
  username: string;
  image: string;
};

export type CommunityDetailsPlain = {
  _id: string;
  id?: string;
  name?: string;
  username?: string;
  image: string;
  bio?: string;
  createdBy?: MemberPlain;
  members: MemberPlain[];
  // adicione outros campos que você queira retornar aqui
} | null;

export async function fetchCommunityDetails(id: string): Promise<CommunityDetailsPlain> {
  try {
    await connectToDB();

    const query: any = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ id }, { _id: id }] }
      : { id };

    const communityDoc = await Community.findOne(query)
      .populate([
        {
          path: "createdBy",
          model: User,
          select: "name username image id",
        },
        {
          path: "members",
          model: User,
          select: "name username image id",
        },
      ])
      .lean<{
        _id: mongoose.Types.ObjectId;
        id?: string;
        name?: string;
        username?: string;
        image?: string;
        bio?: string;
        createdBy?: any;
        members?: any[];
      }>();

    if (!communityDoc) {
      return null;
    }

    const normalizedImage =
      communityDoc.image && communityDoc.image.trim() !== ""
        ? communityDoc.image
        : "/assets/community.svg";

    const membersPlain: MemberPlain[] = Array.isArray(communityDoc.members)
      ? communityDoc.members.map((m: any) => ({
        id: m.id,
        _id: m._id?.toString(),
        name: m.name || "",
        username: m.username || "",
        image: m.image || "",
      }))
      : [];

    const createdByPlain: MemberPlain | undefined = communityDoc.createdBy
      ? {
        id: communityDoc.createdBy.id,
        _id: communityDoc.createdBy._id?.toString(),
        name: communityDoc.createdBy.name || "",
        username: communityDoc.createdBy.username || "",
        image: communityDoc.createdBy.image || "",
      }
      : undefined;

    return {
      _id: communityDoc._id.toString(),
      id: communityDoc.id,
      name: communityDoc.name,
      username: communityDoc.username,
      image: normalizedImage,
      bio: communityDoc.bio,
      createdBy: createdByPlain,
      members: membersPlain,
    };
  } catch (error) {
    console.error("Erro ao buscar detalhes da comunidade:", error);
    throw error;
  }
}

export async function fetchCommunityPosts(id: string) {
  try {
    connectToDB();

    const communityPosts = await Community.findById(id)
      .populate({
        path: "threads",
        model: Thread,
        populate: [
          // Autor do post principal
          {
            path: "author",
            model: User,
            select: "_id id name username image",
          },
          // Comunidade (pra exibir nome/imagem)
          {
            path: "community",
            model: Community,
            select: "_id id name image",
          },
          // Comentários (children)
          {
            path: "children",
            model: Thread,
            populate: {
              path: "author",
              model: User,
              select: "_id id name username image",
            },
          },
          // Reposts e quem repostou
          {
            path: "reposts",
            model: User,
            select: "_id id name username image",
          },
          {
            path: "repostedBy",
            model: User,
            select: "_id id name username image",
          },
        ],
      })
      .lean(); // garante objeto simples

    if (!communityPosts) return null;

    // 🔁 Normaliza todos os _id e campos que podem conter ObjectId
    const normalized = JSON.parse(JSON.stringify(communityPosts));

    return normalized;
  } catch (error) {
    console.error("Erro ao buscar posts da comunidade:", error);
    throw error;
  }
}

export async function fetchCommunities({
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  sortBy = "desc",
}: {
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortOrder;
}) {
  try {
    connectToDB();

    const skipAmount = (pageNumber - 1) * pageSize;
    const regex = new RegExp(searchString, "i");

    const query: FilterQuery<typeof Community> = {};

    if (searchString.trim() !== "") {
      query.$or = [
        { username: { $regex: regex } },
        { name: { $regex: regex } },
      ];
    }

    const sortOptions = { createdAt: sortBy };

    const communitiesQuery = Community.find(query)
      .sort({ createdAt: -1, _id: -1 }) // 👈 ORDEM GARANTIDA
      .skip(skipAmount)
      .limit(pageSize)
      .populate("members");

    const totalCommunitiesCount = await Community.countDocuments(query);

    const communities = await communitiesQuery.exec();

    // 🟢 NORMALIZAÇÃO — garante que todos os campos existam
    const normalized = communities.map((c) => {
      const obj = c.toObject();

      return {
        id: obj.id ?? obj._id.toString(),        // fallback seguro
        name: obj.name ?? "Comunidade sem nome", // evita crash no card
        username: obj.username ?? "unknown",
        image: obj.image?.trim() || "/assets/community.svg",
        bio: obj.bio ?? "",
        members: Array.isArray(obj.members) ? obj.members : [],
      };
    });

    const isNext = totalCommunitiesCount > skipAmount + communities.length;

    return { communities: normalized, isNext };
  } catch (error) {
    console.error("Erro ao buscar comunidades:", error);
    throw error;
  }
}

export async function addMemberToCommunity(
  communityId: string,
  memberId: string
) {
  try {
    connectToDB();

    // Find the community by its unique id
    const community = await Community.findOne({ id: communityId });

    if (!community) {
      throw new Error("Comunidade não encontrada");
    }

    // Find the user by their unique id
    const user = await User.findOne({ id: memberId });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Check if the user is already a member of the community
    if (community.members.includes(user._id)) {
      throw new Error("Usuário já é um membro da comunidade");
    }

    // Add the user's _id to the members array in the community
    community.members.push(user._id);
    await community.save();

    // Add the community's _id to the communities array in the user
    user.communities.push(community._id);
    await user.save();

    return community;
  } catch (error) {
    // Handle any errors
    console.error("Erro ao adicionar membro na comunidade:", error);
    throw error;
  }
}

export async function removeUserFromCommunity(
  userId: string,
  communityId: string
) {
  try {
    connectToDB();

    const userIdObject = await User.findOne({ id: userId }, { _id: 1 });
    const communityIdObject = await Community.findOne(
      { id: communityId },
      { _id: 1 }
    );

    if (!userIdObject) {
      throw new Error("Usuário não encontrado");
    }

    if (!communityIdObject) {
      throw new Error("Comunidade não encontrada");
    }

    // Remove the user's _id from the members array in the community
    await Community.updateOne(
      { _id: communityIdObject._id },
      { $pull: { members: userIdObject._id } }
    );

    // Remove the community's _id from the communities array in the user
    await User.updateOne(
      { _id: userIdObject._id },
      { $pull: { communities: communityIdObject._id } }
    );

    return { success: true };
  } catch (error) {
    // Handle any errors
    console.error("Erro ao remover usuário da comunidade:", error);
    throw error;
  }
}

export async function updateCommunityInfo(
  communityId: string,
  name: string,
  username: string,
  image: string,
  bio: string
) {
  try {
    connectToDB();

    const updatedCommunity = await Community.findOneAndUpdate(
      { id: communityId },
      { name, username, image, bio },
      { new: true }
    );

    if (!updatedCommunity) {
      throw new Error("Comunidade não encontrada");
    }

    return updatedCommunity;
  } catch (error) {
    console.error("Erro ao atualizar informações da comunidade:", error);
    throw error;
  }
}

export async function deleteCommunity(communityId: string) {
  try {
    connectToDB();

    // Find the community by its ID and delete it
    const deletedCommunity = await Community.findOneAndDelete({
      id: communityId,
    });

    if (!deletedCommunity) {
      throw new Error("Comunidade não encontrada");
    }

    // Delete all threads associated with the community
    await Thread.deleteMany({ community: communityId });

    // Find all users who are part of the community
    const communityUsers = await User.find({ communities: communityId });

    // Remove the community from the 'communities' array for each user
    const updateUserPromises = communityUsers.map((user) => {
      user.communities.pull(communityId);
      return user.save();
    });

    await Promise.all(updateUserPromises);

    return deletedCommunity;
  } catch (error) {
    console.error("Erro ao deletar comunidade: ", error);
    throw error;
  }
}