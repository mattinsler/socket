import { clearTimeout, setTimeout } from 'timers';

export interface Backoff {
  cancel(): void;
  reset(): void;
  trigger(): void;
}

export function fibonacci(fn: () => void, max: number): Backoff {
  const last = [0, 1];
  let timeout: NodeJS.Timeout | null = null;

  function cancel() {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    reset();
  }

  function reset() {
    last[0] = 0;
    last[1] = 1;
  }

  function trigger() {
    const next = last[0] + last[1];
    last[0] = last[1];
    last[1] = next;
    timeout = setTimeout(fn, Math.min(next, max));
  }

  return { cancel, reset, trigger };
}
