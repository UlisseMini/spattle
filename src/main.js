const canvas = document.querySelector("canvas")

const width = document.documentElement.clientWidth
const height = document.documentElement.clientHeight

canvas.width = width
canvas.height = height

const ctx = canvas.getContext("2d")

function distance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

function magnituide(v) {
  return Math.sqrt(v.x ** 2 + v.y ** 2)
}

function intersecting(b1, b2) {
  const d = distance(b1, b2)
  return d <= b1.radius + b2.radius
}

class Player {
  constructor(color, x, y) {
    this.x = x, this.y = y
    this.dx = 0, this.dy = 0
    this.ddx = 0, this.ddy = 0
    this.dAngle = Math.PI
    this.angle = Math.PI / 3

    this.health = 100

    // Constants
    this.color = color
    this.radius = 30
    this.noseLength = this.radius / 2
  }

  step(dt) {
    this.x += this.dx * dt, this.y += this.dy * dt
    this.dx += this.ddx * dt, this.dy += this.ddy * dt

    // apply drag
    this.dx *= 1 - 0.05 * dt, this.dy *= 1 - 0.05 * dt
    this.angle += this.dAngle * dt
  }

  hit(other) {
    // 0.1 is completely arbitrary
    const damage = Math.round(0.1 * Math.sqrt(other.dx ** 2 + other.dy ** 2))
    this.health -= damage
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

    // Draw a line in the direction we're accelerating
    ctx.beginPath()
    ctx.moveTo(this.x, this.y)
    ctx.lineTo(this.x + this.ddx, this.y + this.ddy)

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
    // Ball specific logic for being hit
    // NOTE: we call this *before* handling the collision
    if (b1.hit) {b1.hit(b2)}
    if (b2.hit) {b2.hit(b1)}

    // https://www.wikiwand.com/en/Elastic_collision
    // If both masses are the same, swap velocity
    [b1.dx, b2.dx] = [b2.dx, b1.dx]

    // Teleport them away to prevent them getting stuck inside eachother
    // minimize t such that dist(b1, b2) after update is equal to r1+r2.
    // FIXME: This causes an ugly jitter effect on collisions
    const dist = distance({x: b1.x + b1.dx, y: b1.y + b1.dy}, {x: b2.x + b2.dx, y: b2.y + b2.dy})
    const dt = Math.sqrt((b1.radius + b2.radius)) / dist

    b1.x += b1.dx * dt, b1.y += b1.dy * dt
    b2.x += b2.dx * dt, b2.y += b2.dy * dt
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


const max = 50

class RandomPlayer extends Player {
  step(dt) {
    if (Math.random() > 0.99) {
      this.ddx = max * (Math.random() * 2 - 1)
      this.ddy = max * (Math.random() * 2 - 1)
    }
    super.step(dt)
  }
}

class DumbRammingPlayer extends Player {
  step(dt) {
    // TODO: Make an API for bots so I don't need to hook like this
    const other = players.filter(p => p != this)[0]

    if (!other) {super.step(dt); return }

    const m = Math.sqrt((other.x - this.x) ** 2 + (other.y - this.y) ** 2)

    // TODO: Set acceleration not velocity
    this.ddx = max * (other.x - this.x) / m
    this.ddy = max * (other.y - this.y) / m

    super.step(dt)
  }
}

class SmartRammingPlayer extends Player {
  step(dt) {
    const other = players.filter(p => p != this)[0]

    if (!other) {super.step(dt); return }

    // Compute wanted velocity, then find best acceleration to
    // bring us closer to wanted velocity
    //
    // Compute desired displacement
    const s = {x: other.x - this.x, y: other.y - this.y}
    const sm = magnituide(s)
    // Desired velocity to achieve displacement
    const v = {x: max * s.x / sm, y: max * s.y / sm}
    const vm = magnituide(v)

    // Desired acceleration to achieve velocity
    const a = {x: max * v.x / vm, y: max * v.y / vm}

    this.ddx = a.x, this.ddy = a.y

    super.step(dt)
  }
}

class ImmobilePlayer extends Player {
  step(dt) {
    this.dx = 0, this.dy = 0
    this.ddx = 0, this.ddy = 0
    super.step(dt)
  }
}

let players = [
  new RandomPlayer('red', 5 * width / 6, height / 2),
  new SmartRammingPlayer('green', width / 6, height / 2),
]

// Game speed multiplier
let speed = 1

window.onkeypress = (k) => {
  let n = k.keyCode - 48;
  if (n >= 0 && n < 5) speed = 2 ** (n - 1)
  if (n >= 5 && n <= 9) speed = 1 / 2 ** (n - 4)
}

let simulator = new PhysicsSimulator(width, height)
// NOTE: This must be pass-by-reference so I can delete players,
// perhaps changing balls to be an array of arrays would be good.
simulator.balls = players

let prev = 0
function draw(timestamp) {
  const dt = (timestamp - prev) / 1000
  prev = timestamp
  // Too much delay since last frame, they must have gone to
  // a different tab or something, if we animate in a huge jump
  // everything will break
  if (dt > 0.1) return window.requestAnimationFrame(draw)

  // Clear the screen, but leave a blur effect
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, width, height)

  simulator.step(speed * dt)
  simulator.draw(ctx)

  // Display health of each player
  ctx.font = '48px monospace'
  let healthY = 50
  for (let i = 0; i < players.length; i++) {
    let player = players[i]

    const c = player.color.slice(0, 1).toUpperCase()
    ctx.fillStyle = player.color
    ctx.fillText(`${c}: ${player.health}`, 10, healthY)
    healthY += 50

    if (player.health <= 0) {
      players.splice(i, 1)
      i -= 1
      console.log(i, players)
    }
  }

  window.requestAnimationFrame(draw)
}

window.requestAnimationFrame(draw)

