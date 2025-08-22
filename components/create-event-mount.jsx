"use client";

import dynamic from "next/dynamic";

// Client-only wrapper so the drawer never runs during SSR/prerender
const CreateEventDrawer = dynamic(() => import("./create-event"), { ssr: false });

export default function CreateEventMount() {
  return <CreateEventDrawer />;
}
