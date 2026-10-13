const STORAGE_KEY = 'livepulse.voterToken';

function randomToken(): string {
  // crypto.randomUUID is only available on secure origins (https/localhost),
  // but phones on the local network reach the app over plain http.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

let memoryToken: string | null = null;

/** Anonymous per-browser identity used to enforce one vote per person. */
export function getVoterToken(): string {
  try {
    let token = localStorage.getItem(STORAGE_KEY);
    if (!token) {
      token = randomToken();
      localStorage.setItem(STORAGE_KEY, token);
    }
    return token;
  } catch {
    memoryToken ??= randomToken();
    return memoryToken;
  }
}
