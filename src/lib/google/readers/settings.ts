import { SHEET_NAMES } from "@/lib/google/constants";
import { createCachedReader, readSheetRange } from "@/lib/google/sheets";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/types/settings";

async function fetchSettings(): Promise<SiteSettings> {
  const rows = await readSheetRange(`${SHEET_NAMES.SETTINGS}!A:C`);
  const settings: SiteSettings = { ...DEFAULT_SETTINGS };

  if (rows.length <= 1) {
    return settings;
  }

  for (const row of rows.slice(1)) {
    const [key, , value] = row;
    if (key?.trim() && value !== undefined) {
      settings[key.trim()] = value.trim();
    }
  }

  return settings;
}

export const getSettings = createCachedReader("settings", fetchSettings);
