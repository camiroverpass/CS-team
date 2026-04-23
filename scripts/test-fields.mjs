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
  return (await r.json()).access_token;
}

const token = await getToken();

// Try with fields parameter
const qs = new URLSearchParams({
  from: "1",
  limit: "2",
  sortBy: "-modifiedTime",
  fields: "id,ticketNumber,subject,layoutId,webUrl",
});
const r = await fetch(`${process.env.ZOHO_DESK_API_DOMAIN}/tickets?${qs}`, {
  headers: {
    Authorization: `Zoho-oauthtoken ${token}`,
    orgId: process.env.ZOHO_DESK_ORG_ID,
  },
});
const d = await r.json();
console.log("With fields param:");
console.log(JSON.stringify(d.data?.[0] || d, null, 2).slice(0, 1500));

// Try single ticket detail
if (d.data?.[0]?.id) {
  const r2 = await fetch(`${process.env.ZOHO_DESK_API_DOMAIN}/tickets/${d.data[0].id}`, {
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      orgId: process.env.ZOHO_DESK_ORG_ID,
    },
  });
  const d2 = await r2.json();
  console.log("\n\nSingle ticket detail — keys with 'layout' or 'web':");
  for (const k of Object.keys(d2 || {}).sort()) {
    if (/layout|web|url/i.test(k)) console.log(`  ${k} = ${JSON.stringify(d2[k])}`);
  }
  console.log("\nAll keys:", Object.keys(d2).sort());
}
