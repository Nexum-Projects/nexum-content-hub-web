/** Alineado con `com.contenthub_api.ContentHubApi.enums.ActionButtonType`. */
export const ACTION_BUTTON_TYPES = [
  "INSTAGRAM",
  "FACEBOOK",
  "TIKTOK",
  "YOUTUBE",
  "WHATSAPP",
  "X",
  "LINKEDIN",
  "THREADS",
  "PINTEREST",
  "SNAPCHAT",
  "EMAIL",
] as const;

export type ActionButtonType = (typeof ACTION_BUTTON_TYPES)[number];

export const DEFAULT_ACTION_BUTTON_TYPE: ActionButtonType = "INSTAGRAM";

export const ACTION_BUTTON_TYPE_LABELS: Record<ActionButtonType, string> = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  WHATSAPP: "WhatsApp",
  X: "X",
  LINKEDIN: "LinkedIn",
  THREADS: "Threads",
  PINTEREST: "Pinterest",
  SNAPCHAT: "Snapchat",
  EMAIL: "Correo",
};

export function isActionButtonType(value: string | undefined | null): value is ActionButtonType {
  return ACTION_BUTTON_TYPES.includes(value as ActionButtonType);
}

export function humanizeActionButtonType(type: ActionButtonType | string | null | undefined): string {
  if (type && isActionButtonType(type)) {
    return ACTION_BUTTON_TYPE_LABELS[type];
  }
  return type ?? "Sin tipo";
}
