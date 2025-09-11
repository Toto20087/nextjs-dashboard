import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { Providers } from "@/components/shared/providers";

export const metadata: Metadata = {
  title: "Trading System Dashboard",
  description: "Professional trading dashboard with real-time analytics and strategy management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-background text-foreground antialiased">
          <ErrorBoundary>
            <Providers>
              {children}
            </Providers>
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  );
}