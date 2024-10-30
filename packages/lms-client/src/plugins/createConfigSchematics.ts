import {
  type GlobalKVFieldValueTypeLibraryMap,
  kvValueTypesLibrary,
} from "@lmstudio/lms-kv-config";
import { KVConfigSchematicsBuilder } from "@lmstudio/lms-kv-config/dist/KVConfig";

export function createConfigSchematics(): KVConfigSchematicsBuilder<
  GlobalKVFieldValueTypeLibraryMap,
  {}
> {
  return new KVConfigSchematicsBuilder(kvValueTypesLibrary);
}
