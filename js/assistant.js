
import {
    catalog,
    categories,
    normalize,
    matchTools
} from './catalog.js';

import {
    findCommand,
    hasWakeWord,
    stripWakeWord
} from './commands.js';

export class TrainingAssistant {

    constructor({ execute, logger, session, analytics }) {

        this.execute = execute;
        this.logger = logger;
        this.session = session;
        this.analytics = analytics;

        this.pending = null;
        this.lastTool = null;
        this.activeUntil = 0;
        this.history = [];
    }

    respond(text) {

        this.history.push({
            role: 'assistant',
            text
        });

        this.logger.voice('ASSISTANT_RESPONSE', text);

        return text;
    }

    async select(tool) {

        await this.execute('select-tool', tool.id, 'voice');

        this.lastTool = tool;
        this.pending = null;

        return this.respond(
            `${tool.name} seleccionada. Está disponible en la estación virtual.`
        );
    }

    clarify(options) {

        this.pending = {
            type: 'tool',
            options
        };

        this.activeUntil = Date.now() + 30000;

        return this.respond(
            `Tengo ${options.length} opciones: ${
                options.map(tool => tool.name).join(', ')
            }. ¿Cuál necesitas?`
        );
    }

    async handle(raw, requireWake = true) {

        const original = normalize(raw);
        const wake = hasWakeWord(original);

        if (
            requireWake &&
            !wake &&
            Date.now() > this.activeUntil
        ) {
            return null;
        }

        this.activeUntil = Date.now() + 30000;

        const text = stripWakeWord(original);

        if (!text) {
            return this.respond('Te escucho. ¿En qué puedo ayudarte?');
        }

        this.history.push({
            role: 'technician',
            text
        });

        this.logger.voice('TRANSCRIPT', raw);

        if (/\b(gracias|muchas gracias)\b/.test(text)) {

            return this.respond(
                'De nada. Estoy disponible para continuar.'
            );
        }

        if (/^(hola|buenos dias|buenas tardes|buenas noches)$/.test(text)) {

            return this.respond(
                'Hola. Soy tu asistente de entrenamiento CodeFive.'
            );
        }

        if (/^(cancela|cancelar|ninguna|olvidalo|no)$/.test(text)) {

            this.pending = null;

            return this.respond('Solicitud cancelada.');
        }

        if (this.pending?.type === 'tool') {

            const options = this.pending.options;

            const matches = options.filter(tool =>
                [tool.name, ...tool.aliases].some(alias => {

                    const name = normalize(alias);

                    return text.includes(name) ||
                        (
                            text.length > 3 &&
                            name.includes(
                                text.replace(/^(la|el|una|un)\s+/, '')
                            )
                        );
                })
            );

            const ordinal = {
                primera: 0,
                primero: 0,
                segunda: 1,
                segundo: 1,
                tercera: 2,
                tercero: 2,
                cuarta: 3,
                quinta: 4
            };

            for (const [word, index] of Object.entries(ordinal)) {

                if (
                    new RegExp(`\\b${word}\\b`).test(text) &&
                    options[index]
                ) {
                    return this.select(options[index]);
                }
            }

            if (matches.length === 1) {
                return this.select(matches[0]);
            }

            this.pending = null;
        }

        const command = findCommand(text);

        if (command) {

            const response = await this.execute(
                command,
                null,
                'voice'
            );

            return this.respond(
                response || 'Instrucción ejecutada.'
            );
        }

        if (
            /\b(cuantas herramientas|que herramientas|que tienes|inventario disponible)\b/
                .test(text)
        ) {

            return this.respond(
                `Disponemos de ${catalog.length} herramientas, organizadas en ${categories.map(c => c.name).join(', ')}.`
            );
        }

        const isQuestion =
            /\b(para que|que es|como funciona|explica|sirve|diferencia)\b/
                .test(text);

        let matches = matchTools(text);

        if (!matches.length && /\blinternas?\b/.test(text)) {

            matches = catalog.filter(tool =>
                ['flashlight', 'headlamp', 'magnetic-light',
                 'inspection-light', 'articulated-light']
                    .includes(tool.id)
            );
        }

        if (!matches.length && /\b(desarmadores?|destornilladores?)\b/.test(text)) {

            matches = catalog.filter(tool =>
                ['flat-driver', 'phillips', 'torx-driver']
                    .includes(tool.id)
            );
        }

        if (!matches.length && /\b(torquimetros?)\b/.test(text)) {

            matches = catalog.filter(tool =>
                ['torque', 'digital-torque'].includes(tool.id)
            );
        }

        if (!matches.length && /\bpinzas\b/.test(text)) {

            matches = catalog.filter(tool =>
                ['pliers', 'needle-pliers', 'cutters',
                 'locking-pliers', 'clamp-meter'].includes(tool.id)
            );
        }

        if (isQuestion) {

            this.logger.help(raw);

            if (this.session.mode === 'evaluation') {

                return this.respond(
                    'Tu pregunta quedó registrada. En modo evaluación no puedo proporcionar pistas técnicas.'
                );
            }

            if (!matches.length && this.lastTool) {

                if (/\b(esta|esa|herramienta)\b/.test(text)) {
                    matches = [this.lastTool];
                }
            }

            if (matches.length) {

                return this.respond(
                    matches.map(tool =>
                        `${tool.name}: ${tool.description}`
                    ).join(' ')
                );
            }
        }

        if (matches.length === 1) {

            return this.select(matches[0]);
        }

        if (matches.length > 1) {

            return this.clarify(matches);
        }

        if (/\b(ayuda|no se|que hago|siguiente paso)\b/.test(text)) {

            this.logger.help(raw);

            if (this.session.mode === 'evaluation') {

                return this.respond(
                    'Solicitud registrada. Continúa según tu criterio técnico.'
                );
            }

            return this.respond(
                'En esta práctica virtual debes seleccionar una herramienta compatible, sujetarla y completar la operación indicada en el escenario.'
            );
        }

        if (/\b(quien eres|como te llamas|que puedes hacer)\b/.test(text)) {

            return this.respond(
                'Soy CodeFive, tu asistente de entrenamiento. Puedo seleccionar herramientas, explicar sus funciones, controlar la vista y consultar tu desempeño.'
            );
        }

        return this.respond(
            'Escuché tu solicitud, pero todavía no dispongo de información suficiente para responderla. Puedes preguntarme por herramientas, navegación o progreso de entrenamiento.'
        );
    }
}
