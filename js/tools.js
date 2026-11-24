
import * as THREE from 'three';
import { catalog, getTool } from './catalog.js';

const material = (color, metalness = 0, roughness = 0.45) =>
    new THREE.MeshStandardMaterial({ color, metalness, roughness });

const steel = material('#b8c3ce', 0.85, 0.24);
const dark = material('#202a35', 0.15);
const rubber = material('#303740');
const glass = material('#172e38', 0.3, 0.2);
const white = material('#e8f4ff');

function mesh(group, geometry, mat, x = 0, y = 0, z = 0) {
    const object = new THREE.Mesh(geometry, mat);
    object.position.set(x, y, z);
    object.castShadow = true;
    object.receiveShadow = true;
    group.add(object);
    return object;
}

function box(group, w, h, d, mat, x = 0, y = 0, z = 0) {
    return mesh(group, new THREE.BoxGeometry(w, h, d), mat, x, y, z);
}

function cylinder(group, r1, r2, h, mat, x = 0, y = 0, z = 0, sides = 32) {
    return mesh(
        group,
        new THREE.CylinderGeometry(r1, r2, h, sides),
        mat, x, y, z
    );
}

function ring(group, radius, thickness, mat, x, y, z = 0) {
    return mesh(
        group,
        new THREE.TorusGeometry(radius, thickness, 12, 40),
        mat, x, y, z
    );
}

function handle(group, color, y = -0.3, length = 0.65) {
    cylinder(group, 0.105, 0.12, length, color, 0, y);

    for (let i = 0; i < 7; i++) {
        cylinder(
            group, 0.116, 0.116, 0.025, rubber,
            0, y - length / 2 + 0.06 + i * length / 8
        );
    }
}

function screen(group, text, width, height, x, y, z) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;

    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#102b38';
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = '#76f4c5';
    ctx.font = 'bold 60px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text, 256, 125);

    ctx.font = '24px monospace';
    ctx.fillText('SIMULATION', 256, 200);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    return mesh(
        group,
        new THREE.PlaneGeometry(width, height),
        new THREE.MeshBasicMaterial({ map: texture }),
        x, y, z
    );
}

function lightBeam(group, y = 0.85) {
    const beam = mesh(
        group,
        new THREE.ConeGeometry(0.5, 1.1, 32),
        new THREE.MeshBasicMaterial({
            color: '#fff5bc',
            transparent: true,
            opacity: 0.16,
            depthWrite: false
        }),
        0, y, 0
    );

    beam.rotation.z = Math.PI;
    beam.name = 'beam';
    beam.visible = false;
}

