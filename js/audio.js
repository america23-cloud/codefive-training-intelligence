
export class AudioMonitor {

    constructor(canvas, callback) {

        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.callback = callback;

        this.stream = null;
        this.context = null;
        this.analyser = null;

        this.running = false;
        this.frame = null;
        this.generation = 0;
    }

    async start() {

        this.stop();

        const generation = ++this.generation;

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                channelCount: 1
            },
            video: false
        });

        if (generation !== this.generation) {

            stream.getTracks().forEach(track => track.stop());

            throw new Error('Captura cancelada');
        }

        this.stream = stream;

        try {

            const Context =
                window.AudioContext ||
                window.webkitAudioContext;

            this.context = new Context();

            await this.context.resume();

            if (generation !== this.generation) {
                throw new Error('Captura cancelada');
            }

            this.analyser = this.context.createAnalyser();

            this.analyser.fftSize = 1024;

            this.source =
                this.context.createMediaStreamSource(stream);

            this.source.connect(this.analyser);

            this.samples = new Float32Array(
                this.analyser.fftSize
            );

            this.running = true;

            this.draw();

            return stream.getAudioTracks()[0].getSettings();

        } catch (error) {

            this.stop();
            throw error;
        }
    }

    draw() {

        if (!this.running) return;

        this.analyser.getFloatTimeDomainData(this.samples);

        const rms = Math.sqrt(
            this.samples.reduce((sum, value) =>
                sum + value * value, 0
            ) / this.samples.length
        );

        const db = Math.max(
            -100,
            20 * Math.log10(Math.max(rms, 0.00001))
        );

        this.callback?.(db);

        const w = this.canvas.clientWidth || 200;
        const h = this.canvas.clientHeight || 45;

        if (this.canvas.width !== w) this.canvas.width = w;
        if (this.canvas.height !== h) this.canvas.height = h;

        this.ctx.clearRect(0, 0, w, h);

        const bars = 42;

        for (let i = 0; i < bars; i++) {

            const index = Math.floor(
                i * this.samples.length / bars
            );

            const height = Math.min(
                h - 2,
                Math.max(3, Math.abs(this.samples[index]) * h * 8)
            );

            this.ctx.fillStyle =
                db > -40 ? '#34d399' : '#60a5fa';

            this.ctx.fillRect(
                i * w / bars,
                (h - height) / 2,
                Math.max(1, w / bars - 2),
                height
            );
        }

        this.frame = requestAnimationFrame(() => this.draw());
    }

    stop() {

        this.generation++;

        this.running = false;

        cancelAnimationFrame(this.frame);

        this.stream?.getTracks().forEach(track => track.stop());

        this.source?.disconnect();

        this.context?.close().catch(() => {});

        this.stream = null;
        this.context = null;
        this.analyser = null;
        this.source = null;

        this.ctx.clearRect(
            0, 0, this.canvas.width, this.canvas.height
        );
    }
}
