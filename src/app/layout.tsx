import type { Metadata, Viewport } from "next";
import "./globals.css";

import { Toaster } from "sonner";
import { VenueProvider } from "@/lib/venue-context";
import { DataSyncProvider } from "@/components/data-sync-provider";

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
          <DataSyncProvider>
            <VenueProvider>
              {children}
              <Toaster
                position="top-center"
                toastOptions={{
                  className: "bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none font-bold text-black",
                  classNames: {
                    success: "bg-white text-black",
                    error: "bg-red-50 text-red-600 border-red-600",
                    description: "text-gray-500 font-normal"
                  }
                }}
              />
            </VenueProvider>
          </DataSyncProvider>
        </div>
      </body>
    </html>
  );
}
