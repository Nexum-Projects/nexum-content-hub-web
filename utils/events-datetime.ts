/** Fragmento `YYYY-MM-DDTHH:mm` en hora civil Guatemala; el servidor convierte a UTC con `guatemalaLocalInputToUtcIso`. */
export function splitDateTime(value?: string) {
  if (!value) {
    return { date: "", time: "" };
  }
  const [date = "", time = ""] = value.split("T");
  return { date, time: time.slice(0, 5) };
}

export function composeDateTime(date?: string, time?: string) {
  if (!date) {
    return "";
  }
  return `${date}T${time && time.trim() ? time : "00:00"}`;
}
