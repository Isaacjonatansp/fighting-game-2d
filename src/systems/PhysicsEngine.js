// Physics Engine - handles movement, gravity, collisions
export class PhysicsEngine {
  constructor(config) {
    this.config = config;
    this.gravity = 1.2; // per frame (at 60fps)
    this.groundY = config.groundY;
    this.friction = 0.85;
    this.airFriction = 0.95;
  }
  
  update(fighter, dt) {
    // Apply gravity (consistent with velocity scaling)
    if (!fighter.onGround) {
      fighter.velocityY += this.gravity;
    }
    
    // Apply friction
    if (fighter.onGround) {
      fighter.velocityX *= this.friction;
    } else {
      fighter.velocityX *= this.airFriction;
    }
    
    // Update position (velocity is already per-frame)
    fighter.x += fighter.velocityX;
    fighter.y += fighter.velocityY;
    
    // Platform and Ground collision
    let landed = false;
    const stage = fighter.game?.stage;
    
    if (stage) {
      const platform = stage.getPlatformAt(fighter.x, fighter.y, fighter.width, fighter.height);
      // Only land if falling down
      if (platform && fighter.velocityY >= 0) {
        fighter.y = platform.y - fighter.height;
        fighter.velocityY = 0;
        fighter.onGround = true;
        fighter.canDoubleJump = true;
        if (fighter.state === 'jump' || fighter.state === 'doubleJump') fighter.state = 'idle';
        landed = true;
      }
    }
    
    if (!landed) {
      if (fighter.y >= this.groundY - fighter.height) {
        fighter.y = this.groundY - fighter.height;
        fighter.velocityY = 0;
        fighter.onGround = true;
        fighter.canDoubleJump = true; // Reset double jump on landing
        if (fighter.state === 'jump' || fighter.state === 'doubleJump') fighter.state = 'idle';
      } else {
        fighter.onGround = false;
      }
    }
    
    // Wall collision
    if (fighter.x < 0) {
      fighter.x = 0;
      fighter.velocityX = Math.max(0, fighter.velocityX);
    }
    if (fighter.x > this.config.width - fighter.width) {
      fighter.x = this.config.width - fighter.width;
      fighter.velocityX = Math.min(0, fighter.velocityX);
    }
    
    fighter.lastVelocityY = fighter.velocityY;
  }
  
  resolveCollision(fighterA, fighterB) {
    // Simple AABB collision - skip if either is attacking (allow attacks to hit)
    if (fighterA.state === 'attack' || fighterA.state === 'heavyAttack' || fighterA.state === 'special' ||
        fighterB.state === 'attack' || fighterB.state === 'heavyAttack' || fighterB.state === 'special') {
      // Allow minimal separation but no push
      const dx = fighterB.x + fighterB.width/2 - (fighterA.x + fighterA.width/2);
      const combinedWidth = (fighterA.width + fighterB.width) / 2 + 5;
      
      if (Math.abs(dx) < combinedWidth - 5) {
        const overlapX = combinedWidth - 5 - Math.abs(dx);
        if (dx > 0) {
          fighterB.x += overlapX / 2;
          fighterA.x -= overlapX / 2;
        } else {
          fighterB.x -= overlapX / 2;
          fighterA.x += overlapX / 2;
        }
      }
      return;
    }
    
    // Simple AABB collision
    const dx = fighterB.x + fighterB.width/2 - (fighterA.x + fighterA.width/2);
    const dy = fighterB.y + fighterB.height/2 - (fighterA.y + fighterA.height/2);
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    
    const combinedWidth = (fighterA.width + fighterB.width) / 2;
    const combinedHeight = (fighterA.height + fighterB.height) / 2;
    
    if (absDx < combinedWidth && absDy < combinedHeight) {
      const overlapX = combinedWidth - absDx;
      const overlapY = combinedHeight - absDy;
      
      if (overlapX < overlapY) {
        // Horizontal collision
        if (dx > 0) {
          fighterB.x += overlapX / 2;
          fighterA.x -= overlapX / 2;
        } else {
          fighterB.x -= overlapX / 2;
          fighterA.x += overlapX / 2;
        }
        
        const tempVX = fighterA.velocityX;
        fighterA.velocityX = fighterB.velocityX * 0.3;
        fighterB.velocityX = tempVX * 0.3;
      } else {
        // Vertical collision
        if (dy > 0) {
          fighterB.y += overlapY / 2;
          fighterA.y -= overlapY / 2;
        } else {
          fighterB.y -= overlapY / 2;
          fighterA.y += overlapY / 2;
        }
        
        const tempVY = fighterA.velocityY;
        fighterA.velocityY = fighterB.velocityY * 0.3;
        fighterB.velocityY = tempVY * 0.3;
        
        if (dy > 0 && fighterA.velocityY > 0) {
          fighterA.onGround = true;
          fighterA.velocityY = 0;
        }
        if (dy < 0 && fighterB.velocityY < 0) {
          fighterB.onGround = true;
          fighterB.velocityY = 0;
        }
      }
    }
  }
}