export function buildTool(tool) {

    const group = new THREE.Group();
    const color = material(tool.color);
    const model = tool.model;

    let grip = new THREE.Vector3(0, -0.3, 0);
    let rotation = new THREE.Euler(0, 0, Math.PI / 2);
    let tip = new THREE.Vector3(0, 0.65, 0);

    switch (model) {

        case 'ratchet':
        case 'torque': {
            const length = model === 'torque' ? 1.35 : 0.95;

            cylinder(group, 0.065, 0.065, length, steel);
            handle(group, color, -0.35, 0.55);

            const headY = length / 2 + 0.12;

            const head = cylinder(
                group, 0.18, 0.18, 0.14,
                steel, 0, headY
            );

            head.rotation.x = Math.PI / 2;

            const socket = cylinder(
                group, 0.09, 0.09, 0.23,
                dark, 0, headY, 0.14, 6
            );

            socket.rotation.x = Math.PI / 2;

            if (model === 'torque') {
                box(group, 0.19, 0.3, 0.14, color, 0, 0.12);

                if (tool.id === 'digital-torque') {
                    screen(group, '0 Nm', 0.15, 0.16, 0, 0.12, 0.075);
                }
            }

            grip.set(0, -0.35, 0);
            tip.set(0, headY, 0.25);
            break;
        }

        case 'wrench':
        case 'ring':
        case 'adjustable': {
            box(group, 0.15, 0.95, 0.09, steel);

            if (model === 'ring') {
                ring(group, 0.15, 0.055, steel, 0, 0.58);
            } else {
                box(group, 0.35, 0.13, 0.12, steel, 0, 0.47);

                box(group, 0.1, 0.27, 0.12, steel, -0.13, 0.61);
                box(group, 0.1, 0.27, 0.12, steel, 0.13, 0.61);
            }

            if (model === 'adjustable') {
                const screw = cylinder(
                    group, 0.08, 0.08, 0.18, dark, 0, 0.38
                );
                screw.rotation.z = Math.PI / 2;
            }

            if (tool.id === 'combination') {
                ring(group, 0.13, 0.045, steel, 0, -0.57);
            }

            box(group, 0.18, 0.45, 0.11, color, 0, -0.15);
            break;
        }

        case 'hex': {
            cylinder(group, 0.065, 0.065, 0.95, steel, 0, 0, 0, 6);

            const short = cylinder(
                group, 0.065, 0.065, 0.35,
                color, 0.14, 0.45, 0, 6
            );

            short.rotation.z = Math.PI / 2;
            break;
        }

        case 'socket':
        case 'socket-long': {
            const height = model === 'socket-long' ? 0.75 : 0.42;

            cylinder(group, 0.17, 0.17, height, steel, 0, 0, 0, 12);
            cylinder(group, 0.105, 0.105, 0.01, dark, 0, height / 2, 0, 6);

            grip.set(0, 0, 0);
            break;
        }

        case 'driver':
        case 'probe': {
            handle(group, color, -0.28, 0.65);
            cylinder(group, 0.035, 0.045, 0.65, steel, 0, 0.37);

            if (tool.id === 'flat-driver') {
                box(group, 0.11, 0.12, 0.025, steel, 0, 0.72);
            } else {
                cylinder(group, 0.015, 0.05, 0.12, steel, 0, 0.72);
            }

            tip.set(0, 0.78, 0);
            break;
        }

        case 'hammer': {
            handle(group, color, -0.15, 0.9);

            const head = cylinder(
                group, 0.19, 0.19, 0.62,
                tool.id === 'mallet' ? rubber : steel,
                0, 0.42
            );

            head.rotation.z = Math.PI / 2;
            break;
        }

        case 'pliers': {
            for (const side of [-1, 1]) {

                const arm = box(
                    group, 0.13, 0.65, 0.14,
                    color, side * 0.15, -0.28
                );

                arm.rotation.z = side * 0.25;

                const jaw = box(
                    group, 0.12, 0.42, 0.12,
                    steel, side * 0.08, 0.28
                );

                jaw.rotation.z = -side * 0.12;
            }

            const pivot = cylinder(
                group, 0.12, 0.12, 0.15, steel
            );

            pivot.rotation.x = Math.PI / 2;
            break;
        }

        case 'meter':
        case 'screen':
        case 'clamp': {
            box(group, 0.56, 0.9, 0.23, color);
            box(group, 0.47, 0.77, 0.25, dark);

            screen(
                group,
                model === 'screen' ? 'READY' : '0.00',
                0.39, 0.25, 0, 0.22, 0.132
            );

            const dial = cylinder(
                group, 0.105, 0.105, 0.06,
                rubber, 0, -0.12, 0.15
            );

            dial.rotation.x = Math.PI / 2;

            for (let i = 0; i < 3; i++) {
                box(group, 0.075, 0.05, 0.035, white,
                    -0.13 + i * 0.13, -0.32, 0.14);
            }

            if (model === 'clamp') {
                ring(group, 0.22, 0.065, color, 0, 0.65);
            }

            grip.set(0, -0.16, -0.12);
            rotation.set(0, 0, 0);
            break;
        }

        case 'gun': {
            box(group, 0.34, 0.48, 0.65, color, 0, 0.3);

            box(group, 0.22, 0.6, 0.25, rubber, 0, -0.16, 0.06);
            box(group, 0.34, 0.16, 0.42, dark, 0, -0.49);

            const barrel = cylinder(
                group, 0.105, 0.14, 0.35,
                steel, 0, 0.32, 0.43
            );

            barrel.rotation.x = Math.PI / 2;

            box(group, 0.13, 0.13, 0.1, color, 0, 0.02, 0.22);

            grip.set(0, -0.18, 0.06);
            rotation.set(0, 0, 0);
            tip.set(0, 0.32, 0.61);
            break;
        }

        case 'flashlight': {
            handle(group, color, -0.15, 0.65);
            cylinder(group, 0.2, 0.13, 0.28, color, 0, 0.32);
            cylinder(group, 0.175, 0.175, 0.025, white, 0, 0.47);

            if (tool.id === 'headlamp') {
                ring(group, 0.3, 0.045, rubber, 0, -0.05, -0.12);
            }

            lightBeam(group, 1.02);
            break;
        }

        case 'lamp': {
            box(group, 0.28, 0.92, 0.2, color);
            box(group, 0.2, 0.62, 0.035, white, 0, 0.1, 0.12);
            box(group, 0.3, 0.13, 0.25, rubber, 0, -0.49);

            if (tool.id === 'articulated-light') {
                ring(group, 0.1, 0.035, steel, 0, -0.25, 0.13);
            }

            lightBeam(group, 0.95);
            rotation.set(0, 0, 0);
            break;
        }

        case 'caliper': {
            box(group, 0.12, 1.15, 0.08, steel);

            for (let i = 0; i < 18; i++) {
                box(group, 0.05, 0.012, 0.01, dark,
                    0.02, -0.5 + i * 0.055, 0.05);
            }

            box(group, 0.4, 0.12, 0.1, steel, -0.15, 0.5);
            box(group, 0.4, 0.12, 0.1, steel, -0.15, 0.1);
            box(group, 0.25, 0.2, 0.12, color, 0, 0.1);
            break;
        }

        case 'gauge': {
            const gauge = cylinder(group, 0.28, 0.28, 0.13, steel, 0, 0.3);
            gauge.rotation.x = Math.PI / 2;

            screen(group, '0 PSI', 0.38, 0.25, 0, 0.3, 0.075);

            cylinder(group, 0.07, 0.07, 0.55, steel, 0, -0.22);
            break;
        }

        case 'mirror': {
            cylinder(group, 0.045, 0.045, 0.95, steel);
            handle(group, color, -0.35, 0.35);

            const mirror = cylinder(
                group, 0.22, 0.22, 0.04,
                steel, 0, 0.58
            );

            mirror.rotation.x = Math.PI / 2;
            break;
        }

        case 'brush': {
            handle(group, color, -0.3, 0.6);
            box(group, 0.28, 0.35, 0.12, dark, 0, 0.27);

            for (let x = 0; x < 5; x++) {
                for (let y = 0; y < 6; y++) {
                    box(group, 0.018, 0.018, 0.16, steel,
                        -0.1 + x * 0.05, 0.13 + y * 0.055, 0.12);
                }
            }
            break;
        }

        case 'funnel': {
            cylinder(group, 0.35, 0.08, 0.5, color, 0, 0.2);
            cylinder(group, 0.08, 0.055, 0.45, color, 0, -0.25);
            grip.set(0, 0, 0);
            break;
        }

        case 'puller': {
            cylinder(group, 0.055, 0.055, 1.1, steel);

            for (const side of [-1, 1]) {
                box(group, 0.12, 0.65, 0.12, steel, side * 0.27);
                box(group, 0.23, 0.1, 0.12, steel, side * 0.2, -0.35);
            }

            box(group, 0.65, 0.15, 0.16, color, 0, 0.35);
            break;
        }

        case 'grinder': {
            handle(group, color, -0.15, 0.75);

            const disc = cylinder(group, 0.3, 0.3, 0.055, dark, 0, 0.38);
            disc.rotation.x = Math.PI / 2;

            ring(group, 0.25, 0.035, steel, 0, 0.38, 0.04);
            break;
        }

        case 'pump': {
            box(group, 0.65, 0.5, 0.42, color);
            box(group, 0.73, 0.1, 0.48, dark, 0, -0.3);

            ring(group, 0.19, 0.045, rubber, 0, 0.37);

            cylinder(group, 0.08, 0.08, 0.23, steel, 0.25, 0.32);

            grip.set(0, 0.45, 0);
            rotation.set(0, 0, 0);
            break;
        }

        default:
            handle(group, color);
    }

    group.userData = { grip, rotation, tip };

    return group;
}

export class ToolManager {

    constructor(scene) {
        this.scene = scene;
        this.selected = null;
        this.object = null;
        this.dock = new THREE.Vector3(0, -0.1, 0.55);
    }

    select(id) {

        const tool = getTool(id);

        if (!tool) return null;

        this.clear();

        this.selected = tool;
        this.object = buildTool(tool);

        this.object.position.copy(this.dock);

        this.scene.add(this.object);

        return tool;
    }

    clear() {

        if (this.object) {

            this.object.removeFromParent();

            this.object.traverse(object => {
                object.geometry?.dispose();

                if (object.material?.map) {
                    object.material.map.dispose();
                    object.material.dispose();
                }
            });
        }

        this.object = null;
        this.selected = null;
    }

    release() {

        if (!this.object) return;

        this.scene.add(this.object);
        this.object.position.copy(this.dock);
        this.object.quaternion.identity();
    }

    setLight(enabled) {

        const beam = this.object?.getObjectByName('beam');

        if (!beam) return false;

        beam.visible = enabled;

        return true;
    }
}

export { catalog };
