import * as faceapi from 'face-api.js'
// import data from './results.json'
// https://github.com/WebDevSimplified/Face-Detection-JavaScript

export const data = {
  landmarks: [],
  date: []
}

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/ml-models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/ml-models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/ml-models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/ml-models')
]).then(startVideo)

const video = document.getElementById('video')

function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: {} })
                        .then(stream => video.srcObject = stream )
                        .catch(err => console.error(err) )
}

function getSize(domElement) {
  const style = window.getComputedStyle(domElement)
  const strWidth = style.getPropertyValue('width')
  const strHeight = style.getPropertyValue('height')
  const width = parseInt(strWidth.split('px')[0])
  const height = parseInt(strHeight.split('px')[0])
  return { width, height }
}

const resultArray = []
const dateArray = []

video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video)
  canvas.className = 'landmarks'
  const { width, height } = getSize(video)
  document.body.append(canvas)
  
  const displaySize = { width, height }
  faceapi.matchDimensions(canvas, displaySize)

  const dateStart = Date.now()
  let enable = true

  const timer = setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks()
    const resizedDetections = faceapi.resizeResults(detections, displaySize)

    if (detections.length !== 0 && enable) {
      canvas.getContext('2d').clearRect(0, 0, width, height)
      faceapi.draw.drawDetections(canvas, resizedDetections)
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)

      const dateNow = Date.now() - dateStart
      
      if (detections[0].hasOwnProperty('landmarks')) {
        resultArray.push(detections[0].landmarks)
        dateArray.push(dateNow)
      }

      if (dateNow > 30000 && enable) {
        clearInterval(timer);
        data.landmarks = resultArray
        data.date = dateArray

        const results = JSON.stringify(data);
        // download(results, 'results.json', 'application/json');

        canvas.getContext('2d').clearRect(0, 0, width, height) 
        enable = false

        const tracks = video.srcObject.getTracks()
        tracks.forEach(track => track.stop())
        video.srcObject = null

        plot(data, 0)
      }
    }
  }, 100)
})

function download(data, filename, type) {
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}

export default function startDraw(imgNum) {
  const rotate = plot(data, imgNum)
  return rotate
}

function plot(data, imgNum) {
  const canvas = document.getElementById('draw')
  const width = canvas.width
  const height = canvas.height
  const ctx = canvas.getContext("2d")

  ctx.clearRect(0, 0, width, height);

  const faceWidth = data.landmarks[imgNum]._positions[14]._x - data.landmarks[imgNum]._positions[2]._x
  const normalized = 0.3 * width / faceWidth

  const startPoint = data.landmarks[imgNum]._positions[0]
  const centerX = (data.landmarks[imgNum]._positions[2]._x + data.landmarks[imgNum]._positions[14]._x) / 2
  const centerY = (data.landmarks[imgNum]._positions[2]._y + data.landmarks[imgNum]._positions[14]._y) / 2
  const shiftX = centerX * normalized - width / 2
  const shiftY = centerY * normalized - height / 2

  ctx.beginPath();
  ctx.moveTo(startPoint._x * normalized - shiftX, startPoint._y * normalized - shiftY)

  let count = 0
  const disconnect = [17, 22, 27, 36, 42, 48]

  data.landmarks[imgNum]._positions.forEach(({_x, _y}) => {
    const x = _x * normalized - shiftX
    const y = _y * normalized - shiftY

    if (!disconnect.includes(count)) {
        ctx.lineTo(x, y)
    } else {
        ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y)
    }
    ctx.fillStyle = 'black'
    // ctx.fillText(count, x, y)

    count ++
  })

  ctx.stroke()

  const s = meanSlop(data, imgNum, [[27, 28], [28, 29], [29, 30]])
  const norm = distance(data.landmarks[imgNum]._positions[2], data.landmarks[imgNum]._positions[14])
  const disLeft = lineDistance(data.landmarks[imgNum]._positions, 31, {linePoint: 30, slop: s}, norm)
  const disMid = lineDistance(data.landmarks[imgNum]._positions, 33, {linePoint: 30, slop: s}, norm)
  const disRight = lineDistance(data.landmarks[imgNum]._positions, 35, {linePoint: 30, slop: s}, norm)
  const mX = mouseX(disLeft, disMid, disRight)
  const mY = mouseY(data.landmarks[imgNum]._positions)
  const slopZ = meanSlop(data, imgNum, [[0, 16], [1, 15], [2, 14], [3, 13], [4, 12], [5, 11], [6, 10], [7, 9]])
  const rZ = Math.atan(slopZ)

  ctx.beginPath()
  ctx.arc((1 + mX) * width / 2, (1 - mY) * height / 2, 6, 0, 2 * Math.PI)
  ctx.fillStyle = 'blue'
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo((1 + mX) * width / 2, (1 - mY) * height / 2)
  ctx.lineTo((1 + mX) * width / 2 + 30, (1 - mY) * height / 2 + 30 * slopZ)
  ctx.fillStyle = 'red'
  ctx.stroke()

  return {mX, mY, rZ}
}

function meanSlop(data, imgNum, points) {
  let s = 0
  let count = 0
  points.forEach((lines) => {
    const pos1 = data.landmarks[imgNum]._positions[lines[0]]
    const pos2 = data.landmarks[imgNum]._positions[lines[1]]
    s += slop(pos1, pos2)
    count ++
  })
  return s /= count
}

function slop(pos1, pos2) {
  const deltaX = pos1._x - pos2._x
  const deltaY = pos1._y - pos2._y
  return deltaY / deltaX
}

function distance(pos1, pos2) {
  const deltaX = pos1._x - pos2._x
  const deltaY = pos1._y - pos2._y
  return Math.sqrt( deltaX * deltaX + deltaY * deltaY)
}

function lineDistance(data, point, line, norm) {
  const ref = data[point]
  const linePoint = data[line.linePoint]
  const s = line.slop
  const factor = Math.sqrt(s * s + 1)
  let distance = Math.abs(s * (ref._x - linePoint._x) - (ref._y - linePoint._y))

  distance /= factor * norm
  return distance
}

function mouseX(disLeft, disMid, disRight) {
  const m = [-1, 0, 1]
  const norm = 1 / disLeft + 1/ disMid + 1 / disRight
  const mouseX = (1 / disLeft * m[0] + 1 / disMid * m[1]+ 1 / disRight * m[2]) / norm
  return mouseX
}

function mouseY(data) {
  const norm = distance(data[1], data[15])
  const s = slop(data[1], data[15])

  let sign = s * (data[27]._x - data[1]._x) - (data[27]._y - data[1]._y)
  if (sign > 0) {
    sign = 1
  } else {
    sign = -1
  }
  let mouseY = lineDistance(data, 27,{linePoint: 1, slop: s} , norm)

  mouseY /= sign
  mouseY *= 3

  if (mouseY > 1) mouseY = 1
  if (mouseY < -1) mouseY = -1

  return mouseY
}







