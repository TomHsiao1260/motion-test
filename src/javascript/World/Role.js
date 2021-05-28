import * as THREE from 'three';
import gsap from 'gsap';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import model from '../../models/role/model.glb';

export default class Role {
    constructor(_option) {
        this.time = _option.time;
        this.controls = _option.controls;
        this.camera = _option.camera;
        this.data = _option.data;
        this.environmentMap = _option.environmentMap;

        this.container = new THREE.Object3D();
        this.container.matrixAutoUpdate = false;

        this.setRole();
    }

    async setRole() {
        this.gltfLoader = new GLTFLoader();
        this.instance = await new Promise(resolve => {
            this.gltfLoader.load( model, (gltf) => resolve(gltf.scene) );
        });

        this.instance.scale.set(3, 3, 3);
        this.container.add(this.instance);

        this.setTraverse();
        this.setFaceDirection();
    }

    setTraverse() {
        this.instance.traverse( (child) => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                child.material.envMap = this.environmentMap;
                // child.material.envMapIntensity = 0.7;
                child.material.envMapIntensity = 0;

                if (child.name === 'mouth') this.mouth = child;  
                if (child.name === 'head') this.head = child;
            }
        })
        this.mouth.visible = false;

        this.faceContainer = new THREE.Object3D();
        const children = [...this.instance.children];
        const face = [];

        face.push('head', 'lips', 'mouth', 'scarf');
        face.push('leftCheek', 'leftEye', 'leftEyeSpot');
        face.push('rightCheek', 'rightEye', 'rightEyeSpot');

        children.forEach((child) => { if (face.includes(child.name)) this.faceContainer.add(child) });
        this.instance.add( this.faceContainer );
    }

    setFaceDirection() {
        this.time.on('tick', () => {
            const raycaster = this.controls.raycaster;
            const rayDirection = raycaster.ray.direction;
            const ray = rayDirection.normalize().multiplyScalar(10);
            const intersects = raycaster.intersectObjects([ this.head ]);

            this.lookPoint = this.camera.instance.position.clone().add(ray);
            this.faceContainer.lookAt(this.lookPoint);

            const landmarks = this.data.landmarks;

            if (landmarks.length && landmarks[0].hasOwnProperty('angles')) {
                const frame = this.data.currentFrame;
                const frame_ = frame > 0 ? frame - 1 : 0;

                const time = landmarks[ frame ].time;
                const time_ = landmarks[ frame_ ].time;

                let duration = (time - time_) / 1000;
                duration = duration > 0 ? duration : 0.2;

                const base = this.faceContainer.rotation.z; 
                if (this.hasOwnProperty('rotateZ')) this.faceContainer.rotation.z = this.rotateZ;
                this.rotateZ = base - landmarks[frame].angles.rotateZ;
                if (this.hasOwnProperty('rotateZ') && this.rotateZ > 0) {
                    this.rotateZ -= 2 * Math.PI;
                };

                // gsap.to(this.faceContainer.rotation, { duration, z: this.rotateZ });
                this.faceContainer.rotation.z = this.rotateZ;

                this.mouth.visible = landmarks[frame].angles.mouthOpen;
            };
        });
    }
}