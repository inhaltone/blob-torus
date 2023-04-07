import '../style.css'
import renderBlob from "./blobject.js";
import {onMounted} from "./hooks.js";
import './perlin.js';

document.querySelector('#app').innerHTML = `
 <canvas id="blob"></canvas>
`
onMounted(() => {
    renderBlob(document.querySelector('#blob'));
});
