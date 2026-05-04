import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import BottomNav from "@/components/BottomNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grove - Tech-Powered Savings Management",
  description: "Manage your chama savings with Grove",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75'>🌿</text></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <style>{`
          html {
            scroll-behavior: smooth;
          }

          * {
            -webkit-tap-highlight-color: transparent;
          }

          .page-transition {
            animation: fadeIn 0.4s ease;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </head>
      <body className="bg-grove-dark">
        {children}
        <BottomNav />
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              zIndex: 10000,
            },
          }}
        />
      </body>
    </html>
  );
}

