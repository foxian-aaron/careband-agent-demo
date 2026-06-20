export const formatClock = (timestamp: string) => {
  const match = timestamp.match(/T(\d{2}:\d{2})/);
  return match?.[1] ?? timestamp;
};

export const formatDateTime = (timestamp: string) => {
  const clock = formatClock(timestamp);
  const day = timestamp.slice(5, 10).replace("-", "/");
  return `${day} ${clock}`;
};

export const byTimestampAsc = <T extends { timestamp: string }>(a: T, b: T) =>
  a.timestamp.localeCompare(b.timestamp);
