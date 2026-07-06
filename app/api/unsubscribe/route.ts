import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return new NextResponse("Missing token", { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();

    const [favResult, plannedResult] = await Promise.all([
      supabase.from("favorites").update({ email: null, last_alerted_at: null })
        .eq("unsubscribe_token", token).select("name"),
      supabase.from("planned_rounds").delete()
        .eq("unsubscribe_token", token).select("name"),
    ]);

    const affected =
      (favResult.data?.length ?? 0) + (plannedResult.data?.length ?? 0);

    if (favResult.error && plannedResult.error) {
      throw new Error(favResult.error.message);
    }
    if (affected === 0) {
      return new NextResponse("Invalid or expired unsubscribe link.", { status: 404 });
    }

    const name =
      favResult.data?.[0]?.name ?? plannedResult.data?.[0]?.name ?? "that alert";

    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:2rem;text-align:center;"><h2>Unsubscribed</h2><p>You will no longer receive alerts for <strong>${name}</strong>.</p></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new NextResponse(`Unsubscribe failed: ${message}`, { status: 500 });
  }
}
