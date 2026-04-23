import "./globals.css";
import { Inter } from "next/font/google";
import Sidebar from "./components/Sidebar.js";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "RoverPass CS Team",
  description: "RoverPass Customer Success internal dashboards",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <div className="flex min-h-screen bg-slate-50">
          <Sidebar />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </body>
    </html>
  );
}
