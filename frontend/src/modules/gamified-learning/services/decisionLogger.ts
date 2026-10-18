// ML-Ready Decision Logging Service for WiseCub CDEMF
// Records structured learning events locally for research evaluation and ML dataset exports

import { LearningEvent, LearningEventType } from '../types/events.types';

const STORAGE_KEY_EVENTS = 'wisecub_cdemf_event_stream_v1';
const SCHEMA_VERSION = '1.0.0-cdemf';

export class DecisionLogger {
  private static sessionId: string = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  public static getSessionId(): string {
    return this.sessionId;
  }

  public static logEvent<T = Record<string, unknown>>(
    missionId: string,
    levelId: string,
    levelNumber: number,
    attemptNumber: number,
    eventType: LearningEventType,
    payload: T
  ): LearningEvent<T> {
    const event: LearningEvent<T> = {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sessionId: this.sessionId,
      missionId,
      levelId,
      levelNumber,
      attemptNumber,
      eventType,
      timestamp: new Date().toISOString(),
      payload,
      schemaVersion: SCHEMA_VERSION,
    };

    try {
      const existingRaw = localStorage.getItem(STORAGE_KEY_EVENTS);
      const existing: LearningEvent[] = existingRaw ? JSON.parse(existingRaw) : [];
      existing.push(event as unknown as LearningEvent);
      // Keep last 500 events in prototype storage
      const trimmed = existing.slice(-500);
      localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Could not persist learning event to localStorage', e);
    }

    return event;
  }

  public static getAllEvents(): LearningEvent[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_EVENTS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public static exportEventsAsJson(): string {
    const events = this.getAllEvents();
    const exportBundle = {
      researchProject: 'WiseCub J26-IT-418',
      framework: 'Competency-Driven Emotional Mission Framework (CDEMF)',
      exportTimestamp: new Date().toISOString(),
      totalEventsRecorded: events.length,
      sessionId: this.sessionId,
      schemaVersion: SCHEMA_VERSION,
      events,
    };
    return JSON.stringify(exportBundle, null, 2);
  }

  public static clearEvents(): void {
    localStorage.removeItem(STORAGE_KEY_EVENTS);
  }
}
