import * as THREE from 'three';

import Controls from './Controls';
import Environment from './Environment';
import Role from './Role';

export default class World {
    constructor(_option) {
        this.time = _option.time;
        this.sizes = _option.sizes;
        this.camera = _option.camera;
        this.data = _option.data;

        this.container = new THREE.Object3D();
        this.container.matrixAutoUpdate = false;

        this.setControls();
        this.setEnvironment();
        this.setRole();
    }

    setControls() {
        this.controls = new Controls({
            time: this.time,
            sizes: this.sizes,
            camera: this.camera,
            data: this.data,
        });
    }

    setEnvironment() {
        this.environment = new Environment();
        this.environmentMap = this.environment.environmentMap;
    }

    setRole() {
        this.role = new Role({
            time: this.time,
            controls: this.controls,
            camera: this.camera,
            data: this.data,
            environmentMap: this.environmentMap,
        });

        this.container.add(this.role.container);
    }
}