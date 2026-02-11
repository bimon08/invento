import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Invento – Inventory Management",
  description:
    "Mobile-first, multi-store inventory management PWA for repair shops.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Invento",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#020617",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const body = (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            style: {
              background: "#1e293b",
              border: "1px solid rgba(51, 65, 85, 0.5)",
              color: "#f1f5f9",
            },
          }}
        />
      </body>
    </html>
  );

  // During build, Clerk publishableKey may not be available
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return body;
  }

  return (
    <ClerkProvider
      signInForceRedirectUrl="/"
      signUpForceRedirectUrl="/"
      afterSignOutUrl="/sign-in"
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#6366f1",
          colorBackground: "#0f172a",
          borderRadius: "0.75rem",
        },
      }}
    >
      {body}
    </ClerkProvider>
  );
}

