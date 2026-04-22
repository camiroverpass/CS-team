import { NextResponse } from "next/server";

export const config = {
  matcher: ["/((?!api/cron|_next/static|_next/image|favicon.ico).*)"],
};

export function middleware(req) {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) return NextResponse.next();

  const header = req.headers.get("authorization") || "";
  if (header.startsWith("Basic ")) {
    const decoded = atob(header.slice(6));
    const [, pass] = decoded.split(":");
    if (pass === password) return NextResponse.next();
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Dashboard"' },
  });
}
