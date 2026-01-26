import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#D9F99D",
};

export const metadata: Metadata = {
  title: "GOR Management System",
  description: "Operating System for Sports Hall Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`min-h-screen bg-gray-900 flex justify-center font-sans`}>
        <div className="w-full max-w-[480px] min-h-screen bg-gray-100 shadow-2xl relative font-sans text-black">
          {children}
        </div>
      </body>
    </html>
  );
}
