import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { StarknetProvider } from "@/components/StarknetProvider";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BICVAR | Private BTC Exchange on Starknet",
  description:
    "Commit-reveal dark pool for private BTC/USDC trading on Starknet. Orders are Poseidon-hashed on-chain — invisible until revealed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrains.variable} antialiased`}
      >
        <StarknetProvider>{children}</StarknetProvider>
      </body>
    </html>
  );
}
