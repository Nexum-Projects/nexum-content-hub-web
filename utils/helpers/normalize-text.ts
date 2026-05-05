type NormalizeTextParam =
  | string
  | {
      isFileName?: boolean;
      text: string;
    };

export function normalizeText(param: NormalizeTextParam): string {
  if (typeof param === "string") {
    return normalize(param);
  }

  const { isFileName = false, text } = param;

  if (!isFileName) {
    return normalize(text);
  }

  const extensionIndex = text.lastIndexOf(".");
  const fileName = extensionIndex > 0 ? text.slice(0, extensionIndex) : text;

  return normalize(fileName);
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();
}
