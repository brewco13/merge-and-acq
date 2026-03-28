export function normalizeText(value?: string | null): string | null {
  if (value == null) return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function uniqueSortedStrings(
  values: Array<string | null | undefined>
): string[] {
  return [...new Set(
    values
      .map((value) => normalizeText(value))
      .filter((value): value is string => Boolean(value))
  )].sort((a, b) => a.localeCompare(b));
}

