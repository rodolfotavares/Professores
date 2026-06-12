export function makeTeacherCode() {
  return `PROF-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function parseDays(value: string) {
  return value
    .split(/[,\s;|/]+/)
    .map((part) => Number(part.trim()))
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
}
