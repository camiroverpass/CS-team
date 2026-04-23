import { readFileSync } from "node:fs";

const envText = readFileSync(".env.local", "utf8");
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

async function getToken() {
  const params = new URLSearchParams({
    refresh_token: process.env.ZOHO_DESK_REFRESH_TOKEN,
    client_id: process.env.ZOHO_DESK_CLIENT_ID,
    client_secret: process.env.ZOHO_DESK_CLIENT_SECRET,
    grant_type: "refresh_token",
  });
  const r = await fetch(`${process.env.ZOHO_ACCOUNTS_DOMAIN}/oauth/v2/token`, {
    method: "POST",
    body: params,
  });
  const d = await r.json();
  if (!d.access_token) throw new Error(JSON.stringify(d));
  return d.access_token;
}

const token = await getToken();
const r = await fetch(
  `${process.env.ZOHO_DESK_API_DOMAIN}/layouts?module=tickets`,
  {
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      orgId: process.env.ZOHO_DESK_ORG_ID,
    },
  }
);
const d = await r.json();
for (const l of d.data || []) {
  console.log(`${l.id}\t${l.layoutName}\t(status=${l.status}, default=${l.isDefaultLayout})`);
}
