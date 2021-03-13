import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import * as dat from 'dat.gui'

import startDraw from './face'
import data from './results.json'

let currentImg = 0
let rotation = null

rotation = startDraw(data, currentImg)

/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Models
 */
// const dracoLoader = new DRACOLoader()
// dracoLoader.setDecoderPath('/draco/')
// dracoLoader.setDecoderPath('https://tomhsiao1260.github.io/motion-test/draco/')

const gltfLoader = new GLTFLoader()
// gltfLoader.setDRACOLoader(dracoLoader)

let model = null
let cylinder = null

gltfLoader.load(
    '/models/model.glb',
    // 'https://tomhsiao1260.github.io/motion-test/models/model.glb',
    (gltf) =>
    {
        gltf.scene.scale.set(3, 3, 3)

        scene.add(gltf.scene)

        updateAllMaterials()

        model = gltf.scene
    }
)

const updateAllMaterials = () => {
    scene.traverse((child) => {
        if(child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial)
        {
            child.material.envMap = environmentMap
            child.material.envMapIntensity = 0.7

            if (child.name === 'mouth') {
                child.visible = false
                gui.add(child, 'visible').name('mouth')
            }

            if (child.name === 'Cylinder') cylinder = child
        }
    })
}

const mouse = new THREE.Vector2()

window.addEventListener('mousemove', (event) => {
    mouse.x = event.clientX / sizes.width * 2 - 1
    mouse.y = - (event.clientY / sizes.height) * 2 + 1
})

window.addEventListener('touchmove', (event) => {
    mouse.x = event.touches[0].clientX / sizes.width * 2 - 1
    mouse.y = - (event.touches[0].clientY / sizes.height) * 2 + 1
})

window.addEventListener("keypress", (e) => {
    if (e.code === 'Space') {
        rotation = startDraw(data, currentImg)
        
        if (currentImg >= data.landmarks.length - 1) {
            currentImg = 0
        } else {
            currentImg ++
        }

        mouse.x = rotation.mX
        mouse.y = rotation.mY
    }
});

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

const cubeTextureLoader = new THREE.CubeTextureLoader()
const environmentMap = cubeTextureLoader.load([
    '/textures/environmentMaps/0/px.jpg',
    '/textures/environmentMaps/0/nx.jpg',
    '/textures/environmentMaps/0/py.jpg',
    '/textures/environmentMaps/0/ny.jpg',
    '/textures/environmentMaps/0/pz.jpg',
    '/textures/environmentMaps/0/nz.jpg',
    // 'https://tomhsiao1260.github.io/motion-test/textures/environmentMaps/0/px.jpg',
    // 'https://tomhsiao1260.github.io/motion-test/textures/environmentMaps/0/nx.jpg',
    // 'https://tomhsiao1260.github.io/motion-test/textures/environmentMaps/0/py.jpg',
    // 'https://tomhsiao1260.github.io/motion-test/textures/environmentMaps/0/ny.jpg',
    // 'https://tomhsiao1260.github.io/motion-test/textures/environmentMaps/0/pz.jpg',
    // 'https://tomhsiao1260.github.io/motion-test/textures/environmentMaps/0/nz.jpg',
])
scene.background = environmentMap

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0, -3, -15)
camera.lookAt(new THREE.Vector3())
scene.add(camera)

// Controls
// const controls = new OrbitControls(camera, canvas)
// controls.target.set(0, 1, 0)
// controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

renderer.physicallyCorrectLights = true
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 3
renderer.outputEncoding = THREE.sRGBEncoding
environmentMap.encoding = THREE.sRGBEncoding


/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    if(model)
    {
        const raycaster = new THREE.Raycaster()
        raycaster.setFromCamera(mouse, camera)
        const ray = raycaster.ray.direction
        const intersects = raycaster.intersectObjects([cylinder])

        const lookPoint = camera.position.clone()
                                         .add( ray.normalize().multiplyScalar( 10 ) )
        model.lookAt(lookPoint)
        if (rotation) model.rotation.z -= rotation.rZ
    }


    // Update controls
    // controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()