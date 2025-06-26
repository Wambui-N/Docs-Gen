import type { Metadata } from "next";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Docs Gen - AI-Powered Document Generation",
  description: "Generate professional documents with AI assistance",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <SignedOut>
            {children}
          </SignedOut>
          <SignedIn>
            <div className="min-h-screen">
              <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between h-16">
                    <div className="flex items-center">
                      <h1 className="text-xl font-bold text-gray-900">Docs Gen</h1>
                    </div>
                    <div className="flex items-center">
                      <UserButton afterSignOutUrl="/" />
                    </div>
                  </div>
                </div>
              </nav>
              {children}
            </div>
          </SignedIn>
        </body>
      </html>
    </ClerkProvider>
  );
}