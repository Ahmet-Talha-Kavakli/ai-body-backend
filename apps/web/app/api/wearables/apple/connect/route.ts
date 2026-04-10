import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAppleHealthClient } from "@/lib/wearables/apple-health";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const state = randomUUID();
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/wearables/apple/callback`;

    const client = createAppleHealthClient();
    const authUrl = client.getAuthorizationUrl(state, redirectUri);

    // Set state in a secure cookie
    const response = NextResponse.redirect(authUrl);
    response.cookies.set("apple_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
    });

    return response;
  } catch (error) {
    console.error("[Apple Connect]", error);
    return NextResponse.json(
      { error: "Failed to initiate Apple Health connection" },
      { status: 500 }
    );
  }
}
