import type { DataResponse } from "./types";

export type PaginatedPayload<T> = {
  items: T[];
  meta: NonNullable<DataResponse<T>["meta"]>;
};
