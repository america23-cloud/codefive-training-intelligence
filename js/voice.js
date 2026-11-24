
export class VoiceEngine {

    constructor(callbacks = {}) {

        this.callbacks = callbacks;

        this.Recognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        this.enabled = false;
        this.running = false;
        this.starting = false;
        this.speaking = false;
        this.processing = false;

        this.pendingSpeech = null;
        this.recognition = null;

        this.timer = null;
        this.speechTimer = null;

        this.generation = 0;
    }

    get supported() {
        return Boolean(this.Recognition);
    }

    state(message) {

        console.log('[VOICE]', message);

        this.callbacks.onState?.(message);
    }

    start() {

        if (!this.supported) {

            this.callbacks.onError?.(
                'Utiliza un navegador compatible con SpeechRecognition, como Chrome.'
            );

            return false;
        }

        if (this.enabled) return true;

        this.enabled = true;

        const generation = ++this.generation;

        const recognition = new this.Recognition();

        this.recognition = recognition;

        recognition.lang = 'es-MX';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        const valid = () =>
            this.enabled && generation === this.generation;

        recognition.onstart = () => {

            if (!valid()) return;

            this.running = true;
            this.starting = false;

            this.state('Escuchando');
        };

        recognition.onaudiostart = () => {

            if (valid()) this.state('Micrófono conectado');
        };

        recognition.onsoundstart = () => {

            if (valid()) this.state('Sonido detectado');
        };

        recognition.onspeechstart = () => {

            if (valid()) this.state('Voz detectada');
        };

        recognition.onspeechend = () => {

            if (valid()) this.state('Procesando voz');
        };

        recognition.onresult = async event => {

            if (
                !valid() ||
                this.speaking ||
                this.processing
            ) return;

            let interim = '';

            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {

                const result = event.results[i];
                const text = result[0].transcript.trim();

                if (!result.isFinal) {

                    interim += text + ' ';
                    continue;
                }

                this.processing = true;

                this.state('Interpretando solicitud');

                try {

                    await this.callbacks.onResult?.(
                        text,
                        result[0].confidence
                    );

                } catch (error) {

                    this.callbacks.onError?.(error.message);

                } finally {

                    this.processing = false;

                    if (valid() && !this.speaking && !this.pendingSpeech) {

                        this.state('Escuchando');
                    }
                }

                if (!valid() || this.pendingSpeech) break;
            }

            if (interim.trim()) {

                this.callbacks.onInterim?.(interim.trim());
            }
        };

        recognition.onerror = event => {

            if (!valid()) return;

            console.error('[VOICE ERROR]', event.error);

            if (event.error === 'aborted') return;

            if (event.error === 'no-speech') {

                this.state('Esperando voz');
                return;
            }

            const messages = {
                network: 'Error de red del servicio de voz.',
                'not-allowed': 'Permiso del micrófono denegado.',
                'audio-capture': 'No se encontró un micrófono disponible.',
                'service-not-allowed': 'Servicio de voz no autorizado.'
            };

            const message =
                messages[event.error] ||
                `Error de reconocimiento: ${event.error}`;

            this.stop();

            this.callbacks.onError?.(message);
        };

        recognition.onend = () => {

            if (!valid()) return;

            this.running = false;
            this.starting = false;

            if (this.pendingSpeech) {

                this.beginSpeech();
                return;
            }

            if (!this.speaking) {

                this.scheduleRestart();
            }
        };

        this.listen();

        return true;
    }

    listen() {

        if (
            !this.enabled ||
            !this.recognition ||
            this.running ||
            this.starting ||
            this.speaking
        ) return;

        try {

            this.starting = true;

            this.state('Conectando reconocimiento');

            this.recognition.start();

        } catch (error) {

            this.starting = false;

            if (error.name === 'InvalidStateError') {

                this.scheduleRestart(900);

            } else {

                this.stop();
                this.callbacks.onError?.(error.message);
            }
        }
    }

    scheduleRestart(delay = 500) {

        clearTimeout(this.timer);

        if (!this.enabled) return;

        this.timer = setTimeout(
            () => this.listen(),
            delay
        );
    }

    speak(text) {

        if (!text || !window.speechSynthesis) return;

        this.pendingSpeech = text;

        clearTimeout(this.timer);

        if (this.running || this.starting) {

            try {

                this.recognition.abort();

            } catch {

                this.running = false;
                this.starting = false;

                this.beginSpeech();
            }

        } else {

            this.beginSpeech();
        }
    }

    beginSpeech() {

        if (!this.pendingSpeech || this.speaking) return;

        const text = this.pendingSpeech;

        this.pendingSpeech = null;
        this.speaking = true;

        this.state('Asistente respondiendo');

        const utterance = new SpeechSynthesisUtterance(text);

        utterance.lang = 'es-MX';
        utterance.rate = 0.98;

        const voices = speechSynthesis.getVoices();

        const voice =
            voices.find(item => item.lang === 'es-MX') ||
            voices.find(item => item.lang.startsWith('es'));

        if (voice) utterance.voice = voice;

        const generation = this.generation;

        const finish = () => {

            if (
                generation !== this.generation ||
                !this.speaking
            ) return;

            clearTimeout(this.speechTimer);

            this.speaking = false;

            if (this.pendingSpeech) {

                this.beginSpeech();

            } else if (this.enabled) {

                this.scheduleRestart(600);

            } else {

                this.state('Micrófono desactivado');
            }
        };

        utterance.onend = finish;
        utterance.onerror = finish;

        this.speechTimer = setTimeout(() => {

            speechSynthesis.cancel();
            finish();

        }, 30000);

        speechSynthesis.speak(utterance);
    }

    stop() {

        this.enabled = false;
        this.running = false;
        this.starting = false;
        this.speaking = false;
        this.processing = false;

        this.pendingSpeech = null;

        this.generation++;

        clearTimeout(this.timer);
        clearTimeout(this.speechTimer);

        const recognition = this.recognition;

        this.recognition = null;

        try {
            recognition?.abort();
        } catch {}

        window.speechSynthesis?.cancel();

        this.state('Micrófono desactivado');
    }
}
