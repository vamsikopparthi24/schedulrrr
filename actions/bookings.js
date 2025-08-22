// actions/bookings.js
"use server";

import { db } from "@/lib/prisma";
import { createClerkClient } from "@clerk/backend";
import { google } from "googleapis";

// Create a server-side Clerk client using your secret key
const clerk = (() => {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing CLERK_SECRET_KEY in server environment.");
  }
  return createClerkClient({ secretKey });
})();

export async function createBooking(bookingData) {
  try {
    // 1) Fetch the event and its owner
    const event = await db.event.findUnique({
      where: { id: bookingData.eventId },
      include: { user: true },
    });
    if (!event) return { success: false, error: "Event not found" };

    // 2) Get the event owner's Google OAuth access token from Clerk
    // Clerk v6 uses provider "google" (not "oauth_google")
    const res = await clerk.users.getUserOauthAccessToken(
      event.user.clerkUserId,
      "google"
    );

    // v6 returns { data: [...] } ; older versions returned an array directly
    const tokens = Array.isArray(res) ? res : res?.data || [];
    const token = tokens[0]?.token;

    if (!token) {
      return {
        success: false,
        error: "Event owner hasn't connected Google Calendar.",
      };
    }

    // 3) Google Calendar client
    const oauth2 = new google.auth.OAuth2();
    oauth2.setCredentials({ access_token: token });
    const calendar = google.calendar({ version: "v3", auth: oauth2 });

    // 4) Create the Google Calendar event + Meet link
    const inserted = await calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1,
      requestBody: {
        summary: `${bookingData.name} - ${event.title}`,
        description: bookingData.additionalInfo,
        start: { dateTime: bookingData.startTime },
        end: { dateTime: bookingData.endTime },
        attendees: [{ email: bookingData.email }, { email: event.user.email }],
        conferenceData: {
          createRequest: { requestId: `${event.id}-${Date.now()}` },
        },
      },
    });

    const meetLink = inserted?.data?.hangoutLink ?? null;
    const googleEventId = inserted?.data?.id ?? null;

    // 5) Persist the booking in your DB
    const booking = await db.booking.create({
      data: {
        eventId: event.id,
        userId: event.userId,
        name: bookingData.name,
        email: bookingData.email,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        additionalInfo: bookingData.additionalInfo,
        meetLink,
        googleEventId,
      },
    });

    return { success: true, booking, meetLink };
  } catch (err) {
    console.error("Error creating booking:", err);
    return { success: false, error: err?.message || "Failed to create booking" };
  }
}
