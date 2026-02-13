'use client';

// Shared state for boot sequence coordination
// Used by BootSequence (page) and PublicHeader (layout)

const BOOT_SEEN_KEY = 'tyf-boot-seen';
const listeners = new Set<() => void>();

// Runtime-only flag for "was booted this session"
let completedThisSession = false;

export const bootStore = {
  subscribe(callback: () => void) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  getSnapshot() {
    if (typeof window === 'undefined') return true; // Server always sees "booted" to avoid mismatch
    try {
      return localStorage.getItem(BOOT_SEEN_KEY) === 'true';
    } catch {
      return false;
    }
  },

  getServerSnapshot() {
    return true;
  },

  getCompletedThisSession() {
    return completedThisSession;
  },

  markSeen() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(BOOT_SEEN_KEY, 'true');
      listeners.forEach((l) => l());
    }
  },

  markComplete() {
    completedThisSession = true;
    this.markSeen();
  },

  // Helper to reset for testing/debugging
  reset() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(BOOT_SEEN_KEY);
      completedThisSession = false;
      listeners.forEach((l) => l());
    }
  }
};

export { BOOT_SEEN_KEY };
