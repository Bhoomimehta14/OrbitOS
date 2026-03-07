import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OrbitOS - One Intelligent Workspace",
  description: "One intelligent workspace for every knowledge team.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Fredoka:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <div className="noise-overlay" />
        {children}
      </body>
    </html>
  );
}
