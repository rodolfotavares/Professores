export function makeUpcomingClassDates(daysOfWeek: number[], weeksAhead = 4) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dates: string[] = [];
  const maxDays = weeksAhead * 7;

  for (let offset = 0; offset < maxDays; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    if (daysOfWeek.includes(date.getDay())) {
      dates.push(date.toISOString().slice(0, 10));
    }
  }

  return dates;
}
