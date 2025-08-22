"use client";

import React, { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BarLoader } from "react-spinners";
import { usernameSchema } from "@/app/lib/validators";
import { updateUsername, getMyUsername } from "@/actions/users";
import { getLatestUpdates } from "@/actions/dashboard";
import { format } from "date-fns";
import useFetch from "@/hooks/use-fetch";

function makeSlug(user) {
  const first = (user?.firstName || "").trim().toLowerCase();
  const last = (user?.lastName || "").trim().toLowerCase();
  const emailLocal =
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "";
  const base = (first || last)
    ? `${first}-${last}`.replace(/^-+|-+$/g, "")
    : emailLocal || "user";
  return `${base}-${user.id.slice(-4)}`;
}

export default function Dashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [origin, setOrigin] = React.useState("");
  const [msg, setMsg] = React.useState(null);
  const [saving, setSaving] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(usernameSchema),
    defaultValues: { username: "" },
  });

  React.useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  // Prefill from DB; if missing, fall back to Clerk/slug
  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1) DB value
      const dbRes = await getMyUsername();
      if (!cancelled && dbRes?.ok && dbRes.username) {
        setValue("username", dbRes.username);
        return;
      }

      // 2) Clerk value/slug
      if (!isLoaded || !user) return;
      const fallback =
        (user.username && user.username.trim()) ? user.username : makeSlug(user);
      if (!cancelled) setValue("username", fallback);
    })();

    return () => { cancelled = true; };
  }, [isLoaded, user, setValue]);

  const onSubmit = async ({ username }) => {
    setMsg(null);
    if (!isSignedIn) {
      setMsg("Please sign in to update your username.");
      return;
    }
    try {
      setSaving(true);
      const res = await updateUsername(username);
      setMsg(res?.ok ? "Username updated!" : (res?.error || "Failed to update."));
    } catch {
      setMsg("Something went wrong while updating username.");
    } finally {
      setSaving(false);
    }
  };

  const {
    loading: loadingUpdates,
    data: upcomingMeetings,
    fn: fnUpdates,
  } = useFetch(getLatestUpdates);

  useEffect(() => {
    (async () => await fnUpdates())();
  }, []);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>
            Welcome, {isLoaded ? (user?.firstName || "there") : "…"}!
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!loadingUpdates ? (
            <div className="space-y-6 font-light">
              <div>
                {upcomingMeetings && upcomingMeetings?.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {upcomingMeetings?.map((meeting) => (
                      <li key={meeting.id}>
                        {meeting.event.title} on{" "}
                        {format(
                          new Date(meeting.startTime),
                          "MMM d, yyyy h:mm a"
                        )}{" "}
                        with {meeting.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No upcoming meetings</p>
                )}
              </div>
            </div>
          ) : (
            <p>Loading updates...</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Unique Link</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center gap-2">
              <span>{origin}/</span>
              <Input {...register("username")} placeholder="username" />
            </div>

            {errors.username && (
              <p className="text-red-500 text-sm">{errors.username.message}</p>
            )}
            {msg && <p className="text-sm">{msg}</p>}
            {saving && <BarLoader className="mb-2" width="100%" />}

            <Button type="submit" disabled={!isSignedIn || saving}>
              {saving ? "Saving..." : "Update Username"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
