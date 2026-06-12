/** API datetimes are stored in UTC. Naive strings without a timezone are UTC. */
export function parseApiDateTime(value: string): Date {
  if (/[Zz]|[+-]\d{2}:\d{2}$/.test(value)) {
    return new Date(value);
  }
  return new Date(`${value}Z`);
}

export function formatLocalDateTime(
  value: string | null,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!value) return "—";
  return parseApiDateTime(value).toLocaleString(undefined, options);
}

export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getLocalTimeZoneLabel(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
