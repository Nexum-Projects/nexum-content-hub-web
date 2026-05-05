import { DASHBOARD_TIME_ZONE, formatDateGuatemala, formatDateTimeGuatemala } from "@/lib/datetime-guatemala";

const cellClass = "whitespace-nowrap text-xs tabular-nums text-muted-foreground";

export function ListDateTimeGT({ value }: { value?: string | null }) {
  return (
    <span className={cellClass} title={DASHBOARD_TIME_ZONE}>
      {formatDateTimeGuatemala(value)}
    </span>
  );
}

export function ListDateGT({ value }: { value?: string | null }) {
  return (
    <span className={cellClass} title={DASHBOARD_TIME_ZONE}>
      {formatDateGuatemala(value)}
    </span>
  );
}
