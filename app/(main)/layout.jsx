"use client";

import { useUser } from "@clerk/nextjs";
import { BarChart, Calendar, Clock, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarLoader } from "react-spinners";


const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/meetings", label: "Meetings", icon: Users },
  { href: "/availability", label: "Availability", icon: Clock },
];


const AppLayout = ({children}) => {
    const {isLoaded} = useUser();
    const pathname = usePathname();
  return (
    <>
    {!isLoaded && <BarLoader width={"100%"} color="#36d7b7" />}
    <div className="flex flex-col h-screen bg-blue-50 md:flex-row">
        {/* Sidebar for medium screens and up */}
        <aside className="hidden md:block w-64 bg-white">
          <nav className="mt-8">
            <ul>
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-4 py-4 text-gray-700  hover:bg-gray-100 ${
                      pathname === item.href ? "bg-blue-100" : ""
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <header className="flex justify-between items-center mb-4">
            <h2 className="text-5xl md:text-6xl gradient-title pt-2 md:pt-0 text-center md:text-left w-full">
              {navItems.find((item) => item.href === pathname)?.label ||
                "Dashboard"}
            </h2>
          </header>
          {children}
        </main>

        {/* Bottom tabs for small screens */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-md">
          <ul className="flex justify-around">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex flex-col items-center py-2 px-4 ${
                    pathname === item.href ? "text-blue-600" : "text-gray-600"
                  }`}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-xs mt-1">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default AppLayout;
