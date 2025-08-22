// components/header.jsx
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import { PenBox } from "lucide-react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import UserMenu from "./user-menu";
import { checkUser } from "@/lib/checkUser";
import CreateEventMount from "./create-event-mount"; // client-only wrapper

export default async function Header() {
  // Ensures DB user row exists; safe on the server
  await checkUser();

  return (
    <nav className="mx-auto py-2 px-4 flex justify-between items-center shadow-md border-b-2">
      <Link href="/" className="flex items-center">
        <Image
          src="/logo.png"
          width={150}
          height={60}
          alt="Schedulrr Logo"
          className="h-16 w-auto"
          priority
        />
      </Link>

      <div className="flex items-center gap-4">
        <Link href="/events?create=true">
          <Button variant="default" className="flex items-center gap-2">
            <PenBox size={18} />
            Create Event
          </Button>
        </Link>

        <SignedOut>
          <SignInButton forceRedirectUrl="/dashboard">
            <Button variant="outline">Login</Button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          <UserMenu />
        </SignedIn>
      </div>

      {/* Prevents Next.js build error for useSearchParams by rendering on client only */}
      <Suspense fallback={null}>
        <CreateEventMount />
      </Suspense>
    </nav>
  );
}
