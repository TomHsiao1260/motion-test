import * as THREE from 'three';
import gsap from 'gsap';

export default class Controls {
    constructor(_option) {
        this.time = _option.time;
        this.sizes = _option.sizes;
        this.camera = _option.camera;
        this.data = _option.data;

        this.setMouse();
        this.setKeyboard();
    }

    setMouse() {
        this.mouse = new THREE.Vector2();

        window.addEventListener('mousemove', (event) => {
            this.mouse.x = event.clientX / this.sizes.width * 2 - 1;
            this.mouse.y = - (event.clientY / this.sizes.height) * 2 + 1;
        });
        
        window.addEventListener('touchmove', (event) => {
            this.mouse.x = event.touches[0].clientX / this.sizes.width * 2 - 1;
            this.mouse.y = - (event.touches[0].clientY / this.sizes.height) * 2 + 1;
        });

        this.time.on('tick', () => {
            this.raycaster = new THREE.Raycaster();
            this.raycaster.setFromCamera(this.mouse, this.camera.instance);
        });

        this.time.on('plot', () => {
            const frame = this.data.currentFrame;
            const frame_ = frame > 0 ? frame - 1 : 0;

            const time = this.data.landmarks[ frame ].time;
            const time_ = this.data.landmarks[ frame_ ].time;

            let duration = (time - time_) / 1000;
            duration = duration > 0 ? duration : 0.2;

            const mouseX = this.data.landmarks[ frame ].angles.mouseX;
            const mouseY = this.data.landmarks[ frame ].angles.mouseY;

            // gsap.to(this.mouse, {duration, x: mouseX, y: mouseY});
            this.mouse.x = mouseX;
            // this.mouse.y = mouseY;
            this.mouse.y = 0;
        });
    }

    setKeyboard() {
        window.addEventListener("keypress", async (e) => {
            if (e.code === 'Space' && this.data.plot ) {
                this.time.trigger('plot');

                if (this.data.currentFrame === this.data.landmarks.length - 1) {
                    this.data.plot = false;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    this.data.plot = true;
                }  
            }
        });
    }
}