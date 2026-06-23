import { NextResponse } from "next/server";
import { RateLimitExceededError } from "@/lib/security/rate-limit";
import { OriginValidationError } from "@/lib/security/origin";
import {
  ApplicationServiceError,
  submitApplication,
} from "@/server/application.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = {
      ...(body as Record<string, any>),
      created_at: new Date().toLocaleString("ru-RU", { timeZone: "Asia/Almaty" }),
    };

    const result = await submitApplication(request, body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    if (process.env.SHEET_MONKEY_URL) {
      try {
        const sheetMonkeyResponse = await fetch(process.env.SHEET_MONKEY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!sheetMonkeyResponse.ok) {
          console.error(
            "SheetMonkey request failed:",
            sheetMonkeyResponse.status,
            await sheetMonkeyResponse.text(),
          );
        }
      } catch (sheetMonkeyError) {
        console.error("SheetMonkey fetch error:", sheetMonkeyError);
      }
    } else {
      console.error("SHEET_MONKEY_URL is not set");
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof OriginValidationError) {
      return NextResponse.json(
        { success: false, message: "Запрос отклонён." },
        { status: 403 },
      );
    }

    if (error instanceof RateLimitExceededError) {
      return NextResponse.json(
        { success: false, message: "Слишком много запросов. Попробуйте позже." },
        { status: 429 },
      );
    }

    if (error instanceof ApplicationServiceError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status },
      );
    }

    console.error("Unexpected error in POST /api/applications:", error);
    return NextResponse.json(
      { success: false, message: "Произошла непредвиденная ошибка." },
      { status: 500 },
    );
  }
}