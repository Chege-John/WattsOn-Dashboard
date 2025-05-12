import { NextResponse } from "next/server";

interface KoboResponse {
  results?: Array<Record<string, any>>;
  count?: number;
  next?: string | null;
  previous?: string | null;
  error?: string;
  message?: string;
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);
    if (response.status === 429) {
      // Wait and retry
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      continue;
    }
    return response; // Success response
  }
  throw new Error("Max retries reached");
}

export async function GET(request: Request) {
  try {
    const { pathname } = new URL(request.url);
    const segments = pathname.split("/");
    const uid = segments[segments.length - 1];

    if (!uid) {
      return NextResponse.json({ error: "UID not provided" }, { status: 400 });
    }

    const versionId =
      uid === "akGkJBQrKG6gWJ6daFNRtR" ? "vRuWGRMUTEdb7dXGNTYPuf" : "";
    const apiUrl = `${
      process.env.KOBOTOOLBOX_URL
    }api/v2/assets/${uid}/data?limit=1500${
      versionId ? `&version=${versionId}` : ""
    }`;

    console.log(`Fetching data from URL: ${apiUrl}`);

    const formData = await fetchWithRetry(apiUrl, {
      headers: {
        Authorization: `Token ${process.env.KOBOTOOLBOX_TOKEN}`,
        Accept: "application/json",
      },
      cache: "no-store", // Make sure this is right based on your needs.
    });

    if (!formData.ok) {
      const errorData = await formData.text();
      console.error(
        `Error fetching form data: ${formData.status} - ${errorData}`
      );
      if (formData.status === 404) {
        return NextResponse.json(
          {
            results: [],
            count: 0,
            message:
              "No submissions found for this form. Check URL, permissions, or version.",
          },
          { status: 200 }
        );
      }
      if (formData.status === 403) {
        return NextResponse.json(
          { error: "Unauthorized access to this form's submissions" },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: `Failed to fetch form data: ${errorData}` },
        { status: formData.status }
      );
    }

    const data: KoboResponse = await formData.json();
    console.log(`Submission count: ${data.count}`);

    // Add caching headers here
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120", // Customize as needed
      },
    });
  } catch (error) {
    console.error("An error occurred while fetching the data:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching the data." },
      { status: 500 }
    );
  }
}
