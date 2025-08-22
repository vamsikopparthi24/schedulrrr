"use server";

import { auth, currentUser } from "@clerk/nextjs/server"; // ⬅️ use currentUser instead of clerkClient
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const toSlug = (s) =>
  (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "");

export async function getMyUsername() {
  const { userId } = await auth();
  if (!userId) return { ok: false, username: null };

  const me = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: { username: true },
  });

  return { ok: true, username: me?.username ?? null };
}

export async function updateUsername(rawUsername) {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "UNAUTHENTICATED" };

  const username = toSlug(rawUsername);
  if (!username) return { ok: false, error: "Invalid username" };

  // unique across other users
  const taken = await db.user.findFirst({
    where: { username, NOT: { clerkUserId: userId } },
    select: { id: true },
  });
  if (taken) return { ok: false, error: "Username is already taken" };

  // Do we already have a row for this user?
  const existing = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });

  if (existing) {
    // Simple update path (no Clerk call needed)
    await db.user.update({
      where: { clerkUserId: userId },
      data: { username },
    });
  } else {
    // Creation path: get profile info from Clerk via currentUser()
    const cu = await currentUser(); // ⬅️ safe in Edge/Node
    const primaryEmail =
      cu?.primaryEmailAddress?.emailAddress ||
      cu?.emailAddresses?.[0]?.emailAddress ||
      null;
    const name = [cu?.firstName, cu?.lastName].filter(Boolean).join(" ") || null;
    const imageUrl = cu?.imageUrl ?? null;

    await db.user.create({
      data: {
        clerkUserId: userId,
        username,
        email: primaryEmail, // your schema required this earlier
        name,
        imageUrl,
      },
    });
  }

  // (Optional) try to reflect the username in Clerk too.
  // If you want this and clerkClient is available in your setup, you can add it back.
  // Otherwise, skip to avoid runtime issues.

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function getUserByUsername(username) {
  const user = await db.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      email: true,
      imageUrl: true,
      events: {
        where: {
          isPrivate: false,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          title: true,
          description: true,
          duration: true,
          isPrivate: true,
          _count: {
            select: { bookings: true },
          },
        },
      },
    },
  });

  return user;
}