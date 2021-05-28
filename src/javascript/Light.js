import * as THREE from 'three';

export default class Light {
    constructor() {
        this.container = new THREE.Object3D();
        this.container.matrixAutoUpdate = false;

        this.setInstance();
    }

    setInstance() {
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);

        this.directionalLight.position.set(5, 5, 5);

        this.container.add(this.ambientLight);
        this.container.add(this.directionalLight);
    }
}