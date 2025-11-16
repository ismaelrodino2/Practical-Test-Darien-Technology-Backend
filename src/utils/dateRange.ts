export function getWeekRange(date: Date): { start: Date; end: Date } {
  const utcDate = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );

  const day = utcDate.getUTCDay() || 7; // Sunday -> 7
  const diffToMonday = day - 1;

  const start = new Date(utcDate);
  start.setUTCDate(start.getUTCDate() - diffToMonday);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);

  return { start, end };
}

