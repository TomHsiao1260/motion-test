import './style/main.css';
import Application from './javascript/Application.js';

window.application = new Application({
    $canvas: document.querySelector('.webgl'),
    $video: document.querySelector('.video')
});