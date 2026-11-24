
import * as THREE from 'three';

const V = (x = 0, y = 0, z = 0) =>
    new THREE.Vector3(x, y, z);

const UP = V(0, 1, 0);

const fabric = new THREE.MeshStandardMaterial({
    color: '#68737e',
    roughness: 0.94
});

const rubber = new THREE.MeshStandardMaterial({
    color: '#26313c',
    roughness: 0.8
});

const blue = new THREE.MeshStandardMaterial({
    color: '#176bd7',
    metalness: 0.25,
    roughness: 0.4
});

const board = new THREE.MeshStandardMaterial({
    color: '#276f5b',
    roughness: 0.5
});

const metal = new THREE.MeshStandardMaterial({
    color: '#c5cdd5',
    metalness: 0.8,
    roughness: 0.3
});

function addMesh(parent, geometry, material) {

    const object = new THREE.Mesh(geometry, material);

    object.castShadow = true;
    object.receiveShadow = true;

    parent.add(object);

    return object;
}

function sphere(parent, radius, material) {

    return addMesh(
        parent,
        new THREE.SphereGeometry(radius, 24, 16),
        material
    );
}

function box(parent, w, h, d, material) {

    return addMesh(
        parent,
        new THREE.BoxGeometry(w, h, d),
        material
    );
}

const chains = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, 16],
    [17, 18, 19, 20]
];

export class Glove {

    constructor(scene, id) {

        this.id = id;
        this.label = id === 0 ? 'Izquierda' : 'Derecha';
        this.side = id === 0 ? 1 : -1;

        this.root = new THREE.Group();

        scene.add(this.root);

        this.points = Array.from({ length: 21 }, () => V());
        this.targets = Array.from({ length: 21 }, () => V());

        this.positionTarget = V(
            id === 0 ? -1.55 : 1.55,
            -0.1,
            0
        );

        this.root.position.copy(this.positionTarget);

        this.grip = false;
        this.angle = 0;
        this.visible = true;

        this.palm = sphere(this.root, 1, fabric);
        this.padding = sphere(this.root, 1, rubber);

        this.cuff = box(
            this.root, 0.83, 0.34, 0.42, rubber
        );

        this.cuffStripe = box(
            this.root, 0.85, 0.09, 0.44, blue
        );

        this.electronics = new THREE.Group();

        this.root.add(this.electronics);

        box(this.electronics, 0.64, 0.45, 0.16, rubber);

        const pcb = box(
            this.electronics, 0.53, 0.34, 0.055, board
        );

        pcb.position.z = 0.1;

        const chip = box(
            this.electronics, 0.22, 0.18, 0.05, metal
        );

        chip.position.set(0, 0.04, 0.15);

        for (let i = 0; i < 8; i++) {

            const pin = box(
                this.electronics, 0.025, 0.05, 0.03, metal
            );

            pin.position.set(-0.21 + i * 0.06, -0.13, 0.15);
        }

        const led = sphere(this.electronics, 0.025,
            new THREE.MeshStandardMaterial({
                color: '#22c55e',
                emissive: '#22c55e',
                emissiveIntensity: 1.5
            })
        );

        led.position.set(0.2, 0.12, 0.16);

        this.joints = [];

        this.segments = [];

        const radii = [0.15, 0.135, 0.145, 0.135, 0.115];

        chains.forEach((chain, finger) => {

            chain.forEach((index, joint) => {

                const radius = radii[finger] * (1 - joint * 0.065);

                this.joints.push({
                    index,
                    object: sphere(this.root, radius, fabric)
                });
            });

            for (let i = 0; i < 3; i++) {

                const radius = radii[finger] * (1 - i * 0.08);

                const segment = new THREE.Group();

                this.root.add(segment);

                const body = addMesh(
                    segment,
                    new THREE.CapsuleGeometry(radius, 1, 8, 16),
                    fabric
                );

                const band = addMesh(
                    segment,
                    new THREE.CylinderGeometry(
                        radius * 1.06,
                        radius * 1.06,
                        0.075,
                        24
                    ),
                    blue
                );

                const sensor = box(
                    segment, radius * 1.3, 0.14, 0.035, rubber
                );

                sensor.position.z = radius;

                this.segments.push({
                    a: chain[i],
                    b: chain[i + 1],
                    radius,
                    segment,
                    body,
                    band
                });
            }
        });

        this.orientation = new THREE.Quaternion();
        this.normal = V(0, 0, 1);
        this.center = V();

        this.pose(false);

        this.points.forEach((point, index) =>
            point.copy(this.targets[index])
        );

        this.update(1);
    }

