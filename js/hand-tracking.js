
export class HandTracking {

    constructor(video, canvas, gloves, logger) {

        this.video = video;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.gloves = gloves;
        this.logger = logger;

        this.detector = null;
        this.stream = null;

        this.running = false;
        this.generation = 0;
        this.lastVideoTime = -1;

        this.swapHands = true;

        this.previous = [false, false];
    }

    async loadDetector() {

        if (this.detector) return this.detector;

        const {
            HandLandmarker,
            FilesetResolver
        } = await import(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm'
        );

        const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );

        const modelAssetPath =
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

        const options = delegate => ({
            baseOptions: { modelAssetPath, delegate },
            runningMode: 'VIDEO',
            numHands: 2,
            minHandDetectionConfidence: 0.55,
            minHandPresenceConfidence: 0.55,
            minTrackingConfidence: 0.55
        });

        try {

            this.detector =
                await HandLandmarker.createFromOptions(
                    vision, options('GPU')
                );

        } catch {

            this.detector =
                await HandLandmarker.createFromOptions(
                    vision, options('CPU')
                );
        }

        return this.detector;
    }

    async start() {

        this.stop();

        const generation = ++this.generation;

        try {

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 30 },
                    facingMode: 'user'
                },
                audio: false
            });

            if (generation !== this.generation) {

                stream.getTracks().forEach(track => track.stop());
                return;
            }

            this.stream = stream;

            this.video.srcObject = stream;

            await this.video.play();

            await this.loadDetector();

            if (generation !== this.generation) return;

            this.running = true;
            this.lastVideoTime = -1;

            this.video.style.visibility = 'visible';

            this.logger.system(
                'CAMERA_STARTED',
                'Cámara y seguimiento de manos activos'
            );

        } catch (error) {

            this.stop();

            this.logger.system(
                'CAMERA_ERROR',
                error.message,
                { level: 'ERROR' }
            );

            throw error;
        }
    }

    stop() {

        this.generation++;
        this.running = false;

        this.stream?.getTracks().forEach(track => track.stop());

        this.stream = null;

        this.video.srcObject = null;
        this.video.style.visibility = 'hidden';

        this.ctx.clearRect(
            0, 0, this.canvas.width, this.canvas.height
        );

        this.previous = [false, false];
    }

    update() {

        if (
            !this.running ||
            !this.detector ||
            this.video.readyState < 2 ||
            this.lastVideoTime === this.video.currentTime
        ) return;

        this.lastVideoTime = this.video.currentTime;

        const result = this.detector.detectForVideo(
            this.video,
            performance.now()
        );

        const used = new Set();

        const handedness =
            result.handedness || result.handednesses || [];

        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;

        this.ctx.clearRect(
            0, 0, this.canvas.width, this.canvas.height
        );

        result.landmarks.forEach((landmarks, i) => {

            const label = handedness[i]?.[0]?.categoryName;

            if (!label) return;

            let index = label === 'Left' ? 0 : 1;

            // Corrección de lateralidad observada.
            if (this.swapHands) index = 1 - index;

            if (used.has(index)) return;

            used.add(index);

            this.gloves[index].track(
                landmarks,
                result.worldLandmarks?.[i]
            );

            this.draw(landmarks, index);
        });

        this.gloves.forEach((glove, index) => {

            const visible = used.has(index);

            glove.setVisible(visible);

            if (visible !== this.previous[index]) {

                this.logger.system(
                    visible ? 'HAND_DETECTED' : 'HAND_LOST',
                    `${glove.label}: ${
                        visible ? 'seguimiento activo' : 'seguimiento perdido'
                    }`,
                    { hand: glove.label }
                );

                this.previous[index] = visible;
            }
        });
    }

    draw(points, index) {

        const w = this.canvas.width;
        const h = this.canvas.height;

        const color = index === 0 ? '#38bdf8' : '#34d399';

        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],
            [0, 5], [5, 6], [6, 7], [7, 8],
            [5, 9], [9, 10], [10, 11], [11, 12],
            [9, 13], [13, 14], [14, 15], [15, 16],
            [13, 17], [17, 18], [18, 19], [19, 20],
            [17, 0]
        ];

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;

        for (const [a, b] of connections) {

            this.ctx.beginPath();

            this.ctx.moveTo(points[a].x * w, points[a].y * h);
            this.ctx.lineTo(points[b].x * w, points[b].y * h);

            this.ctx.stroke();
        }

        this.ctx.fillStyle = '#ffffff';

        for (const point of points) {

            this.ctx.beginPath();

            this.ctx.arc(
                point.x * w,
                point.y * h,
                4, 0, Math.PI * 2
            );

            this.ctx.fill();
        }
    }
}
