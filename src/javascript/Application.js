import * as THREE from 'three';

import Time from './Utils/Time';
import Sizes from './Utils/Sizes';

import Camera from './Camera';
import Light from './Light';
import World from './World';
import FaceAPI from './FaceAPI';

export default class Application {
    constructor(_option) {
        this.$canvas = _option.$canvas;
        this.$video = _option.$video;

        this.time = new Time();
        this.sizes = new Sizes();

        this.setFaceAPI();
        this.setRenderer();
        this.setCamera();
        this.setLight();
        this.setWorld();
    }

    setFaceAPI() {
        this.data = {};
        this.data.filming = false;
        this.data.plot = true;
        this.data.landmarks = [];
        this.data.currentFrame = 0;

        this.faceapi = new FaceAPI({
            time: this.time,
            video: this.$video,
            data: this.data,
        });
    }

    setRenderer() {
        this.scene = new THREE.Scene();

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.$canvas,
        });

        const { width, height } = this.sizes.viewport;
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        this.renderer.physicallyCorrectLights = true
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping
        this.renderer.toneMappingExposure = 3
        this.renderer.outputEncoding = THREE.sRGBEncoding

        this.sizes.on('resize', () => {
            const { width, height } = this.sizes.viewport;
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        });
    }

    setCamera() {
        this.camera = new Camera({
            time: this.time,
            sizes: this.sizes,
            renderer: this.renderer,
        });

        this.scene.add(this.camera.container);

        this.time.on('tick', () => {
            if (!this.data.filming) this.renderer.render(this.scene, this.camera.instance);
        });
    }

    setLight() {
        this.light = new Light();
        this.scene.add(this.light.container);
    }

    setWorld() {
        this.world = new World({
            time: this.time,
            sizes: this.sizes,
            camera: this.camera,
            data: this.data,
        });

        this.scene.add(this.world.container);
        this.scene.background = this.world.environmentMap;
    }
}