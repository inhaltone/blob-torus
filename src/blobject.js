import * as THREE from 'three';
import {RenderPass} from "three/addons/postprocessing/RenderPass.js";
import {UnrealBloomPass} from "three/addons/postprocessing/UnrealBloomPass.js";
import {EffectComposer} from "three/addons/postprocessing/EffectComposer.js";
import {AfterimagePass} from "three/addons/postprocessing/AfterimagePass.js";
import {ShaderPass} from "three/addons/postprocessing/ShaderPass.js";
import {GammaCorrectionShader} from "three/addons/shaders/GammaCorrectionShader.js";
import {BleachBypassShader} from "three/addons/shaders/BleachBypassShader.js";
import {FilmPass} from "three/addons/postprocessing/FilmPass.js";

const BG_COLOR = new THREE.Color(1, 1, 1, 0);
const COLOR_A = new THREE.Color(231, 50, 8);
const COLOR_B = new THREE.Color(235, 139, 91);
const EMISSION_COLOR = 0xf3a469;
const params = {
    exposure: 0.05,
    bloomStrength: .1,
    bloomThreshold: 0.9,
    bloomRadius: 2
};
export default function renderBlob(props) {
    const renderer = new THREE.WebGLRenderer({canvas: props, antialias: true});
    renderer.setClearColor(BG_COLOR);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 3.5;

    const geometry = new THREE.TorusGeometry(15, 6, 16, 100);
    const material = new THREE.MeshPhongMaterial({
        color: 0xf13804,
        specular: 0xf8f8f7,
        shininess: 88.8,
        reflectivity: 1,
        emissive: 0xe43200
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Light the scene
    const godLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1.8);
    godLight.color.setHSL(0.65, 1, 0.1);
    godLight.groundColor.setHSL(0.095, 1, 0.75);
    godLight.position.set(0, 50, 0);
    scene.add(godLight);

    const ambientLight = new THREE.AmbientLight(0xdfe6e9, .2);
    ambientLight.castShadow = true;
    scene.add(ambientLight);

    // Some SFX for eye pleasure
    const renderScene = new RenderPass( scene, camera );

    const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
    bloomPass.threshold = params.bloomThreshold;
    bloomPass.strength = params.bloomStrength;
    bloomPass.radius = params.bloomRadius;

    const composer = new EffectComposer( renderer );
    composer.addPass( renderScene );
    composer.addPass( bloomPass );

    // Some touch designer famous feedback effect
    const afterimagePass = new AfterimagePass();
    composer.addPass(afterimagePass);

    // go for grain
    const gammaCorrection = new ShaderPass(GammaCorrectionShader);
    const effectBleach = new ShaderPass( BleachBypassShader );
    // effectBleach.uniforms[ 'opacity' ].value = 0.15;
    const effectFilm = new FilmPass( .2, 0.001, 720, false );
    composer.addPass(gammaCorrection);
    // composer.addPass(effectBleach);
    composer.addPass(effectFilm);

    const update = () => {

        const time = performance.now() * 0.0002;
        // change 'k' value for more spikes
        let k = 1;
        const positions = sphere.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const v3 = new THREE.Vector3();
            v3.fromBufferAttribute(positions, i).setLength(k);
            // v3.normalize().multiplyScalar(1 + 0.4 * noise.perlin3(v3.x * k + time, v3.y * k, v3.z * k));
            let n = noise.perlin3(v3.x * k + time, v3.y * k + time, v3.z);
            v3.setLength(1 + 0.3 * n);
            positions.setXYZ(i, v3.x, v3.y, v3.z);
        }
        // positions.needsUpdate = true;
        sphere.geometry.attributes.position.needsUpdate = true;
        // sphere.geometry.computeVertexNormals();
    }

    window.addEventListener( 'resize', onWindowResize );

    function onWindowResize() {

        const width = window.innerWidth;
        const height = window.innerHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize( width, height );
        composer.setSize( width, height );

    }

    function animate() {
        // sphere.rotation.x += 0.01;
        // sphere.rotation.y += 0.01;
        sphere.rotation.z += 0.005;

        update();
        /* render scene and camera */
        renderer.render(scene, camera);
        composer.render();
        requestAnimationFrame(animate);
    }


    requestAnimationFrame(animate);
}
