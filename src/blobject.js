import * as THREE from 'three';
import {RenderPass} from "three/addons/postprocessing/RenderPass.js";
import {UnrealBloomPass} from "three/addons/postprocessing/UnrealBloomPass.js";
import {EffectComposer} from "three/addons/postprocessing/EffectComposer.js";
import {AfterimagePass} from "three/addons/postprocessing/AfterimagePass.js";
import {ShaderPass} from "three/addons/postprocessing/ShaderPass.js";
import {GammaCorrectionShader} from "three/addons/shaders/GammaCorrectionShader.js";
import {BleachBypassShader} from "three/addons/shaders/BleachBypassShader.js";
import {FilmPass} from "three/addons/postprocessing/FilmPass.js";
import {noise} from "./noise.js";
import {ColorCorrectionShader} from "three/addons/shaders/ColorCorrectionShader.js";
import {HueSaturationShader} from "three/addons/shaders/HueSaturationShader.js";

const BG_COLOR = new THREE.Color(0.6, 0.6, 0.6, 0);
const COLOR_A = new THREE.Color(231, 50, 8);
const COLOR_B = new THREE.Color(235, 139, 91);
const EMISSION_COLOR = 0xf3a469;
const params = {
    exposure: 0.4,
    bloomStrength: .5,
    bloomThreshold: 0.5,
    bloomRadius: 0.5
};
export default function renderBlob(props) {
    const renderer = new THREE.WebGLRenderer({canvas: props, antialias: true});
    renderer.setClearColor(BG_COLOR);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 3.5;

    // const geometry = new THREE.TorusGeometry(16, 6, 32, 100);
    // const geometry = new THREE.TetrahedronGeometry( 5, 24 );
    const geometry = new THREE.TorusGeometry(64, 24, 32, 100);
    const material = new THREE.MeshPhongMaterial({
        color: 0xf13804,
        specular: 0xffffff,
        shininess: 88.8,
        reflectivity: 1.,
        // emissive: 0xf13804
    });
    const sphere = new THREE.Mesh(geometry, buildTwistMaterial(1.2));
    scene.add(sphere);

    // Light the scene
    const godLight = new THREE.HemisphereLight(0xf13804, 0xffffff, 1.2);
    godLight.color.setHSL(.1, 1, 0.1);
    godLight.groundColor.setHSL(0.095, 1, 0.75);
    godLight.position.set(0, 50, 0);
    scene.add(godLight);


    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(0, 50, 100);
    scene.add(directionalLight);

    // Some SFX for eye pleasure
    const renderScene = new RenderPass(scene, camera);

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = params.bloomThreshold;
    bloomPass.strength = params.bloomStrength;
    bloomPass.radius = params.bloomRadius;

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // Some touch designer famous feedback effect
    const afterimagePass = new AfterimagePass(0.98);
    composer.addPass(afterimagePass);

    // go for grain
    const gammaCorrection = new ShaderPass(GammaCorrectionShader);
    const colorCorrection = new ShaderPass(ColorCorrectionShader);
    const hueSaturationShader = new ShaderPass(HueSaturationShader);
    const effectBleach = new ShaderPass(BleachBypassShader);
    effectBleach.uniforms['opacity'].value = 0.5;
    const effectFilm = new FilmPass(.6, 0, 0, false);
    hueSaturationShader.uniforms['hue'].value = -0.1;
    hueSaturationShader.uniforms['saturation'].value = .1;
    composer.addPass(effectBleach);
    composer.addPass(effectFilm);
    composer.addPass(hueSaturationShader);


    const update = () => {

        const time = performance.now() * 0.0002;
        let k = 1; // change 'k' value for more spikes
        const positions = sphere.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const v3 = new THREE.Vector3();
            v3.fromBufferAttribute(positions, i).setLength(k);
            // v3.normalize().multiplyScalar(1 + 0.4 * noise.perlin3(v3.x * k + time, v3.y * k, v3.z * k));
            let n = noise.perlin3(v3.x * k + time, v3.y * k + time, v3.z * 2 + time);
            v3.setLength(1 + 0.3 * n); // TODO: sizing here need some improvement
            positions.setXYZ(i, v3.x, v3.y, v3.z);
        }
        // positions.needsUpdate = true;
        sphere.geometry.attributes.position.needsUpdate = true;
        // sphere.geometry.computeVertexNormals();
    }

    window.addEventListener('resize', onWindowResize);

    function onWindowResize() {

        const width = window.innerWidth;
        const height = window.innerHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
        composer.setSize(width, height);

    }

    function animate() {
        const time = Date.now() * 0.0005;

        sphere.rotation.z = Math.sin(time * 0.3) * 2;
        sphere.rotation.x = Math.cos(time * 0.1) * 3.33;

        directionalLight.position.x = Math.sin(time * 0.8) * 100;
        directionalLight.position.y = Math.cos(time * 0.5) * 50;
        directionalLight.position.z = Math.cos(time * 0.8) * 100;


        hueSaturationShader.uniforms['hue'].value = Math.cos(time * 0.5) * 0.4;

        update();
        /* render scene and camera */
        render();
        composer.render();
        requestAnimationFrame(animate);
    }

    function render() {

        scene.traverse(function (child) {

            if (child.isMesh) {

                const shader = child.material.userData.shader;

                if (shader) {

                    shader.uniforms.time.value = performance.now() / 8000;

                }

            }

        });

        renderer.render(scene, camera);

    }

    function buildTwistMaterial(amount) {

        const material = new THREE.MeshPhongMaterial({
            color: 0xf13804,
            specular: 0xffffff,
            shininess: 88.8,
            reflectivity: 1.,
            // emissive: 0xf13804
        });
        material.onBeforeCompile = function (shader) {

            shader.uniforms.time = {value: 0};

            shader.vertexShader = 'uniform float time;\n' + shader.vertexShader;
            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                [
                    `float theta = sin( time + position.y ) / ${amount.toFixed(1)};`,
                    'float c = cos( theta );',
                    'float s = sin( theta );',
                    'mat3 m = mat3( c, 0, s, 0, 1, 0, -s, 0, c );',
                    'vec3 transformed = vec3( position ) * m;',
                    'vNormal = vNormal * m;'
                ].join('\n')
            );

            material.userData.shader = shader;

        };

        // Make sure WebGLRenderer doesnt reuse a single program

        material.customProgramCacheKey = function () {

            return amount;

        };

        return material;

    }


    requestAnimationFrame(animate);
}
