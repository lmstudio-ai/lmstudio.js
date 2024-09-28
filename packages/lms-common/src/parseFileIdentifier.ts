import { type ParsedFileIdentifier } from "@lmstudio/lms-shared-types";

export function parseFileIdentifier(fileIdentifier: string): ParsedFileIdentifier {
  if (!fileIdentifier.includes(":")) {
    fileIdentifier = `local:${fileIdentifier}`;
  }
  const colonIndex = fileIdentifier.indexOf(":");
  const namespace = fileIdentifier.slice(0, colonIndex);
  const content = fileIdentifier.slice(colonIndex + 1);
  switch (namespace) {
    case "local": {
      if (content.includes("/") || content.includes("\\") || content.length === 0) {
        throw new Error(`Invalid local file name: ${content}.`);
      }
      return {
        type: "local",
        fileName: content,
      };
    }
    case "base64": {
      return {
        type: "base64",
        base64Data: content,
      };
    }
    default: {
      throw new Error(`Unknown file identifier namespace: ${namespace}.`);
    }
  }
}
