
import { saveEvent, downloadJSON } from './storage.js';

export class ActivityLogger extends EventTarget {

    constructor(sessionManager) {

        super();

        this.session = sessionManager;
        this.events = [];
        this.sequence = 0;
        this.pending = new Set();
    }

    log(category, action, message, data = {}) {

        const current = this.session.current;

        const event = {
            eventId: crypto.randomUUID(),
            sequence: ++this.sequence,
            sessionId: current?.sessionId || null,
            technicianId: current?.technicianId || null,
            timestamp: new Date().toISOString(),
            elapsedMs: Math.round(this.session.elapsedMs),
            mode: this.session.mode,
            attempt: current?.attempt || 1,
            level: data.level || 'INFO',
            category,
            action,
            message,
            inputMethod: data.inputMethod || null,
            tool: data.tool || null,
            hand: data.hand || null,
            correct: typeof data.correct === 'boolean'
                ? data.correct
                : null,
            assisted: data.assisted === true,
            competency: data.competency || null,
            responseTimeMs: data.responseTimeMs ?? null,
            metadata: data.metadata || {}
        };

        this.events.push(event);

        console.log(
            `[CODEFIVE][${event.level}][${category}]`,
            message,
            event
        );

        const operation = saveEvent(event)
            .catch(error => {
                console.error('[LOGGER STORAGE]', error);

                this.dispatchEvent(new CustomEvent(
                    'storage-error',
                    { detail: error }
                ));
            })
            .finally(() => this.pending.delete(operation));

        this.pending.add(operation);

        this.dispatchEvent(new CustomEvent('event', {
            detail: event
        }));

        return event;
    }

    activity(action, message, data = {}) {

        return this.log('ACTIVITY', action, message, data);
    }

    voice(action, message, data = {}) {

        return this.log('VOICE', action, message, {
            ...data,
            inputMethod: 'voice'
        });
    }

    system(action, message, data = {}) {

        return this.log('SYSTEM', action, message, {
            ...data,
            correct: null
        });
    }

    help(message, data = {}) {

        return this.log('ASSISTANCE', 'HELP_REQUEST', message, {
            ...data,
            level: 'HELP'
        });
    }

    evaluation(action, message, data = {}) {

        return this.log('EVALUATION', action, message, {
            ...data,
            level: data.correct === true
                ? 'SUCCESS'
                : data.correct === false
                    ? 'WARNING'
                    : 'INFO'
        });
    }

    async export() {

        await Promise.allSettled([...this.pending]);

        downloadJSON(
            `CodeFive-${this.session.current.sessionId}.json`,
            {
                session: this.session.current,
                events: this.events
            }
        );
    }
}
