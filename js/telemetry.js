
export class Telemetry {

    constructor(logger, analytics) {

        this.logger = logger;
        this.analytics = analytics;

        logger.addEventListener('event', event => {
            this.renderEvent(event.detail);
        });
    }

    set(id, value) {

        const element = document.getElementById(id);

        if (element) element.textContent = value;
    }

    renderEvent(event) {

        const container = document.getElementById('eventLog');

        if (!container) return;

        const row = document.createElement('div');

        row.className = `log-row level-${event.level.toLowerCase()}`;

        const time = document.createElement('span');

        time.className = 'log-time';

        time.textContent = new Date(
            event.timestamp
        ).toLocaleTimeString('es-MX');

        const level = document.createElement('strong');

        level.textContent = event.level;

        const message = document.createElement('span');

        message.textContent = event.message;

        row.append(time, level, message);

        container.prepend(row);

        while (container.children.length > 100) {

            container.lastElementChild.remove();
        }
    }

    update(hands, interaction, toolManager) {

        const data = this.analytics.calculate();

        this.set('accuracy', data.accuracy === null
            ? '—'
            : `${data.accuracy}%`);

        this.set('errors', data.errors);
        this.set('helpCount', data.help);
        this.set('eventCount', data.totalEvents);

        this.set('autonomy', data.autonomy === null
            ? '—'
            : `${data.autonomy}%`);

        this.set(
            'sessionTime',
            this.analytics.formatTime(data.elapsedMs)
        );

        this.set('handCount',
            hands.filter(hand => hand.visible).length
        );

        for (const hand of hands) {

            this.set(
                hand.id === 0 ? 'leftStatus' : 'rightStatus',
                !hand.visible
                    ? 'No detectada'
                    : hand.grip
                        ? 'Agarre cerrado'
                        : 'Mano abierta'
            );
        }

        this.set(
            'selectedTool',
            toolManager.selected?.name || 'Ninguna'
        );

        this.set(
            'gripStatus',
            interaction.heldBy === null
                ? 'Libre'
                : interaction.heldBy === 0
                    ? 'Mano izquierda'
                    : 'Mano derecha'
        );

        this.set(
            'progressText',
            `${Math.round(interaction.progress)}%`
        );

        const bar = document.getElementById('progressBar');

        if (bar) {
            bar.style.width = `${interaction.progress}%`;
        }
    }
}
