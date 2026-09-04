// Physics Engine - handles movement, gravity, collisions in 2D space
export class PhysicsEngine {
  constructor(config) {
    this.config = config;
    this.gravity = 1800;       // pixels per second^2
    this.groundY = config.groundY;
    this.friction = 0.85;
    this.airFriction = 0.95;
    this.moveSpeed = 320;      // pixels per second
    this.jumpForce = 600;
    this.minX = 80;
    this.maxX = config.width - 80;
  }

  update(fighter, dt) {
    // Clamp dt to avoid huge jumps when tab loses focus
    if (dt > 1 / 30) dt = 1 / 30;

    // Apply gravity
    if (!fighter.onGround) {
      fighter.velocityY += this.gravity * dt;
    }

    // Apply friction
    if (fighter.onGround) {
      fighter.velocityX *= this.friction;
    } else {
      fighter.velocityX *= this.airFriction;
    }

    // Update position
    fighter.x += fighter.velocityX * dt;
    fighter.y += fighter.velocityY * dt;

    // Ground collision (y grows downward in canvas coords)
    if (fighter.y + fighter.height >= this.groundY) {
      fighter.y = this.groundY - fighter.height;
      fighter.velocityY = 0;
      fighter.onGround = true;
      fighter.canDoubleJump = true;
      if (fighter.state === 'jump' || fighter.state === 'doubleJump') {
        fighter.setState('idle');
      }
    } else {
      fighter.onGround = false;
    }

    // Arena bounds
    if (fighter.x < this.minX) {
      fighter.x = this.minX;
      fighter.velocityX = Math.max(0, fighter.velocityX);
    }
    if (fighter.x + fighter.width > this.maxX) {
      fighter.x = this.maxX - fighter.width;
      fighter.velocityX = Math.min(0, fighter.velocityX);
    }
  }

  resolveCollision(fighterA, fighterB) {
    // AABB collision in 2D
    const aLeft = fighterA.x;
    const aRight = fighterA.x + fighterA.width;
    const bLeft = fighterB.x;
    const bRight = fighterB.x + fighterB.width;

    const overlapX = Math.min(aRight, bRight) - Math.max(aLeft, bLeft);
    const overlapY = Math.min(fighterA.y + fighterA.height, fighterB.y + fighterB.height)
                   - Math.max(fighterA.y, fighterB.y);

    if (overlapX > 0 && overlapY > 0) {
      const aCenterX = aLeft + fighterA.width / 2;
      const bCenterX = bLeft + fighterB.width / 2;

      if (aCenterX < bCenterX) {
        const push = overlapX / 2;
        fighterA.x -= push;
        fighterB.x += push;

        if (fighterA.velocityX > 0) fighterA.velocityX = 0;
        if (fighterB.velocityX < 0) fighterB.velocityX = 0;

        if (fighterA.x < this.minX) {
          const extra = this.minX - fighterA.x;
          fighterA.x = this.minX;
          fighterB.x += extra;
        }
        if (fighterB.x + fighterB.width > this.maxX) {
          const extra = (fighterB.x + fighterB.width) - this.maxX;
          fighterB.x -= extra;
          fighterA.x += extra;
        }
      } else {
        const push = overlapX / 2;
        fighterA.x += push;
        fighterB.x -= push;

        if (fighterA.velocityX < 0) fighterA.velocityX = 0;
        if (fighterB.velocityX > 0) fighterB.velocityX = 0;

        if (fighterB.x < this.minX) {
          const extra = this.minX - fighterB.x;
          fighterB.x = this.minX;
          fighterA.x += extra;
        }
        if (fighterA.x + fighterA.width > this.maxX) {
          const extra = (fighterA.x + fighterA.width) - this.maxX;
          fighterA.x -= extra;
          fighterB.x += extra;
        }
      }
    }
  }
}
