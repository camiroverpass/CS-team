import { google } from "googleapis";

export type AuditRow = {
  campground_id: string;
  name: string;
  city: string;
  state: string;
  email: string;
  google_listing: "Yes" | "No" | string;
  listing_website: "Yes" | "No" | string;
  book_now_button: "Yes" | "No" | string;
  roverpass_link: "Yes" | "No" | string;
  website_url: string;
  button_text: string;
  button_href: string;
  status: string;
  notes: string;
  checked_at: string;
};

function getAuth() {
  const jsonEnv = process.env.BOOKING_LINKS_GOOGLE_SERVICE_ACCOUNT_JSON;
  let credentials;
  if (jsonEnv) {
    credentials = JSON.parse(jsonEnv);
  } else if (process.env.BOOKING_LINKS_GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.BOOKING_LINKS_GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    credentials = {
      client_email: process.env.BOOKING_LINKS_GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.BOOKING_LINKS_GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  } else {
    throw new Error("Missing Google service account env vars for booking links");
  }

  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

export async function readAudit(): Promise<AuditRow[]> {
  const sheetId = process.env.BOOKING_LINKS_GOOGLE_SHEET_ID;
  const tab = process.env.BOOKING_LINKS_GOOGLE_SHEET_TAB || "Audit";
  if (!sheetId) throw new Error("BOOKING_LINKS_GOOGLE_SHEET_ID not set");

  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${tab}!A:Z`,
  });

  const rows = res.data.values || [];
  if (rows.length === 0) return [];
  const [header, ...body] = rows;
  return body.map((r) => {
    const obj: Record<string, string> = {};
    header.forEach((h, i) => { obj[h] = r[i] ?? ""; });
    return obj as unknown as AuditRow;
  });
}
