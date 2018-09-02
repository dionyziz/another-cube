const W = 800, H = 800
const SPEED = 0.001
const CLEAR_COLOR = 'black'
const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
let t = Number(new Date())
let theta = 0
let textureImage = new Image()

const modelVertices = [
  // front
  new Vector(-1,  1, -1), // 0 top left
  new Vector( 1,  1, -1), // 1 top right
  new Vector( 1, -1, -1), // 2 bottom right
  new Vector(-1, -1, -1), // 3 bottom left

  // back
  new Vector( 1,  1, 1), // 4 top right
  new Vector(-1,  1, 1), // 5 top left
  new Vector(-1, -1, 1), // 6 bottom left
  new Vector( 1, -1, 1), // 7 bottom right
]

let worldVertices = []
let viewVertices = []

const triangles = [
  // front
  [0, 3, 1], [1, 3, 2],
  // back
  [4, 6, 5], [4, 7, 6],
  // top
  [0, 1, 4], [4, 5, 0],
  // bottom
  [3, 6, 2], [2, 6, 7],
  // left
  [0, 6, 3], [0, 5, 6],
  // right
  [1, 2, 7], [7, 4, 1],
]

const textureMapping = [
  // front
  [[.33, .25], [.33, .5], [.66, .25]], [[.66, .25], [.33, .5], [.66, .5]],
  // back
  [[.33, 1], [.66, .75], [.66, 1]], [[.33, 1], [.33, 0.75], [.66, .75]],
  // top
  [[.33, .25], [.66, .25], [.66, 0]], [[.66, 0], [.33, 0], [.33, .25]],
  // bottom
  [[.33, .5], [.33, .75], [.66, .5]], [[.66, .5], [.33, .75], [.66, .75]],
  // left
  [[.33, .25], [0, .5], [.33, .5]], [[.33, .25], [0, .25], [0, .5]],
  // right
  [[.66, .25], [.66, .5], [1, .5]], [[1, .5], [1, .25], [.66, .25]],
]

function clear() {
  ctx.fillStyle = CLEAR_COLOR
  ctx.fillRect(0, 0, W, H)
}

function drawPoint(viewPoint) {
  ctx.beginPath()
  ctx.moveTo(viewPoint.x,     viewPoint.y)
  ctx.lineTo(viewPoint.x + 1, viewPoint.y + 1)
  ctx.strokeStyle = 'black'
  ctx.stroke()
}

function drawTriangle(triangle, triangleTexture, cnt) {
  const A = viewVertices[triangle[0]],
        B = viewVertices[triangle[1]],
        C = viewVertices[triangle[2]]
  const AB = B.subtract(A),
        AC = C.subtract(A)
  const N = AB.cross(AC).normalize()

  if (N.z > 0) {
    return
  }

  drawTexture(triangle, triangleTexture, textureImage)

  ctx.beginPath()

  ctx.moveTo(A.x, A.y)
  ctx.lineTo(B.x, B.y)
  ctx.lineTo(C.x, C.y)
  ctx.lineTo(A.x, A.y)

  ctx.fillStyle = triangle[3].css()
  ctx.fill()
}

function drawTexture(triangle, triangleTexture, textureImage) {
  let tA = new Vector(...triangleTexture[0]),
      tB = new Vector(...triangleTexture[1]),
      tC = new Vector(...triangleTexture[2])

  ctx.save()
  const map = mapTexture(triangle, {tA, tB, tC})
  ctx.transform(map[0][0], map[1][0], map[0][1], map[1][1], map[0][2], map[1][2])
  ctx.beginPath()
  ctx.moveTo(tA.u, tA.v)
  ctx.lineTo(tB.u, tB.v)
  ctx.lineTo(tC.u, tC.v)
  ctx.lineTo(tA.u, tA.v)
  // ctx.strokeStyle = 'black'
  // ctx.lineWidth = 0.001
  // ctx.stroke()
  ctx.clip()
  ctx.drawImage(textureImage, 0, 0, textureImage.width, textureImage.height, 0, 0, 1, 1)
  ctx.restore()
}

function mapTexture(triangle, {tA, tB, tC}) {
  const A = viewVertices[triangle[0]],
        B = viewVertices[triangle[1]],
        C = viewVertices[triangle[2]]

  // Computer projective matrix M such that the affine texture mapping is
  // correct:
  // M [[Au Av 1] [Bu Bv 1] [Cu Cv 1]]^T = [[Ax Ay 1] [Bx By 1] [Cx Cy 1]]^T
  const textureTriangle = math.transpose(
    [[tA.u, tA.v, 1], [tB.u, tB.v, 1], [tC.u, tC.v, 1]]
  )
  const clippingTriangle = math.transpose(
    [[A.x, A.y, 1], [B.x, B.y, 1], [C.x, C.y, 1]]
  )
  if (math.det(textureTriangle) != 0) {
    let textureTriangleInv = math.inv(textureTriangle)
    M = math.multiply(clippingTriangle, textureTriangleInv)
    return M
  }
  // Degenerate triangle
  return math.identity(3).toArray()
}

function render() {
  let i = 0

  clear()

  for (let triangle of triangles) {
    let triangleTexture = textureMapping[i]
    drawTriangle(triangle, triangleTexture, i)
    ++i
  }
}

function worldToViewVertex(worldPoint) {
  const projectedPoint = worldPoint.perspectiveProject(2, 0.4)
  const center = new Vector(W / 2, H / 2)
  const viewPoint = projectedPoint.flipVertical().scale(W / 4).add(center)

  return viewPoint
}

function modelToWorldVertex(modelVertex) {
  return modelVertex
        .rotateZ(theta)
        .rotateX(theta * 0.2)
        .rotateY(-theta * 0.7)
}

function vertexShaderTriangle(triangle) {
  const A = worldVertices[triangle[0]],
        B = worldVertices[triangle[1]],
        C = worldVertices[triangle[2]]
  const AB = B.subtract(A),
        AC = C.subtract(A)
  const N = AB.cross(AC).normalize()
  const camera = new Vector(0, 0, -4)

  const eye = A.add(B).add(C).scale(1 / 3).subtract(camera).normalize()
  // Directional light
  // const diffuse = new Color(150, 0, 0).darken(1 + N.z)

  // const ambient = new Color(20, 30, 40)
  // Spot light
  // const diffuse = new Color(255, 0, 0).scale(N.dot(eye))
  // const specular = new Color(255, 255, 255).scale(Math.pow(N.dot(eye), 20))
  // const color = diffuse.add(ambient).add(specular.scale(0.6))
  // return color

  const ambient = 0.1
  const diffuse = N.dot(eye)
  const specular = Math.pow(N.dot(eye), 20)
  const transparency = diffuse + ambient + specular

  return new Color(0, 0, 0, 1 - transparency)
}

function vertexShader() {
  let color, i = 0

  for (let triangle of triangles) {
    if (i % 2 == 0) {
      color = vertexShaderTriangle(triangle)
    }
    triangle[3] = color
    ++i
  }
}

function integrate() {
  const dt = Number(new Date()) - t
  t = Number(new Date())

  requestAnimationFrame(integrate)

  theta += SPEED * dt

  modelToWorld()
  vertexShader()
  worldToView()

  render()
}

function modelToWorld() {
  worldVertices = modelVertices.map(modelToWorldVertex)
}

function worldToView() {
  viewVertices = worldVertices.map(worldToViewVertex)
}

textureImage.addEventListener('load', integrate)
// Texture image from
// http://www.tfw2005.com/boards/threads/allspark-cube-with-file-to-make-your-own.214508/
textureImage.src = 'texture.jpg'
