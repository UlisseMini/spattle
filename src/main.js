const canvas = document.querySelector("canvas")

const width = document.documentElement.clientWidth
const height = document.documentElement.clientHeight

canvas.width = width
canvas.height = height

const ctx = canvas.getContext("2d")

function distance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

function intersecting(b1, b2) {
  const d = distance(b1, b2)
  return d <= b1.radius + b2.radius
}

class Player {
  constructor(color, x, y) {
    this.x = x, this.y = y
    this.dx = 100, this.dy = 0
    this.ddx = 0.5, this.ddy = 1
    this.dAngle = Math.PI
    this.angle = Math.PI / 3

    // Constants
    this.color = color
    this.radius = 30
    this.noseLength = this.radius / 2
    this.m = 50 // factor to multiply (-1, 1) acceleration
  }

  step(dt) {
    this.x += this.dx * dt, this.y += this.dy * dt
    this.dx += this.m * this.ddx * dt, this.dy += this.m * this.ddy * dt

    // apply drag
    this.dx *= 1 - 0.05 * dt, this.dy *= 1 - 0.05 * dt
    this.angle += this.dAngle * dt
  }

  draw(ctx) {
    // Draw our circle
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.ellipse(this.x, this.y, this.radius, this.radius, 0, 0, Math.PI * 2)
    ctx.fill()

    // Draw a line in the direction we're looking
    ctx.beginPath()
    ctx.moveTo(this.x, this.y)
    ctx.lineTo( // negate the angle so it goes in the right direction
      this.x + Math.cos(-this.angle) * this.noseLength,
      this.y + Math.sin(-this.angle) * this.noseLength
    )
    ctx.stroke()
  }
}

class PhysicsSimulator {
  constructor(width, height) {
    this.width = width
    this.height = height
    this.balls = []
  }

  handleEdges(b) {
    if (b.x >= this.width - b.radius) {b.dx = -Math.abs(b.dx)}
    if (b.x <= b.radius) {b.dx = Math.abs(b.dx)}

    if (b.y >= this.height - b.radius) {b.dy = -Math.abs(b.dy)}
    if (b.y <= b.radius) {b.dy = Math.abs(b.dy)}
  }

  handleCollision(b1, b2) {
    // https://www.wikiwand.com/en/Elastic_collision
    // If both masses are the same, swap velocity
    [b1.dx, b2.dx] = [b2.dx, b1.dx]
  }

  handleCollisions() {
    for (let i = 0; i < this.balls.length; i++) {
      for (let j = i + 1; j < this.balls.length; j++) {
        if (intersecting(this.balls[i], this.balls[j])) {
          this.handleCollision(this.balls[i], this.balls[j])
        }
      }
    }
  }

  step(dt) {
    this.balls.forEach(b => {
      b.step(dt)
      this.handleEdges(b)
    })

    this.handleCollisions()
  }

  draw(ctx) {
    this.balls.forEach(ball => ball.draw(ctx))
  }
}

let players = [
  new Player('green', width / 6, height / 2),
  new Player('red', 5 * width / 6, height / 2)
]

let simulator = new PhysicsSimulator(width, height)
simulator.balls = [].concat(players)

let prev = 0
function draw(timestamp) {
  const dt = (timestamp - prev) / 1000
  prev = timestamp

  // Clear the screen, but leave a blur effect
  ctx.fillStyle = 'rgba(200,200,200,0.4)'
  ctx.fillRect(0, 0, width, height)

  simulator.step(dt)
  simulator.draw(ctx)

  window.requestAnimationFrame(draw)
}

window.requestAnimationFrame(draw)

