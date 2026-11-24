
import * as THREE from 'three';

export class Simulation {

    constructor(scene) {

        this.group = new THREE.Group();

        scene.add(this.group);

        this.group.position.set(0, -1.05, -0.45);

        const steel = new THREE.MeshStandardMaterial({
            color: '#aab7c4',
            metalness: 0.75,
            roughness: 0.35
        });

        const baseMaterial = new THREE.MeshStandardMaterial({
            color: '#34495e',
            roughness: 0.7
        });

        const base = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 0.25, 0.85),
            baseMaterial
        );

        base.castShadow = true;
        base.receiveShadow = true;

        this.group.add(base);

        const plate = new THREE.Mesh(
            new THREE.BoxGeometry(1.35, 0.65, 0.2),
            steel
        );

        plate.position.set(0, 0.3, 0);

        plate.castShadow = true;

        this.group.add(plate);

        this.bolt = new THREE.Group();

        this.group.add(this.bolt);

        this.bolt.position.set(0, 0.34, 0.22);

        const head = new THREE.Mesh(
            new THREE.CylinderGeometry(0.14, 0.14, 0.12, 6),
            steel
        );

        head.rotation.x = Math.PI / 2;

        this.bolt.add(head);

        const shaft = new THREE.Mesh(
            new THREE.CylinderGeometry(0.065, 0.065, 0.5, 24),
            steel
        );

        shaft.rotation.x = Math.PI / 2;
        shaft.position.z = -0.25;

        this.bolt.add(shaft);

        this.target = new THREE.Mesh(
            new THREE.TorusGeometry(0.22, 0.012, 8, 48),
            new THREE.MeshBasicMaterial({
                color: '#2563eb',
                transparent: true,
                opacity: 0.75
            })
        );

        this.target.position.set(0, 0.34, 0.3);

        this.group.add(this.target);

        this.initialPosition = this.bolt.position.clone();
    }

    getTarget() {

        return this.bolt.getWorldPosition(
            new THREE.Vector3()
        );
    }

    setProgress(progress) {

        this.bolt.position.copy(this.initialPosition);

        this.bolt.position.z += progress * 0.003;

        this.target.material.color.set(
            progress >= 100 ? '#16a34a' : '#2563eb'
        );
    }

    reset() {

        this.bolt.position.copy(this.initialPosition);
        this.bolt.rotation.set(0, 0, 0);

        this.setProgress(0);
    }
}
