import {clearCache} from "@chenglou/pretext";
import {clearPrepareMemo} from "./prepareMemo.js";

export function clearPrepareCache() {
  clearPrepareMemo();
  clearCache();
}
