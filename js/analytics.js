
export class TrainingAnalytics {

    constructor(logger, session) {

        this.logger = logger;
        this.session = session;
    }

    calculate() {

        const events = this.logger.events.filter(
            event =>
                event.sessionId === this.session.current?.sessionId
        );

        const evaluated = events.filter(event =>
            event.category === 'EVALUATION' &&
            typeof event.correct === 'boolean'
        );

        const correct = evaluated.filter(
            event => event.correct
        ).length;

        const errors = evaluated.filter(
            event => !event.correct
        ).length;

        const help = events.filter(
            event => event.action === 'HELP_REQUEST'
        ).length;

        const grips = events.filter(
            event => event.action === 'GRIP'
        ).length;

        const releases = events.filter(
            event => event.action === 'RELEASE'
        ).length;

        const selections = events.filter(
            event => event.action === 'SELECT_TOOL'
        ).length;

        const voiceRequests = events.filter(
            event => event.action === 'TRANSCRIPT'
        ).length;

        const systemErrors = events.filter(
            event =>
                event.category === 'SYSTEM' &&
                event.level === 'ERROR'
        ).length;

        const completed = evaluated.filter(
            event =>
                event.correct &&
                event.action === 'STEP_COMPLETED'
        );

        const independent = completed.filter(
            event => !event.assisted
        ).length;

        const responseTimes = evaluated
            .map(event => event.responseTimeMs)
            .filter(value => Number.isFinite(value));

        const competencies = {};

        for (const event of evaluated) {

            const key = event.competency || 'general';

            competencies[key] ||= {
                correct: 0,
                total: 0
            };

            competencies[key].total++;

            if (event.correct) {
                competencies[key].correct++;
            }
        }

        for (const value of Object.values(competencies)) {

            value.percentage = Math.round(
                value.correct / value.total * 100
            );
        }

        return {
            totalEvents: events.length,
            correct,
            errors,
            help,
            grips,
            releases,
            selections,
            voiceRequests,
            systemErrors,
            attempts: this.session.current?.attempt || 1,

            accuracy: evaluated.length
                ? Math.round(correct / evaluated.length * 100)
                : null,

            autonomy: completed.length
                ? Math.round(independent / completed.length * 100)
                : null,

            averageResponseMs: responseTimes.length
                ? Math.round(
                    responseTimes.reduce((a, b) => a + b, 0) /
                    responseTimes.length
                )
                : null,

            elapsedMs: this.session.elapsedMs,

            competencies
        };
    }

    formatTime(ms) {

        const seconds = Math.floor(ms / 1000);

        return [
            Math.floor(seconds / 60),
            seconds % 60
        ].map(value =>
            String(value).padStart(2, '0')
        ).join(':');
    }
}
