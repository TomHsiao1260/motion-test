import * as faceapi from 'face-api.js';
import Landmark from './Landmark';

export default class FaceAPI {
    constructor(_option) {
        this.time = _option.time;
        this.video = _option.video;
        this.data = _option.data;

        this.size = this.displaySize(this.video);

        this.start();
    }

    async start() {
        await this.setModel();
        await this.setup();
        await this.filming();
        await this.stop();
        await this.setLandmark();
    }

    setModel() {
        return Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('/models-cnn'),
            faceapi.nets.faceLandmark68Net.loadFromUri('/models-cnn'),
        ]);
    }

    setup() {
        navigator.mediaDevices.getUserMedia({ video: {} })
            .then(stream => this.video.srcObject = stream )
            .catch(err => console.error(err) );

        return new Promise( resolve => {      
            this.video.addEventListener('play', () => {
                this.data.filming = true;

                this.canvas = faceapi.createCanvasFromMedia(this.video);
                this.canvas.className = 'landmarks';
                document.body.append(this.canvas);
        
                const { width, height } = this.size;
                faceapi.matchDimensions(this.canvas, { width, height });

                resolve();
            });
        });
    }

    filming() {
        return new Promise( resolve => { 
            this.timer = setInterval(() => this.tick( resolve ), 100);
        });
    }

    async stop() {
        clearInterval(this.timer);

        const tracks = this.video.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        this.data.filming = false;
        this.video.srcObject = null;

        await new Promise( resolve => setTimeout(resolve, 100));
        this.canvas.getContext('2d').clearRect(0, 0, this.size.width, this.size.height);

        return Promise.resolve();
    }

    setLandmark() {
        this.landmark = new Landmark({
            canvas: this.canvas,
            landmarks: this.data.landmarks,
        });

        this.time.on('plot', () => {
            this.data.currentFrame += 1;
            this.data.currentFrame %= this.landmark.landmarks.length;
            this.landmark.plot( this.data.currentFrame );
        });

        return Promise.resolve();
    }

    async tick( resolve ) {
        if (!this.data.filming) return;
        if (this.currentTime > 10000) {
            resolve();
            return;
        }

        this.option = new faceapi.TinyFaceDetectorOptions();
        this.detections = await faceapi.detectAllFaces(this.video, this.option).withFaceLandmarks();

        if (!this.detections.length) return;
        if (this.detections[0].hasOwnProperty('landmarks')) {
            if (!this.data.landmarks.length) this.startTime = this.time.elapsed;
            this.currentTime = this.time.elapsed - this.startTime;

            this.setData();
            this.plot();
        }
    }

    setData() {
        const data = {};
        data.positions = this.detections[0].landmarks._positions;
        data.time = this.currentTime;

        this.data.landmarks.push(data);
    }

    plot() {
        const resizedDetections = faceapi.resizeResults(this.detections, this.size);
        this.canvas.getContext('2d').clearRect(0, 0, this.size.width, this.size.height);

        faceapi.draw.drawDetections(this.canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(this.canvas, resizedDetections);
    }

    displaySize() {
        const style = window.getComputedStyle(this.video);
        const width_ = style.getPropertyValue('width');
        const height_ = style.getPropertyValue('height');
        const width = parseInt(width_.split('px')[0]);
        const height = parseInt(height_.split('px')[0]);

        return { width, height }
    }
}