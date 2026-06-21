const LEVELUP_SRC = "/levelup.wav";
const DEBOUNCE_MS = 800;

let audio: HTMLAudioElement | null = null;
let lastPlayedAt = 0;

export function playLevelUpSound(): void {
  if (typeof window === "undefined") return;

  const now = Date.now();
  if (now - lastPlayedAt < DEBOUNCE_MS) return;
  lastPlayedAt = now;

  try {
    if (!audio) {
      audio = new Audio(LEVELUP_SRC);
      audio.volume = 0.55;
    }
    audio.currentTime = 0;
    void audio.play().catch(() => {
      /* blocked until user gesture */
    });
  } catch {
    /* ignore */
  }
}
