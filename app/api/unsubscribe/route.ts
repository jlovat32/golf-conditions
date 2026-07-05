import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return new NextResponse("Missing token", { status: 400 });
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("favorites")
      .update({ email: null, last_alerted_at: null })
      .eq("unsubscribe_token", token)
      .select("name");

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) {
      return new NextResponse("Invalid or expired unsubscribe link.", { status: 404 });
    }

    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:2rem;text-align:center;"><h2>Unsubscribed</h2><p>You will no longer receive condition alerts for <strong>${data[0].name}</strong>.</p></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new NextResponse(`Unsubscribe failed: ${message}`, { status: 500 });
  }
}
