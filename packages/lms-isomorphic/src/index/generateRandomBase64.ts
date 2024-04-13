import { randomBytes } from "crypto";

export function generateRandomBase64(bytesOfRandomness = 18) {
  const randomBytesBuffer = randomBytes(bytesOfRandomness);
  return randomBytesBuffer.toString("base64");
}
