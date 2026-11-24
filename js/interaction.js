
import * as THREE from 'three';

export class InteractionEngine {

    constructor(tools, simulation, logger, session) {

        this.tools = tools;
        this.simulation = simulation;
        this.logger = logger;
        this.session = session;

        this.heldBy = null;
        this.progress = 0;
        this.completed = false;

        this.cooldown = 0;
        this.missingTime = 0;
        this.lastAngle = null;
        this.engaged = false;
        this.wrongReported = false;

        this.previousGrips = new Map();

        this.stepStarted = performance.now();
    }

    select(id, inputMethod = 'interface') {

        this.release();

        const tool = this.tools.select(id);

        if (!tool) return null;

        this.wrongReported = false;

        this.logger.activity(
            'SELECT_TOOL',
            `Herramienta seleccionada: ${tool.name}`,
            { tool: id, inputMethod }
        );

        return tool;
    }

    release(reason = 'manual') {

        if (this.heldBy !== null) {

            this.logger.activity(
                'RELEASE',
                'Herramienta liberada',
                {
                    tool: this.tools.selected?.id,
                    hand: this.heldBy === 0 ? 'left' : 'right',
                    metadata: { reason }
                }
            );

            this.tools.release();
        }

        this.heldBy = null;
        this.engaged = false;
        this.lastAngle = null;
        this.missingTime = 0;
        this.cooldown = 0.35;
    }

    getGripPosition() {

        if (!this.tools.object) return null;

        this.tools.object.updateMatrixWorld(true);

        return this.tools.object.localToWorld(
            this.tools.object.userData.grip.clone()
        );
    }

    getTipPosition() {

        const object = this.tools.object;

        object.updateMatrixWorld(true);

        return object.localToWorld(
            object.userData.tip.clone()
        );
    }

    calculatePose(hand) {

        const object = this.tools.object;

        const quaternion = hand.quaternion.clone().multiply(
            new THREE.Quaternion().setFromEuler(
                object.userData.rotation
            )
        );

        const offset = object.userData.grip.clone()
            .multiply(object.scale)
            .applyQuaternion(quaternion);

        return {
            quaternion,
            position: hand.position.clone().sub(offset)
        };
    }

    update(hands, delta) {

        this.cooldown = Math.max(0, this.cooldown - delta);

        for (const hand of hands) {

            if (!hand.visible) {

                this.previousGrips.delete(hand.id);
                continue;
            }

            const previous = this.previousGrips.get(hand.id);

            if (previous !== undefined && previous !== hand.grip) {

                this.logger.activity(
                    'HAND_GESTURE',
                    `${hand.label}: ${hand.grip ? 'cerrada' : 'abierta'}`,
                    {
                        hand: hand.label,
                        metadata: { closed: hand.grip }
                    }
                );
            }

            this.previousGrips.set(hand.id, hand.grip);
        }

        if (!this.tools.object) return;

        if (this.heldBy === null && this.cooldown === 0) {

            const grip = this.getGripPosition();

            const candidates = hands
                .filter(hand =>
                    hand.visible &&
                    hand.grip &&
                    hand.position.distanceTo(grip) < 0.45
                )
                .sort((a, b) =>
                    a.position.distanceTo(grip) -
                    b.position.distanceTo(grip)
                );

            if (candidates.length) {

                const hand = candidates[0];

                this.heldBy = hand.id;

                this.logger.activity(
                    'GRIP',
                    `Herramienta sujetada con mano ${hand.label.toLowerCase()}`,
                    {
                        tool: this.tools.selected.id,
                        hand: hand.label
                    }
                );
            }
        }

        if (this.heldBy === null) return;

        const hand = hands.find(item => item.id === this.heldBy);

        if (!hand?.visible) {

            this.missingTime += delta;

            if (this.missingTime > 0.5) {

                this.release('tracking-lost');
            }

            return;
        }

        this.missingTime = 0;

        if (!hand.grip) {

            this.release('hand-opened');
            return;
        }

        const pose = this.calculatePose(hand);

        const alpha = 1 - Math.exp(-35 * delta);

        this.tools.object.position.lerp(
            pose.position, alpha
        );

        this.tools.object.quaternion.slerp(
            pose.quaternion, alpha
        );

        if (this.completed) return;

        const target = this.simulation.getTarget();
        const distance = this.getTipPosition().distanceTo(target);

        const correctTool = this.tools.selected.id === 'ratchet';

        if (distance < 0.4 && !correctTool) {

            if (!this.wrongReported) {

                this.wrongReported = true;

                this.logger.evaluation(
                    'INCORRECT_TOOL',
                    'Herramienta incompatible con la práctica actual',
                    {
                        tool: this.tools.selected.id,
                        correct: false,
                        competency: 'tool_selection'
                    }
                );
            }

            return;
        }

        if (distance > 0.65) {

            this.engaged = false;
            this.lastAngle = null;
            this.wrongReported = false;

            return;
        }

        if (!correctTool) return;

        if (distance < 0.4 && !this.engaged) {

            this.engaged = true;
            this.lastAngle = hand.angle;

            this.logger.activity(
                'TOOL_ENGAGED',
                'Matraca acoplada al componente',
                { tool: 'ratchet' }
            );
        }

        if (!this.engaged) return;

        if (this.lastAngle === null) {
            this.lastAngle = hand.angle;
        }

        let turn = hand.angle - this.lastAngle;

        turn = Math.atan2(
            Math.sin(turn),
            Math.cos(turn)
        );

        this.lastAngle = hand.angle;

        if (turn > 0.015 && turn < 0.5) {

            this.progress = Math.min(
                100,
                this.progress + turn * 22
            );

            this.simulation.bolt.rotation.z += turn;

            this.simulation.setProgress(this.progress);
        }

        if (this.progress >= 100 && !this.completed) {

            this.completed = true;

            const assisted = this.logger.events.some(event =>
                event.sessionId === this.session.current.sessionId &&
                event.attempt === this.session.current.attempt &&
                event.action === 'HELP_REQUEST'
            );

            this.logger.evaluation(
                'STEP_COMPLETED',
                'Operación mecánica virtual completada',
                {
                    correct: true,
                    assisted,
                    tool: 'ratchet',
                    competency: 'mechanical_operation',
                    responseTimeMs: Math.round(
                        performance.now() - this.stepStarted
                    )
                }
            );
        }
    }

    reset() {

        this.release();

        this.progress = 0;
        this.completed = false;
        this.wrongReported = false;
        this.stepStarted = performance.now();

        this.simulation.reset();

        this.session.retry();

        this.logger.activity(
            'PRACTICE_RESTARTED',
            'Práctica reiniciada'
        );
    }
}
