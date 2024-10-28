import { kvValueTypesLibrary } from "@lmstudio/lms-kv-config";
import { KVConfigSchematicsBuilder } from "@lmstudio/lms-kv-config/dist/KVConfig";

export function createConfigSchematics() {
  return new KVConfigSchematicsBuilder(kvValueTypesLibrary);
}
