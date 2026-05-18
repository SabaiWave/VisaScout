import { log } from './logger';

type EventProperties = Record<string, string | number | boolean | null | undefined>;

export async function trackEvent(event: string, props: EventProperties = {}): Promise<void> {
  try {
    log.info(event, {
      event,
      ...props,
      ts: new Date().toISOString(),
    });
  } catch {
    // never throw — logging failure must never break the app
  }
}
