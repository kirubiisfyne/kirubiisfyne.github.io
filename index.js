import * as THREE from "https://unpkg.com/three/build/three.module.js";
import { PointerLockControls } from "https://unpkg.com/three/examples/jsm/controls/PointerLockControls.js";
import { EffectComposer } from "https://unpkg.com/three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://unpkg.com/three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "https://unpkg.com/three/examples/jsm/postprocessing/ShaderPass.js";

//#region Main Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.shadowMap.enabled = false;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Global Shader
const globalShader = {
    uniforms: {
        tDiffuse: { value: null },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        pixelSize: { value: 4.0 }, // Set pixel size
    },
    vertexShader: `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
    fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float pixelSize;

    varying vec2 vUv;

    void main() {
        vec2 dxy = pixelSize / resolution;
        vec2 coord = dxy * floor(vUv / dxy);
        gl_FragColor = texture2D(tDiffuse, coord);
    }
    `,
};

// Post-processing setup
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const shaderPass = new ShaderPass(globalShader);
composer.addPass(shaderPass);

// Camera Listener Setup
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    shaderPass.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
});

// Audio Setup
const listener = new THREE.AudioListener();
camera.add( listener );

const Sfx_wind = new THREE.Audio(listener);
const Sfx_step = new THREE.Audio(listener);

const audioLoader = new THREE.AudioLoader();

audioLoader.load( "../Audio/wind_01.wav", function( buffer ) {
	Sfx_wind.setBuffer(buffer);
	Sfx_wind.setLoop(true);
	Sfx_wind.setVolume(5);
	Sfx_wind.play();
});

audioLoader.load( "../Audio/stepstone_01.wav", function( buffer ) {
    Sfx_step.setBuffer(buffer);
    Sfx_step.setLoop(true);
    Sfx_step.setVolume(1);
})


//Movement Listener
window.addEventListener("keydown", (event) => {
    if (event.key === "w") moveDirection.forward = 1;
    if (event.key === "s") moveDirection.forward = -1;
    if (event.key === "a") moveDirection.right = -1;
    if (event.key === "d") moveDirection.right = 1;
    //Play Step Sound
    if (event.key === "w" || event.key === "s" || event.key === "a" || event.key === "d") Sfx_step.play();
});
window.addEventListener("keyup", (event) => {
    if (event.key === "w" || event.key === "s") moveDirection.forward = 0;
    if (event.key === "a" || event.key === "d") moveDirection.right = 0;
    //Stop Step Sound
    if (event.key === "w" || event.key === "s" || event.key === "a" || event.key === "d") Sfx_step.stop();
});

//Camera Controls Listener
const controls = new PointerLockControls(camera, document.body);
document.addEventListener('click', () => {
    controls.lock();
});
controls.addEventListener('lock', () => {
    console.log('Pointer locked');
});
controls.addEventListener('unlock', () => {
    console.log('Pointer unlocked');
});

function updateCamera(delta) {
    if (controls.isLocked) {
        console.log("Camera Position:", camera.position);
        console.log("Camera Rotation:", camera.rotation);
    }
}
//#endregion

//#region Objects Setup
//Lighting
const ambientLight = new THREE.AmbientLight(0xd18762, 1);
const directionalLight = new THREE.DirectionalLight(0xe1bfad, 1.5);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;

//#region Dust Particles
const particleCount = 1000; // Set particle count
const particleGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const velocities = new Float32Array(particleCount * 3);

// Initialize particles
for (let i = 0; i < particleCount; i++) {
    // Set each particle position randomly
    positions[i * 3] = (Math.random() - 0.5) * 100;
    positions[i * 3 + 1] = Math.random() * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 100;

    // Set each particle velocity randomly
    velocities[i * 3] = (Math.random() - 0.5) * 1.25;
    velocities[i * 3 + 1] = Math.random() * 0.1;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 1.25;
}

particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

// Particle material
const particleMaterial = new THREE.PointsMaterial({
    color: 0xe1bfad,
    size: 0.2,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
});

// Create particle system
const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particleSystem);

