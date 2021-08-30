import * as PIXI from 'pixi.js'

const app = new PIXI.Application({antialias: true})
document.body.appendChild(app.view)

const radius = 50

class Player {
  constructor() {
    this.graphics = new PIXI.Graphics()
    this.graphics.position.set(app.screen.width / 2, app.screen.height / 2)
    this.pos = this.graphics.position

    this.v = new PIXI.Point(3, 2)
    this.a = new PIXI.Point(1, 1)
  }

  handleEdges() {
    if (this.pos.x > app.screen.width - radius) {this.v.x = -Math.abs(this.v.x)}
    if (this.pos.x < radius) {this.v.x = Math.abs(this.v.x)}

    if (this.pos.y > app.screen.height - radius) {this.v.y = -Math.abs(this.v.y)}
    if (this.pos.y < radius) {this.v.y = Math.abs(this.v.y)}
  }

  step(delta) {
    this.pos.x += this.v.x * delta
    this.pos.y += this.v.y * delta

    this.v.x += this.a.x * delta
    this.v.y += this.a.y * delta

    // F = ma (let m = 1) => F = a, so a = -cv^2 
    // TODO: prove this gives an upper bound on velocity for limited acceleration
    this.v.x *= 0.99
    this.v.y *= 0.99

    if (Math.random() > 0.999) {
      this.a.x = (Math.random() * 2 - 1) * 2
      this.a.y = (Math.random() * 2 - 1) * 2
    }

    this.handleEdges()
  }

  redraw() {
    this.graphics.clear()

    // draw player circle
    this.graphics.beginFill(0xFFFFFF).drawCircle(0, 0, radius).endFill()

    // draw acceleration direction
    this.graphics.moveTo(0, 0)
    this.graphics.lineStyle({width: 3})
    this.graphics.lineTo(this.a.x * 30, this.a.y * 30)
  }
}


const player = new Player()

app.ticker.add(delta => {
  player.step(delta)
  player.redraw()
})

app.stage.addChild(player.graphics)
