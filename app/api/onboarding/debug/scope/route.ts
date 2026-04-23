export const dynamic = "force-dynamic";

export async function GET() {
  const {
    ZOHO_CLIENT_ID,
    ZOHO_CLIENT_SECRET,
    ZOHO_REFRESH_TOKEN,
    ZOHO_ORG_ID,
    ZOHO_VIEW_ID,
    ZOHO_CLOSED_VIEW_ID,
  } = process.env;

  const envPresence = {
    ZOHO_CLIENT_ID: fingerprint(ZOHO_CLIENT_ID),
    ZOHO_CLIENT_SECRET: fingerprint(ZOHO_CLIENT_SECRET),
    ZOHO_REFRESH_TOKEN: fingerprint(ZOHO_REFRESH_TOKEN),
    ZOHO_ORG_ID: fingerprint(ZOHO_ORG_ID),
    ZOHO_VIEW_ID: fingerprint(ZOHO_VIEW_ID),
    ZOHO_CLOSED_VIEW_ID: fingerprint(ZOHO_CLOSED_VIEW_ID),
  };

  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
    return Response.json(
      { error: "Missing ZOHO_CLIENT_ID / ZOHO_CLIENT_SECRET / ZOHO_REFRESH_TOKEN", envPresence },
      { status: 500 },
    );
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: ZOHO_CLIENT_ID,
    client_secret: ZOHO_CLIENT_SECRET,
    refresh_token: ZOHO_REFRESH_TOKEN,
  });

  const res = await fetch("https://accounts.zoho.com/oauth/v2/token", {
    method: "POST",
    body,
  });
  const text = await res.text();
  let parsed: Record<string, unknown> = {};
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { raw: text };
  }

  const scope = typeof parsed.scope === "string" ? parsed.scope : null;
  const error = typeof parsed.error === "string" ? parsed.error : null;
  const expiresIn =
    typeof parsed.expires_in === "number" ? parsed.expires_in : null;

  return Response.json({
    status: res.status,
    scope,
    scopeList: scope ? scope.split(/\s+/).filter(Boolean) : null,
    error,
    expiresIn,
    envPresence,
  });
}

function fingerprint(v: string | undefined): {
  present: boolean;
  length: number;
  head: string;
  tail: string;
  hasWhitespace: boolean;
} {
  if (!v) return { present: false, length: 0, head: "", tail: "", hasWhitespace: false };
  return {
    present: true,
    length: v.length,
    head: v.slice(0, 6),
    tail: v.slice(-4),
    hasWhitespace: /\s/.test(v),
  };
}