// Update particles in animation loop
function updateParticles(delta) {
    const positions = particleGeometry.attributes.position.array;
    const velocities = particleGeometry.attributes.velocity.array;

    for (let i = 0; i < particleCount; i++) {
        // Update position
        positions[i * 3] += velocities[i * 3] * delta;
        positions[i * 3 + 1] += velocities[i * 3 + 1] * delta;
        positions[i * 3 + 2] += velocities[i * 3 + 2] * delta;

        // Reset particle if goes out of bounds
        if (positions[i * 3 + 1] < 0 || positions[i * 3 + 1] > 20) {
            positions[i * 3] = (Math.random() - 0.5) * 50;
            positions[i * 3 + 1] = Math.random() * 20;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 50;

            velocities[i * 3] = (Math.random() - 0.5) * 0.1;
            velocities[i * 3 + 1] = Math.random() * 0.1;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
        }
    }

    // Update geometry
    particleGeometry.attributes.position.needsUpdate = true;
}
//#endregion

//Texture
const T_skybox = new THREE.CubeTextureLoader().load([
    "../Textures/Skybox/xp_skybox_01.png", // Positve X
    "../Textures/Skybox/xn_skybox_01.png", // Negative x
    "../Textures/Skybox/yp_skybox_01.png", // Positve y
    "../Textures/Skybox/yp_skybox_01.png", // Negative y
    "../Textures/Skybox/zp_skybox_01.png", // Positve z
    "../Textures/Skybox/zn_skybox_01.png" // Negative z
]);
    T_skybox.magFilter = THREE.NearestFilter;
const T_ground = new THREE.TextureLoader().load("../Textures/ground_01.png");
    T_ground.magFilter = THREE.NearestFilter;
//Building Textures
const T_building_0 = new THREE.TextureLoader().load("../Textures/building_01.jpg");
const T_building_1 = new THREE.TextureLoader().load("../Textures/building_02.jpg");
const T_building_2 = new THREE.TextureLoader().load("../Textures/building_03.jpg");
const T_building_3 = new THREE.TextureLoader().load("../Textures/building_04.jpg");
const T_building_4 = new THREE.TextureLoader().load("../Textures/building_05.jpg");
const T_building_5 = new THREE.TextureLoader().load("../Textures/building_06.jpg");
const T_building_6 = new THREE.TextureLoader().load("../Textures/building_07.jpg");
const T_building_7 = new THREE.TextureLoader().load("../Textures/building_08.jpg");
const T_building_8 = new THREE.TextureLoader().load("../Textures/building_09.jpg");
const T_building_9 = new THREE.TextureLoader().load("../Textures/building_10.jpg");
const T_building_10 = new THREE.TextureLoader().load("../Textures/building_11.jpg");

//Roof Texture
const T_roof = new THREE.TextureLoader().load("../Textures/roof_01.png");

//Material
const Mt_ground = new THREE.MeshStandardMaterial({
    map: T_ground
});
const Mt_invisible = new THREE.MeshBasicMaterial({
    color: 0x000000,
    opacity: 0,
    transparent: true
});

//Geometry
const G_character = new THREE.BoxGeometry(1, 2, 1);
const G_ground = new THREE.PlaneGeometry(100, 100);

//Mesh
const ground = new THREE.Mesh(G_ground, Mt_ground);
    ground.receiveShadow = true;
    ground.rotation.x = -Math.PI / 2;
const character = new THREE.Mesh(G_character, Mt_invisible);
    character.castShadow = false;
    character.position.set(0, 1, 50);
    //Attach Camera
    camera.position.set(0, 1.5, 0);
    character.add(camera);
//#endregion

//#region Skyscrapers

// Set cube texture for skyscrapers
function setUV(texture, x, y) {
    let clonedTexture = texture.clone();
    clonedTexture.magFilter = THREE.NearestFilter;
    clonedTexture.wrapS = THREE.RepeatWrapping;
    clonedTexture.wrapT = THREE.RepeatWrapping;
    clonedTexture.repeat.set(x / 512 * 30, (y / 512) * 30);
    clonedTexture.needsUpdate = true;
    return clonedTexture;
}

