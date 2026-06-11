export function generateRandomPassword() {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
  const values = new Uint32Array(14);
  crypto.getRandomValues(values);

  return Array.from(values, (value) => characters[value % characters.length]).join("");
}
