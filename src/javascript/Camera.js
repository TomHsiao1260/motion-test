import * as THREE from 'three';

export default class Camera {
    constructor(_option) {
        this.time = _option.time;
        this.sizes = _option.sizes;
        this.renderer = _option.renderer;

        this.container = new THREE.Object3D();
        this.container.matrixAutoUpdate = false;

        this.setInstance();
    }

    setInstance() {
        const { width, height } = this.sizes.viewport;
        this.instance = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
        this.instance.position.set(0, -3, 15);
        this.instance.lookAt(new THREE.Vector3());
        this.container.add(this.instance);

        this.sizes.on('resize', () => {
            const { width, height } = this.sizes.viewport;
            this.instance.aspect = width / height;
            this.instance.updateProjectionMatrix();
        });
    }
}