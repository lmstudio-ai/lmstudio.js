export function generateRandomBase64(bytesOfRandomness = 18) {
  const randomBytes = new Uint8Array(bytesOfRandomness);
  globalThis.crypto.getRandomValues(randomBytes);
  // Using btoa here is safe because the input is not string anyways.
  return btoa(String.fromCharCode(...randomBytes));
}
