import { getPublicUrl as getPublicUrlAction } from "./get-public-url";
import { upload as uploadAction } from "./upload";

export const Storage = {
  getPublicUrl: getPublicUrlAction,
  upload: uploadAction,
};
