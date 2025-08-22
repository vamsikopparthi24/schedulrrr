// app/layout.jsx  (Server Component)
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Header from "@/components/header";
import { Suspense } from "react";

export const metadata = {
  title: "Schedulrr",
  description: "All your meetings at one place",
};

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <Header />
          {/* Wrap children in Suspense so any client hooks (e.g. useSearchParams) don't break prerender (/_not-found) */}
          <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
            <Suspense fallback={null}>
              {children}
            </Suspense>
          </main>

          <footer className="bg-blue-100 py-12 text-center">
            <div className="conatiner mx-auto px-4 text-center text-gray-600"></div>
            <p>2025 Schedulrr — Scheduling made simple</p>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