    pose(closed = false, angle = 0) {

        this.grip = closed;
        this.angle = angle;

        this.targets[0].set(0, -0.48, 0);

        const bases = [
            [-0.48, 0.05],
            [-0.43, 0.7],
            [-0.14, 0.84],
            [0.16, 0.78],
            [0.43, 0.62]
        ];

        const lengths = [
            [0.29, 0.23, 0.2],
            [0.38, 0.27, 0.21],
            [0.42, 0.29, 0.22],
            [0.38, 0.27, 0.2],
            [0.29, 0.21, 0.17]
        ];

        chains.forEach((chain, finger) => {

            let point = V(
                bases[finger][0] * this.side,
                bases[finger][1],
                0
            );

            this.targets[chain[0]].copy(point);

            for (let j = 0; j < 3; j++) {

                const bend = closed
                    ? [0.8, 1.65, 2.5][j]
                    : 0.04;

                const direction = V(
                    0,
                    Math.cos(bend),
                    -Math.sin(bend)
                );

                if (finger === 0) {

                    direction.set(
                        closed ? this.side * 0.6 : -this.side * 0.75,
                        0.55,
                        closed ? -0.55 : 0
                    ).normalize();
                }

                point = point.clone().addScaledVector(
                    direction, lengths[finger][j]
                );

                this.targets[chain[j + 1]].copy(point);
            }
        });

        for (const point of this.targets) {
            point.applyAxisAngle(V(0, 0, 1), angle);
        }
    }

    track(landmarks, worldLandmarks) {

        const source = worldLandmarks?.length === 21
            ? worldLandmarks
            : landmarks;

        const wrist = source[0];

        const distance = Math.hypot(
            source[9].x - wrist.x,
            source[9].y - wrist.y,
            source[9].z - wrist.z
        );

        const scale = 1.32 / Math.max(distance, 0.001);

        source.forEach((point, index) => {

            this.targets[index].set(
                -(point.x - wrist.x) * scale,
                -(point.y - wrist.y) * scale,
                -(point.z - wrist.z) * scale
            );
        });

        this.positionTarget.set(
            (0.5 - landmarks[0].x) * 5.8,
            (0.65 - landmarks[0].y) * 4.3 - 0.5,
            0.2
        );

        let curled = 0;

        for (const chain of chains.slice(1)) {

            const a = this.targets[chain[0]];
            const b = this.targets[chain[1]];
            const c = this.targets[chain[3]];

            const angle = a.clone().sub(b).angleTo(
                c.clone().sub(b)
            );

            if (angle < 2.15) curled++;
        }

        if (curled >= 3) this.grip = true;
        if (curled <= 1) this.grip = false;

        const axis = this.targets[9].clone()
            .sub(this.targets[0]);

        this.angle = Math.atan2(-axis.x, axis.y);

        this.setVisible(true);
    }

    setVisible(visible) {

        this.visible = visible;
        this.root.visible = visible;
    }

    update(delta) {

        const alpha = 1 - Math.exp(-28 * delta);

        this.root.position.lerp(this.positionTarget, alpha);

        this.points.forEach((point, index) =>
            point.lerp(this.targets[index], alpha)
        );

        const p = this.points;

        const y = p[9].clone().sub(p[0]).normalize();
        const x = p[17].clone().sub(p[5]).normalize();

        const z = x.clone().cross(y).normalize();

        x.copy(y.clone().cross(z).normalize());

        this.orientation.setFromRotationMatrix(
            new THREE.Matrix4().makeBasis(x, y, z)
        );

        this.normal.copy(z).multiplyScalar(this.side);

        const dorsal = this.orientation.clone();

        if (this.side < 0) {

            dorsal.multiply(
                new THREE.Quaternion().setFromAxisAngle(
                    UP, Math.PI
                )
            );
        }

        this.center.copy(p[0]).lerp(p[9], 0.57);

        const width = p[5].distanceTo(p[17]);
        const height = p[0].distanceTo(p[9]);

        this.palm.position.copy(this.center);

        this.palm.scale.set(
            Math.max(0.36, width * 0.78),
            Math.max(0.45, height * 0.64),
            0.24
        );

        this.palm.quaternion.copy(this.orientation);

        this.padding.position.copy(this.center)
            .addScaledVector(this.normal, -0.19);

        this.padding.scale.set(
            width * 0.65,
            height * 0.48,
            0.12
        );

        this.padding.quaternion.copy(this.orientation);

        this.cuff.position.copy(p[0])
            .addScaledVector(y, -0.13);

        this.cuff.quaternion.copy(dorsal);

        this.cuffStripe.position.copy(this.cuff.position)
            .addScaledVector(y, -0.06);

        this.cuffStripe.quaternion.copy(dorsal);

        this.electronics.position.copy(p[0])
            .addScaledVector(y, 0.18)
            .addScaledVector(this.normal, 0.29);

        this.electronics.quaternion.copy(dorsal);

        for (const joint of this.joints) {

            joint.object.position.copy(p[joint.index]);
        }

        for (const item of this.segments) {

            const a = p[item.a];
            const b = p[item.b];

            const direction = b.clone().sub(a);
            const length = direction.length();

            item.segment.position.copy(a).lerp(b, 0.5);

            item.segment.quaternion.setFromUnitVectors(
                UP, direction.normalize()
            );

            item.body.scale.y =
                (length + item.radius) / (1 + 2 * item.radius);

            item.band.position.y = length * 0.25;
        }

        this.dorsalOrientation = dorsal;
    }

    getState() {

        return {
            id: this.id,
            label: this.label,
            visible: this.visible,
            grip: this.grip,
            angle: this.angle,

            position: this.center.clone()
                .addScaledVector(this.normal, -0.3)
                .add(this.root.position),

            quaternion: this.dorsalOrientation.clone()
        };
    }
}
