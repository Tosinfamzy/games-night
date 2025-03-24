import React from "react";
import { Inter } from "next/font/google";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Button from "../ui/Button";

const inter = Inter({ subsets: ["latin"] });

interface MainLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Sessions", href: "/sessions" },
  { name: "Games", href: "/games" },
  { name: "Players", href: "/players" },
  { name: "Teams", href: "/teams" },
];

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();

  return (
    <div className={`min-h-screen bg-white ${inter.className}`}>
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold text-gray-900">
                  Games Night
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive
                          ? "border-blue-500 text-gray-900"
                          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center">
              <Button variant="outline" size="sm">
                New Session
              </Button>
            </div>
          </div>
        </nav>
      </header>

      <main className="w-full bg-white min-h-screen">{children}</main>

      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Games Night. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
