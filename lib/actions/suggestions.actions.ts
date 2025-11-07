import { connectToDB } from "@/lib/mongoose";
import User from "@/lib/models/user.model";
import Community from "@/lib/models/community.model";

// Embaralha e pega X elementos
function getRandomItems<T>(arr: T[], count: number): T[] {
  return Array.isArray(arr) ? arr.sort(() => 0.5 - Math.random()).slice(0, count) : [];
}

export async function getRandomUsers(limit: number = 3) {
  try {
    await connectToDB();

    const users = await User.find()
      .select("id name image username")
      .lean();

    if (!users || users.length === 0) return [];

    return getRandomItems(users, limit);
  } catch (err) {
    console.error("❌ Erro ao buscar usuários aleatórios:", err);
    return [];
  }
}

export async function getRandomCommunities(limit: number = 3) {
  try {
    await connectToDB();

    const communities = await Community.find()
      .select("id name image membersCount")
      .lean();

    if (!communities || communities.length === 0) return [];

    return getRandomItems(communities, limit);
  } catch (err) {
    console.error("❌ Erro ao buscar comunidades aleatórias:", err);
    return [];
  }
}
