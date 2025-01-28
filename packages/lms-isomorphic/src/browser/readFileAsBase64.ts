export async function readFileAsBase64(_path: string): Promise<
  | {
      success: true;
      base64: string;
    }
  | {
      success: false;
    }
> {
  return { success: false };
}
