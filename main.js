import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { vertexShader } from './shaders/vertex.glsl.js';
import { fragmentShaderX, fragmentShaderY, fragmentShaderZ } from './shaders/fragment.glsl.js';
import * as dat from 'dat.gui';
import { loadDicomSeries } from './loadDicomSeries.js';

// Создаем сцену
const scene = new THREE.Scene();

// Создаем камеру
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Создаем рендерер
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Добавляем input для загрузки файла
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.className = 'file-input';
fileInput.multiple = true; // Позволяет выбирать несколько файлов
// fileInput.webkitdirectory = true; // Позволяет выбирать директорию (только для Chrome)
document.body.appendChild(fileInput);

// Обработчик выбора файлов
fileInput.addEventListener('change', async (event) => {
    const fileList = event.target.files;
    const { nx, ny, nz, data, hx, hy, hz, p0, m, b, xAxis, yAxis, windowWidth, windowCenter } =
        await loadDicomSeries(fileList);

    for (let i = 0; i < data.length; i++) {
        data[i] = Math.round(data[i] * m + b);
    }

    const size = nx * ny * nz;

    const HUMin = windowCenter - windowWidth / 2;
    const HUMax = windowCenter + windowWidth / 2;

    const texture = new THREE.Data3DTexture(data, nx, ny, nz);
    texture.format = THREE.RedIntegerFormat;
    texture.internalFormat = 'R16I';
    texture.type = THREE.ShortType;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.unpackAlignment = 1;
    texture.needsUpdate = true;

    let sliceX = Math.floor(nx / 2);
    let sliceY = Math.floor(ny / 2);
    let sliceZ = Math.floor(nz / 2);

    const textureWidth = nx;
    const textureHeight = ny;
    const textureDepth = nz;

    // Создаем материалы
    const materialX = new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3,
        uniforms: {
            map: { value: texture },
            sliceX: { value: sliceX },
            textureHeight: { value: textureHeight },
            textureDepth: { value: textureDepth },
            uHuMin: { type: 'f', value: HUMin },
            uHuMax: { type: 'f', value: HUMax },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShaderX,
        side: THREE.DoubleSide,
    });

    const materialY = new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3,
        uniforms: {
            map: { value: texture },
            sliceY: { value: sliceY },
            textureWidth: { value: textureWidth },
            textureDepth: { value: textureDepth },
            uHuMin: { type: 'f', value: HUMin },
            uHuMax: { type: 'f', value: HUMax },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShaderY,
        side: THREE.DoubleSide,
    });

    const materialZ = new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3,
        uniforms: {
            map: { value: texture },
            sliceZ: { value: sliceZ },
            textureWidth: { value: textureWidth },
            textureHeight: { value: textureHeight },
            uHuMin: { type: 'f', value: HUMin },
            uHuMax: { type: 'f', value: HUMax },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShaderZ,
        side: THREE.DoubleSide,
    });

    const planeX = new THREE.Mesh(new THREE.PlaneGeometry((nz - 1) * hz, (ny - 1) * hy), materialX);
    planeX.rotation.y = -Math.PI / 2;
    planeX.position.x = p0[0] + hx * sliceX;
    planeX.position.y = p0[1] + hy * (ny / 2);
    planeX.position.z = p0[2] + hz * sliceZ;

    const planeY = new THREE.Mesh(new THREE.PlaneGeometry((nx - 1) * hx, (nz - 1) * hz), materialY);
    planeY.rotation.x = Math.PI / 2;
    planeY.position.x = p0[0] + hx * (nx / 2);
    planeY.position.y = p0[1] + hy * sliceY;
    planeY.position.z = p0[2] + hz * (nz / 2);

    const planeZ = new THREE.Mesh(new THREE.PlaneGeometry((nx - 1) * hx, (ny - 1) * hy), materialZ);
    planeZ.position.x = p0[0] + hx * (nx / 2);
    planeZ.position.y = p0[1] + hy * (ny / 2);
    planeZ.position.z = p0[2] + hz * sliceZ;

    scene.add(planeX);
    scene.add(planeY);
    scene.add(planeZ);

    camera.position.set(...p0);

    const sliceParams = {
        sliceX,
        sliceY,
        sliceZ,
    };

    const gui = new dat.GUI();

    // Добавление контролов для срезов
    gui.add(sliceParams, 'sliceX', 0, nx - 1, 1)
        .name('Slice X')
        .onChange((value) => {
            sliceX = value;
            materialX.uniforms.sliceX.value = value;
            planeX.position.x = p0[0] + hx * value;
            sliceX = value;
            texture.needsUpdate = true;
        });

    gui.add(sliceParams, 'sliceY', 0, ny - 1, 1)
        .name('Slice Y')
        .onChange((value) => {
            sliceY = value;
            materialY.uniforms.sliceY.value = value;
            planeY.position.y = p0[1] + hy * value;
            sliceY = value;
            texture.needsUpdate = true;
        });

    gui.add(sliceParams, 'sliceZ', 0, nz - 1, 1)
        .name('Slice Z')
        .onChange((value) => {
            sliceZ = value;
            materialZ.uniforms.sliceZ.value = value;
            planeZ.position.z = p0[2] + hz * value;
            texture.needsUpdate = true;
        });
});

// Позиционируем камеру

// Добавляем OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);

// Обработчик изменения размера окна
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Добавляем слушатель события изменения размера окна
window.addEventListener('resize', onWindowResize, false);

// Анимационная функция
function animate() {
    requestAnimationFrame(animate);

    // Обновляем контролы
    controls.update();

    renderer.render(scene, camera);
}

// Запускаем анимацию
animate();
