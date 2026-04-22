import "./globals.css";
import Sidebar from "./components/Sidebar.js";

export const metadata = {
  title: "RoverPass CS Team",
  description: "RoverPass Customer Success internal dashboards",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen bg-slate-50">
          <Sidebar />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </body>
    </html>
  );
}
