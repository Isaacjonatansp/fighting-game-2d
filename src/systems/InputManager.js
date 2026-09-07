// Input Manager - handles keyboard input
export class InputManager {
  constructor() {
    this.keys = new Map();
    this.prevKeys = new Map();
    this.justPressed = new Set(); // Keys pressed since last update()
    
    this._onKeyDown = (e) => this.onKeyDown(e);
    this._onKeyUp = (e) => this.onKeyUp(e);
    this._onPreventDefault = (e) => {
      const gameKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyJ', 'KeyK', 'KeyL',
                        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
                        'Digit1', 'Digit2', 'Digit3', 'Space', 'ShiftLeft', 'ShiftRight', 'Numpad0'];
      if (gameKeys.includes(e.code)) {
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('keydown', this._onPreventDefault);
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('keydown', this._onPreventDefault);
    this.keys.clear();
    this.prevKeys.clear();
    this.justPressed.clear();
  }
  
  onKeyDown(e) {
    this.keys.set(e.code, true);
  }
  
  onKeyUp(e) {
    this.keys.set(e.code, false);
  }
  
  update() {
    // Compute just-pressed: keys that are down now but weren't down last frame
    this.justPressed.clear();
    for (const [code, pressed] of this.keys) {
      if (pressed && !this.prevKeys.get(code)) {
        this.justPressed.add(code);
      }
    }
    // Store current keys as prevKeys for next frame
    this.prevKeys = new Map(this.keys);
  }
  
  isKeyPressed(code) {
    return this.keys.get(code) === true;
  }
  
  isKeyJustPressed(code) {
    return this.justPressed.has(code);
  }
  
  isKeyJustReleased(code) {
    return this.keys.get(code) !== true && this.prevKeys.get(code) === true;
  }
  
  getDirection(controls) {
    let x = 0, y = 0;
    if (this.isKeyPressed(controls.left)) x -= 1;
    if (this.isKeyPressed(controls.right)) x += 1;
    if (this.isKeyPressed(controls.up)) y -= 1;
    if (this.isKeyPressed(controls.down)) y += 1;
    return { x, y };
  }
  
  getActionState(controls) {
    return {
      light: this.isKeyJustPressed(controls.light),
      heavy: this.isKeyJustPressed(controls.heavy),
      special: this.isKeyJustPressed(controls.special),
      dash: this.isKeyJustPressed(controls.dash),
      block: this.isKeyPressed(controls.block),
      lightHeld: this.isKeyPressed(controls.light),
      heavyHeld: this.isKeyPressed(controls.heavy),
      specialHeld: this.isKeyPressed(controls.special)
    };
  }
}