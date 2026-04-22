let cachedToken = null;
let cachedExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < cachedExpiry) return cachedToken;

  const accountsBase = process.env.ZOHO_ACCOUNTS_DOMAIN || "https://accounts.zoho.com";
  const params = new URLSearchParams({
    refresh_token: process.env.ZOHO_DESK_REFRESH_TOKEN,
    client_id: process.env.ZOHO_DESK_CLIENT_ID,
    client_secret: process.env.ZOHO_DESK_CLIENT_SECRET,
    grant_type: "refresh_token",
  });

  const res = await fetch(`${accountsBase}/oauth/v2/token`, {
    method: "POST",
    body: params,
  });
  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`Zoho auth failed: ${JSON.stringify(data)}`);
  }

  cachedToken = data.access_token;
  cachedExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

async function deskRequest(path, { retries = 3 } = {}) {
  const base = process.env.ZOHO_DESK_API_DOMAIN || "https://desk.zoho.com/api/v1";
  const token = await getAccessToken();

  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(`${base}${path}`, {
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        orgId: process.env.ZOHO_DESK_ORG_ID,
      },
    });

    if (res.status === 204) return { data: [] };

    const text = await res.text();
    if (!text) return { data: [] };

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`Zoho Desk returned non-JSON (${res.status}): ${text.slice(0, 200)}`);
    }

    const rateLimited =
      res.status === 429 ||
      json.errorCode === "RATE_LIMIT_EXCEEDED" ||
      (json.message || "").toLowerCase().includes("too many requests");

    if (rateLimited && attempt < retries) {
      const wait = Math.pow(2, attempt) * 10000;
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }

    return json;
  }
}

export async function fetchTicketsSince(sinceIso) {
  const tickets = [];
  let from = 1;
  const limit = 100;

  while (true) {
    const qs = new URLSearchParams({
      from: String(from),
      limit: String(limit),
      sortBy: "-modifiedTime",
      include: "assignee",
    });
    const result = await deskRequest(`/tickets?${qs}`);
    const batch = result?.data || [];
    if (batch.length === 0) break;

    let hitBoundary = false;
    for (const t of batch) {
      if (sinceIso && t.modifiedTime && t.modifiedTime < sinceIso) {
        hitBoundary = true;
        break;
      }
      tickets.push(t);
    }

    if (hitBoundary || batch.length < limit) break;
    from += limit;
    if (from > 10000) break;
  }

  return tickets;
}

export async function fetchTicketDetail(ticketId) {
  return deskRequest(`/tickets/${ticketId}?include=contacts,assignee`);
}
