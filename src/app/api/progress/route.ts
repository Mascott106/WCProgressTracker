import { NextResponse } from "next/server";
import { getProgressFromApi } from "@/lib/football-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "true";
  const useMock = searchParams.get("mock") === "true";

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  const useStaticFallback =
    useMock || process.env.NEXT_PUBLIC_USE_MOCK === "true";

  if (!apiKey && !useStaticFallback) {
    const result = await getProgressFromApi("", { useStaticFallback: true });
    return NextResponse.json({
      ...result,
      meta: {
        ...result.meta,
        apiError:
          "FOOTBALL_DATA_API_KEY is not set. Showing schedule-only data — add your token to .env or use ?mock=true.",
      },
    });
  }

  try {
    const result = await getProgressFromApi(apiKey ?? "", {
      forceRefresh,
      useStaticFallback,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch progress";
    const result = await getProgressFromApi("", { useStaticFallback: true });
    return NextResponse.json({
      ...result,
      meta: {
        ...result.meta,
        apiError: message,
      },
    });
  }
}
