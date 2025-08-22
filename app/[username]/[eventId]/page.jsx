// app/[username]/[eventId]/page.jsx
export const runtime = "nodejs"; // make this segment (and its actions) run on Node


import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getEventAvailability, getEventDetails } from "@/actions/events";
//import { getEventAvailability } from "@/actions/availability";
import EventDetails from "./_components/event-details";
import BookingForm from "./_components/booking-form";

export async function generateMetadata({ params }) {
  const { username, eventId } = await params;

  const event = await getEventDetails(username, eventId);
  if (!event) {
    return {
      title: "Event Not Found",
      description: "We couldn't find the event you were looking for.",
    };
  }

  return {
    title: `Book ${event.title} with ${event.user.name} | Schedulrr`,
    description: `Schedule a ${event.duration}-minute ${event.title} with ${event.user.name}.`,
  };
}

export default async function EventBookingPage({ params }) {
  const { username, eventId } = await params;

  const [event, availability] = await Promise.all([
    getEventDetails(username, eventId),
    getEventAvailability(eventId),
  ]);

  if (!event) notFound();

  return (
    <div className="flex flex-col justify-center lg:flex-row px-4 py-8">
      <EventDetails event={event} />
      <Suspense fallback={<div>Loading booking form...</div>}>
        <BookingForm event={event} availability={availability} />
      </Suspense>
    </div>
  );
}
