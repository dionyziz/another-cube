class Color {
  constructor(r, g, b, a = 1) {
    if (b === undefined) {
      this.data = r
      this._a = a
    }
    else {
      this.data = new Vector(r, g, b)
      this._a = a
    }
    this.r = clamp(0, this.r, 255)
    this.g = clamp(0, this.g, 255)
    this.b = clamp(0, this.b, 255)
    this._a = clamp(0, this._a, 1)
  }

  darken(factor) {
    return new Color(this.data.scale(1 - factor))
  }

  add(other) {
    return new Color(this.data.add(other.data))
  }
  scale(factor) {
    return new Color(this.data.scale(factor))
  }

  get r() {
    return this.data.x
  }
  set r(r) {
    this.data.x = r
  }

  get g() {
    return this.data.y
  }
  set g(g) {
    this.data.y = g
  }

  get b() {
    return this.data.z
  }
  set b(b) {
    this.data.z = b
  }

  get a() {
    return this._a
  }
  set a(a) {
    this._a = a
  }

  css() {
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`
  }
}
