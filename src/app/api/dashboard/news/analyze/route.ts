import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, generate_signal } = body;

    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "MISSING_URL", message: "URL is required" },
        },
        { status: 400 }
      );
    }

    // Forward the request to your Railway endpoint with the access key
    const response = await fetch(process.env.N8N_BASE_URL || "", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Access-Key": process.env.ACCESS_AUTHORIZATION_KEY || "",
      },
      body: JSON.stringify({ url, generate_signal }),
    });

    if (!response.ok) {
      throw new Error(`Railway API returned ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        message: "News URL submitted successfully",
        url,
        response: data,
      },
    });
  } catch (error) {
    console.error("Error forwarding news URL:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "NEWS_URL_FORWARD_ERROR",
          message: "Failed to submit news URL",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}
