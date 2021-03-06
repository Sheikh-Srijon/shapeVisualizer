import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
import Stats from 'https://unpkg.com/three@0.126.1/examples/jsm/libs/stats.module.js';
import { GUI } from 'https://unpkg.com/three@0.126.1/examples/jsm/libs/dat.gui.module';

//@functin readFile returns a promise after user uploads a file 
function readFile() {
    return new Promise((resolve, reject) => {
        let fileSelector = document.getElementById('fileSelector')
        fileSelector.addEventListener('change', (event) => {
            let lines = []
            console.log(fileSelector.files)
            let reader = new FileReader()
            reader.onerror = (error) => {
                alert('reader error')
            }
            reader.onload = () => {
                console.log(reader.result)
                lines = reader.result.split('\n')

                console.log(lines)
                resolve(lines)
            }
            reader.onerror = () => {
                reject('reader error')
            }
            reader.readAsText(fileSelector.files[0])
        }, false)


    });

}

//setup 
const scene = new THREE.Scene();
//set the camera 
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 10);
//set the render to display scene on 2D screen
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement); //append the canvas to HTML DOM

const controls = new OrbitControls(camera, renderer.domElement);


var animate = function () {
    requestAnimationFrame(animate);
    controls.update();
    render();
    // stats.update();
};

function render() {
    renderer.render(scene, camera);
}
var promise = readFile()
var dataArray = []

promise.then((res => {
    dataArray = res
    //obtain coordinateMap and faces array to draw the shape 
    let [coordinateMap, facesArray] = processData(dataArray)
    //drawFaces(coordinateMap, facesArray)
    drawShapes()

}),
    (err) => {
        console.log('promise rejected')
    })
/**
 * 
 * @param {*} dataArray is the array with all lines of text file
 * @returns {coordinateMap} with coordinates of each vertex
 * @returns {facesArray} with each vertex IDs of each face
 */

function processData(dataArray) {
    //create vertices {1 -> coordinates}
    let metaData = dataArray[0].split(',')
    let numVertices = metaData[0]
    let numFaces = metaData[1]

    let coordinateMap = new Map()
    let facesArray = []
    //compute a coordinate map
    for (let i = 1; i < dataArray.length; i++) {
        let thisLine = dataArray[i]

        if (i <= numVertices) {
            let metaVertex = thisLine.split(',')
            // i-0 is vertex
            let vertex = metaVertex[0]
            let coordinates = metaVertex.splice(0, 1)
            coordinateMap.set(vertex, metaVertex)
        }
        // start of the faces 
        else {
            let metaFaces = thisLine.split(',')
            facesArray.push(metaFaces)
        }
    }
    return [coordinateMap, facesArray]
}

function drawShapes() {
    // making of a new geometry 
    const material = new THREE.MeshNormalMaterial()
    // const material = new THREE.MeshBasicMaterial({ color: "blue" });

    let geometry = new THREE.BufferGeometry()
    function drawFaces(coordinateMap, facesArray) {
        //@getVector gets three coordinate points 
        function getVector(coordinates) {
            return new THREE.Vector3(...coordinates)
        }
        function drawOneFace(points, p1, p2, p3) {
            let v1 = getVector(p1)
            let v2 = getVector(p2)
            let v3 = getVector(p3)
            points.push(v1, v2, v3)

        }

        function getAllPoints(points) {
            //iterate through all faces to be drawn
            for (let i = 0; i < facesArray.length; i++) {
                let thisFaceIDs = facesArray[i] //contains IDs like 1,2,3 -- of vertex
                //need to retrieve coordinates from these IDs
                let p1 = coordinateMap.get(thisFaceIDs[0])
                let p2 = coordinateMap.get(thisFaceIDs[1])
                let p3 = coordinateMap.get(thisFaceIDs[2])
                let thisFaceCoordinates = [p1, p2, p3] //array of coordinates of each point
                // get coordinates in 
                let thisFaceVectors = drawOneFace(points, ...thisFaceCoordinates)

                // points.push(...thisFaceVectors)

            }
        }
        let points = []
        getAllPoints(points)
        geometry.setFromPoints(points)
        geometry.computeVertexNormals()

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh)
    }
    drawFaces(coordinateMap, facesArray)

    // //for display stats at the top corners 
    // const stats = Stats();
    // document.body.appendChild(stats.dom);

    let data = { x: 1 }
    const gui = new GUI();
    gui.add(data, "x", -5, -1, 0.01).onChange(() => {
        geometry.attributes.position.array[3] = data.x
        geometry.attributes.position.needsUpdate = true
    }
    )
    gui.open();

}


animate();