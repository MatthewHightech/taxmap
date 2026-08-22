import type { Metadata } from "next";
import { Nunito, Source_Sans_3 } from "next/font/google";
import { ConvexClientProvider } from "./ConvexClientProvider";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-game",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "TaxMap — Gamified Tax Literacy",
  description:
    "A cozy town simulation that teaches Canadian federal tax through real financial choices.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${sourceSans.variable} h-full antialiased`}
    >
      <body className="flex h-full min-h-full flex-col overflow-hidden font-[family-name:var(--font-ui)]">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