// Skyscraper builder function
function createSkyscraper(width, height, depth, posX, posZ, rotY, texture) {
    //Building Material
    const bodyMaterial = [
        new THREE.MeshStandardMaterial({map: setUV(texture[0], depth, height)}),
        new THREE.MeshStandardMaterial({map: setUV(texture[0], depth, height)}),
        new THREE.MeshStandardMaterial({map: setUV(texture[0], depth, height)}),
        new THREE.MeshStandardMaterial({map: setUV(texture[0], depth, height)}),
        new THREE.MeshStandardMaterial({map: setUV(texture[0], width, height)}),
        new THREE.MeshStandardMaterial({map: setUV(texture[0], width, height)})
    ];

    //Building Body
    const G_body = new THREE.BoxGeometry(width, height, depth);
    const body = new THREE.Mesh(G_body, bodyMaterial);
    body.position.set(posX, height / 2, posZ);
    body.rotation.y = rotY;
    body.castShadow = true;
    body.receiveShadow = true;

    const roofMaterial = [
        new THREE.MeshStandardMaterial({map: setUV(texture[1], depth, 1.5)}),
        new THREE.MeshStandardMaterial({map: setUV(texture[1], depth, 1.5)}),
        new THREE.MeshStandardMaterial({map: setUV(texture[1], depth, 1.5)}),
        new THREE.MeshStandardMaterial({map: setUV(texture[1], depth, 1.5)}),
        new THREE.MeshStandardMaterial({map: setUV(texture[1], width, 1.5)}),
        new THREE.MeshStandardMaterial({map: setUV(texture[1], width, 1.5)})
    ];

    //Building Roof
    const G_roof = new THREE.BoxGeometry((width + 1), 1.5, (depth + 1));
    const roof = new THREE.Mesh(G_roof, roofMaterial);
    roof.position.set(posX, height, posZ);
    roof.rotation.y = rotY;
    roof.castShadow = true;
    roof.receiveShadow = true;

    //Grouping
    const skyscraper = new THREE.Group();
    skyscraper.add(body);
    skyscraper.add(roof);

    scene.add(skyscraper);
}
//#endregion

// Movement controls
let moveDirection = { forward: 0, right: 0 };

function updateCharacterPosition(delta) {
    const speed = 5; // Movement speed
    const forwardVector = new THREE.Vector3();
    camera.getWorldDirection(forwardVector);
    forwardVector.y = 0;
    forwardVector.normalize();

    const rightVector = new THREE.Vector3();
    rightVector.crossVectors(camera.up, forwardVector).normalize();

    // Apply movement
    const forwardMovement = forwardVector.multiplyScalar(moveDirection.forward * speed * delta);
    const rightMovement = rightVector.multiplyScalar(moveDirection.right * -speed * delta);

    const movement = new THREE.Vector3();
    movement.add(forwardMovement);
    movement.add(rightMovement);

    character.position.add(movement);
}
//#endregion

//#region Scene
scene.background = T_skybox;
scene.fog = new THREE.FogExp2( 0x903000, 0.075);

// Right side
createSkyscraper(10, 50, 20, 15, 40, 0, [T_building_1, T_roof]);
createSkyscraper(15, 80, 20, 20, 25, 0, [T_building_6, T_roof]);
createSkyscraper(20, 40, 25, 20, 15, 0, [T_building_5, T_roof]);
createSkyscraper(20, 70, 25, 25, -10, 0, [T_building_10, T_roof]);
createSkyscraper(25, 50, 10, 25, -25, 0, [T_building_2, T_roof]);
createSkyscraper(15, 40, 20, 30, -40, 0, [T_building_7, T_roof]);

// Left side
createSkyscraper(15, 60, 20, -15, -40, 0, [T_building_9, T_roof]);
createSkyscraper(25, 70, 20, -25, -25, 0, [T_building_3, T_roof]);
createSkyscraper(20, 40, 25, -25, -15, 0, [T_building_8, T_roof]);
createSkyscraper(25, 75, 25, -25, 10, 0, [T_building_0, T_roof]);
createSkyscraper(15, 40, 10, -25, 25, 0, [T_building_4, T_roof]);
createSkyscraper(25, 80, 20, -30, 40, 0, [T_building_5, T_roof]);

scene.add(character);
scene.add(directionalLight);
scene.add(ambientLight);
scene.add(ground);
//#endregion
//#region Render loop
const clock = new THREE.Clock();
function animate() {
    const delta = clock.getDelta();
    updateCamera(delta)
    updateCharacterPosition(delta);
    updateParticles(delta);

    requestAnimationFrame(animate);
    composer.render();
}
animate();
//#endregion