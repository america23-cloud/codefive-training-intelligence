
import { saveSession } from './storage.js';

export class SessionManager {

    constructor() {
        this.current = null;
        this.startedAt = 0;
    }

    start(technicianId = 'TEC-DEMO', mode = 'training') {

        this.startedAt = performance.now();

        this.current = {
            sessionId: crypto.randomUUID(),
            technicianId,
            mode,
            scenario: 'mechanical-fastener',
            attempt: 1,
            startedAt: new Date().toISOString(),
            endedAt: null,
            status: 'active'
        };

        this.persist();

        return this.current;
    }

    get elapsedMs() {
        return this.current
            ? Math.max(0, performance.now() - this.startedAt)
            : 0;
    }

    get mode() {
        return this.current?.mode || 'training';
    }

    setMode(mode) {

        if (!['training', 'evaluation'].includes(mode)) {
            return;
        }

        this.current.mode = mode;
        this.persist();
    }

    retry() {
        this.current.attempt++;
        this.persist();
    }

    finish() {

        if (!this.current) return;

        this.current.endedAt = new Date().toISOString();
        this.current.durationMs = this.elapsedMs;
        this.current.status = 'completed';

        this.persist();
    }

    persist() {

        if (!this.current) return;

        saveSession({ ...this.current }).catch(error => {
            console.error('[STORAGE]', error);
        });
    }
}
