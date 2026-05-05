import type { ReactNode } from "react";

export function DataTable({
  headers,
  children,
  minWidth = 720,
}: {
  headers: string[];
  children: ReactNode;
  minWidth?: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth }}>
        <thead className="text-left text-xs text-muted-foreground">
          <tr className="border-b">
            {headers.map((header) => (
              <th className="py-3 font-medium last:text-right" key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
