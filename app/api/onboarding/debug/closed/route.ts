export const dynamic = "force-dynamic";

const ACCOUNTS_URL = "https://accounts.zoho.com";
const DESK_URL = "https://desk.zoho.com";

export async function GET() {
  const {
    ZOHO_CLIENT_ID,
    ZOHO_CLIENT_SECRET,
    ZOHO_REFRESH_TOKEN,
    ZOHO_ORG_ID,
    ZOHO_VIEW_ID,
  } = process.env;

  if (
    !ZOHO_CLIENT_ID ||
    !ZOHO_CLIENT_SECRET ||
    !ZOHO_REFRESH_TOKEN ||
    !ZOHO_ORG_ID
  ) {
    return Response.json({ error: "missing env" }, { status: 500 });
  }

  const tokenRes = await fetch(`${ACCOUNTS_URL}/oauth/v2/token`, {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      refresh_token: ZOHO_REFRESH_TOKEN,
    }),
  });
  const tokenJson = (await tokenRes.json()) as {
    access_token?: string;
    scope?: string;
  };
  const accessToken = tokenJson.access_token;
  if (!accessToken) {
    return Response.json(
      { step: "token", tokenRes: tokenJson },
      { status: 500 },
    );
  }

  const hit = async (path: string, params: Record<string, string>) => {
    const url = new URL(`${DESK_URL}/api/v1${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url, {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        orgId: ZOHO_ORG_ID,
      },
    });
    const text = await res.text();
    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text);
    } catch {}
    return {
      url: url.toString(),
      status: res.status,
      bodyHead:
        typeof parsed === "string"
          ? parsed.slice(0, 300)
          : JSON.stringify(parsed).slice(0, 500),
    };
  };

  const worksInMain = await hit("/tickets", {
    viewId: ZOHO_VIEW_ID ?? "",
    limit: "1",
    include: "contacts,assignee",
  });

  const searchCall = await hit("/tickets/search", {
    status: "Closed - Won (LIVE) Marketplace",
    limit: "1",
  });

  const searchLost = await hit("/tickets/search", {
    status: "Closed - Lost",
    limit: "1",
  });

  const viewWithFields = await hit("/tickets", {
    viewId: ZOHO_VIEW_ID ?? "",
    limit: "1",
    include: "contacts,assignee",
    fields: "cf_became_a_customer_date",
  });

  return Response.json({
    scope: tokenJson.scope ?? null,
    accessTokenHead: accessToken.slice(0, 20),
    mainViewCall: worksInMain,
    searchCall_won_marketplace: searchCall,
    searchCall_closed_lost: searchLost,
    mainViewWithFieldsParam: viewWithFields,
  });
}
