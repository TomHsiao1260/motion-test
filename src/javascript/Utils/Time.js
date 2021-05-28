import EventEmitter from './EventEmitter';
import Stats from 'stats.js';

export default class Time extends EventEmitter {
    constructor() {
        super();

        this.start = Date.now();
        this.current = this.start;
        this.elapsed = 0;
        this.delta = 16;

        this.stats = new Stats();
        this.stats.showPanel(0);
        document.body.appendChild(this.stats.dom);

        this.tick = this.tick.bind(this);
        this.tick();
    }

    tick() {
        this.ticker = window.requestAnimationFrame(this.tick);

        this.stats.begin();
        const current = Date.now();

        this.delta = current - this.current;
        this.elapsed = this.current - this.start;
        this.current = current;

        if (this.delta > 60) {
            this.delta = 60;
        }

        this.trigger('tick');
        this.stats.end();
    }

    stop() {
        window.cancelAnimationFrame(this.ticker);
    }
}
