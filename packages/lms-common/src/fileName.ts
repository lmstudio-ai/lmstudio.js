export const modelExtensions = [".gguf"];

export const doesFileNameIndicateModel = (path: string) => {
  return modelExtensions.some(ext => path.toLowerCase().endsWith(ext));
};
