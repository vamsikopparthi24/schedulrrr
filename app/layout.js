import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import CreateEventDrawer from "@/components/create-event";



export const metadata = {
  title: "Schedulrr",
  description: "All your meetings at one place",
};

const inter = Inter({subsets: ["latin"]});

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
   <html lang="en">
      {/* Grid: main takes 1fr, footer sits at bottom */}
      <body className={inter.className}>
        {/* Header */}
        <Header />
        <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
          {children}
        </main>

        <footer className="bg-blue-100 py-12 text-center">
          <div className="conatiner mx-auto px-4 text-center text-gray-600"></div>
          <p>2025 Schedulrr — Scheduling made simple</p>
        </footer>
        <CreateEventDrawer />
      </body>
    </html>
    </ClerkProvider>
  );
}
