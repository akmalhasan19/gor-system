import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Space_Grotesk, Syne } from 'next/font/google';

import { Toaster } from "sonner";
import { VenueProvider } from "@/lib/venue-context";
import { DataSyncProvider } from "@/components/data-sync-provider";
import { NetworkStatus } from "@/components/ui/network-status";
import { SessionSyncer } from "@/components/session-syncer";
import { MaintenanceScreen } from "@/components/maintenance-screen";

// Load fonts
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' });
const syne = Syne({ subsets: ['latin'], variable: '--font-syne' });

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
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Smash Partner",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;

}>) {
  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

  if (isMaintenanceMode) {
    return (
      <html lang="id">
        <body className={`min-h-screen bg-gray-900 flex justify-center font-sans ${spaceGrotesk.variable} ${syne.variable}`}>
          <MaintenanceScreen />
        </body>
      </html>
    );
  }

  return (
    <html lang="id">
      <body className={`min-h-screen bg-gray-900 flex justify-center font-sans ${spaceGrotesk.variable} ${syne.variable}`}>
        <div className="w-full min-h-screen bg-gray-100 shadow-2xl relative font-sans text-black">
          <VenueProvider>
            <DataSyncProvider>
              {children}
              <SessionSyncer />
              <NetworkStatus />
              <Toaster
                position="top-center"
                toastOptions={{
                  className: "bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none font-bold text-black font-sans",
                  classNames: {
                    success: "bg-white text-black",
                    error: "bg-red-50 text-red-600 border-red-600",
                    description: "text-gray-500 font-normal"
                  }
                }}
              />
            </DataSyncProvider>
          </VenueProvider>
        </div>
      </body>
    </html>
  );
}
