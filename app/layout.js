
import "./globals.css";
import { Outfit } from "next/font/google"
import Provider from "./provider"
import { ClerkProvider } from "@clerk/nextjs"
import { Toaster } from "@/components/ui/sonner"

export const metadata = {
  title: "AI PDF Note Taking",
  description: "Let's simplify your PDF note taking with AI",
  icons: {
    icon: '/CS_Star_4.svg',
  },
};

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={outfit.className}
          suppressHydrationWarning={true}
        >
          <Provider>{children}</Provider>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>

  );
}
