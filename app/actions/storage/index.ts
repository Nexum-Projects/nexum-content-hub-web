import { removeByPublicUrl as removeByPublicUrlAction } from "./delete";
import { getPublicUrl as getPublicUrlAction } from "./get-public-url";
import { upload as uploadAction } from "./upload";

export const Storage = {
  getPublicUrl: getPublicUrlAction,
  removeByPublicUrl: removeByPublicUrlAction,
  upload: uploadAction,
};
