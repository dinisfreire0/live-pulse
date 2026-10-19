const STORAGE_KEY = 'livepulse.voterToken';

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

let memoryToken: string | null = null;

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
