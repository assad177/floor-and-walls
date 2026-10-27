// Simple admin auth — dummy credentials check + cookie-based session
// Dummy credentials (change in production!)
export const ADMIN_EMAIL = "admin@floorsandwalls.com";
export const ADMIN_PASSWORD = "admin123";

export const SESSION_COOKIE = "fw_admin_session";
export const SESSION_DURATION_MS = 1000 * 60 * 60 * 24; // 24 hours

export function isValidCredentials(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
    password === ADMIN_PASSWORD
  );
}

export function createSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}
