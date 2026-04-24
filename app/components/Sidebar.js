"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/customer-success", label: "Customer Success" },
  { href: "/onboarding",       label: "Onboarding" },
  { href: "/upsells",          label: "Upsells" },
  { href: "/pending",          label: "Booking links" },
  { href: "/ptos",             label: "PTOs" },
  { href: "/wellness-score",   label: "Wellness Score" },
];

function RoverPassLogo() {
  return (
    <div className="flex items-center gap-2 px-4 py-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-roverpass-500 text-white font-bold text-sm">
        RP
      </div>
      <span className="text-xl font-bold tracking-tight text-slate-900">RoverPass</span>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname() || "";

  return (
    <aside className="sticky top-0 h-screen w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col">
      <RoverPassLogo />

      <nav className="flex-1 px-3 mt-2">
        <ul className="space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition " +
                    (active
                      ? "bg-roverpass-50 text-roverpass-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")
                  }
                >
                  <span
                    className={
                      "h-2 w-2 rounded-full " +
                      (active ? "bg-roverpass-500" : "bg-slate-300")
                    }
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-3">
        <a
          href="https://www.roverpass.com"
          target="_blank"
          rel="noreferrer"
          className="block w-full rounded-lg bg-roverpass-500 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-roverpass-600"
        >
          Open RoverPass
        </a>
      </div>
    </aside>
  );
}
