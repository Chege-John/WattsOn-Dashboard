// app/api/forms/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  // Example fetch from KoboToolbox
  const username = process.env.KOBOTOOLBOX_USERNAME;
  const token = process.env.KOBOTOOLBOX_TOKEN;
  const url = process.env.ASSETS_URL;

  if (!token || !url) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 500 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Token ${token}`,
        Accept: "application/json",
      },
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
