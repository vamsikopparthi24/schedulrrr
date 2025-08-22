// actions/meetings.js
"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { createClerkClient } from "@clerk/backend";
import { google } from "googleapis";

export async function getUserMeetings(type = "upcoming") {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  const now = new Date();

  const meetings = await db.booking.findMany({
    where: {
      userId: user.id,
      startTime: type === "upcoming" ? { gte: now } : { lt: now },
    },
    include: {
      event: {
        include: {
          user: { select: { name: true, email: true, clerkUserId: true } },
        },
      },
    },
    orderBy:
      type === "upcoming" ? { startTime: "asc" } : { startTime: "desc" },
  });

  return meetings;
}

export async function cancelMeeting(meetingId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  const meeting = await db.booking.findUnique({
    where: { id: meetingId },
    include: {
      event: true,
      user: true, // Prisma User (owner) – must have .clerkUserId
    },
  });

  if (!meeting || meeting.userId !== user.id) {
    throw new Error("Meeting not found or unauthorized");
  }

  let googleWarning = null;

  // Try to cancel on Google Calendar if we have a Google event id
  if (meeting.googleEventId) {
    try {
      const secretKey = process.env.CLERK_SECRET_KEY;
      if (!secretKey) {
        googleWarning = "Missing CLERK_SECRET_KEY; skipped Google deletion.";
      } else {
        const clerk = createClerkClient({ secretKey });

        // Clerk v6 provider id is "google" (not "oauth_google")
        const oauthRes = await clerk.users.getUserOauthAccessToken(
          meeting.user.clerkUserId,
          "google"
        );

        const tokens = Array.isArray(oauthRes) ? oauthRes : oauthRes?.data || [];
        const token = tokens[0]?.token;

        if (!token) {
          googleWarning =
            "Event owner has not connected Google Calendar; skipped Google deletion.";
        } else {
          const oauth2 = new google.auth.OAuth2();
          oauth2.setCredentials({ access_token: token });
          const calendar = google.calendar({ version: "v3", auth: oauth2 });

          // Deleting with sendUpdates=all emails attendees about the cancellation
          await calendar.events.delete({
            calendarId: "primary",
            eventId: meeting.googleEventId,
            sendUpdates: "all",
          });
        }
      }
    } catch (err) {
      console.error("Failed to delete event from Google Calendar:", err);
      googleWarning = "Google Calendar deletion failed (see server logs).";
    }
  }

  // Always remove from our DB so UI stays consistent
  await db.booking.delete({ where: { id: meetingId } });

  return googleWarning
    ? { success: true, warning: googleWarning }
    : { success: true };
}
