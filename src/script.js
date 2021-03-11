import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import * as dat from 'dat.gui'

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
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

let model = null
let cylinder = null

gltfLoader.load(
    '/models/model.glb',
    (gltf) =>
    {
        gltf.scene.scale.set(3, 3, 3)

        scene.add(gltf.scene)
        console.log(gltf)

        updateAllMaterials()

        gltf.scene.children[2].visible = false
        gui.add(gltf.scene.children[2], 'visible').name('mouth')
        // gui.add(gltf.scene.rotation, 'y').min(-0.5).max(0.5).step(0.001).name('rotateY')
        // gui.add(gltf.scene.rotation, 'x').min(-0.5).max(0.5).step(0.001).name('rotateX')
        // gui.add(gltf.scene.rotation, 'z').min(-0.5).max(0.5).step(0.001).name('rotateZ')
        console.log(gltf.scene)
        model = gltf.scene
        cylinder = gltf.scene.children[0]
    }
)

const updateAllMaterials = () => {
    scene.traverse((child) => {
        if(child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial)
        {
            child.material.envMap = environmentMap
            child.material.envMapIntensity = 0.7
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
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 1, 0)
controls.enableDamping = true

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
        console.log(intersects)

        const lookPoint = camera.position.clone()
                                         .add( ray.normalize().multiplyScalar( 10 ) )
        model.lookAt(lookPoint)
    }


    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()