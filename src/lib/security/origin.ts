import { getSiteUrl } from "@/lib/google/constants";

function getAllowedOrigins(): string[] {
  const siteUrl = getSiteUrl();
  const origins = new Set<string>([
    siteUrl,
    "http://localhost:3000",
    "https://top-git-main-era8.vercel.app/"
  ]);

  if (siteUrl.startsWith("https://")) {
    origins.add(siteUrl.replace("https://", "http://"));
  }

  return Array.from(origins);
}

function isAllowedUrl(value: string, allowedOrigins: string[]): boolean {
  return allowedOrigins.some(
    (origin) => value === origin || value.startsWith(`${origin}/`),
  );
}

export class OriginValidationError extends Error {
  constructor() {
    super("Request origin is not allowed.");
    this.name = "OriginValidationError";
  }
}

export function validateRequestOrigin(request: Request): void {
  const allowedOrigins = getAllowedOrigins();
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (origin && isAllowedUrl(origin, allowedOrigins)) {
    return;
  }

  if (referer && isAllowedUrl(referer, allowedOrigins)) {
    return;
  }

  if (!origin && !referer && process.env.NODE_ENV === "development") {
    return;
  }

  throw new OriginValidationError();
}
