import * as THREE from 'three';


const BG_COLOR = new THREE.Color(0.5, 0.5, 0.5, 0);

export default function renderBlob(props) {
    const renderer = new THREE.WebGLRenderer({canvas: props, antialias: true});
    renderer.setClearColor(BG_COLOR);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const geometry = new THREE.TorusGeometry(15, 6, 16, 100);
    const material = new THREE.MeshBasicMaterial({color: 0xffff00});
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    const update = () => {

        const time = performance.now() * 0.001;
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

    function animate() {
        // sphere.rotation.x += 0.01;
        // sphere.rotation.y += 0.01;

        update();
        /* render scene and camera */
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }


    requestAnimationFrame(animate);
}
