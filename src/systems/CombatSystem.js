// Combat System - handles attacks, damage, hitboxes
export class CombatSystem {
  constructor(config) {
    this.config = config;
    this.activeHitboxes = [];
  }
  
  update(fighter1, fighter2, dt) {
    // Check for hit detection
    this.checkHit(fighter1, fighter2);
    this.checkHit(fighter2, fighter1);
  }
  
  checkHit(attacker, defender) {
    // If attacker has an active hitbox and defender has a hurtbox
    if (!attacker.hitbox || !attacker.hitboxActive) return;
    if (!defender.hurtbox) return;
    
    // Check if defender is invincible
    if (defender.invincible) return;
    
    // AABB collision detection
    if (this.boxesCollide(attacker.hitbox, defender.hurtbox)) {
      // Check if this hit was already registered (prevent multi-hit in same frame)
      if (attacker.hitLanded) return;
      
      // Check if defender is blocking
      const isBlocking = defender.state === 'block' && this.isFacingAttacker(defender, attacker);
      
      if (isBlocking) {
        // Block the attack
        this.onBlock(attacker, defender);
      } else {
        // Hit landed
        this.onHit(attacker, defender);
      }
      
      // Mark hit as landed to prevent multi-hit
      attacker.hitLanded = true;
    }
  }
  
  boxesCollide(boxA, boxB) {
    return boxA.x < boxB.x + boxB.width &&
           boxA.x + boxA.width > boxB.x &&
           boxA.y < boxB.y + boxB.height &&
           boxA.y + boxA.height > boxB.y;
  }
  
  isFacingAttacker(defender, attacker) {
    const defenderCenterX = defender.x + defender.width / 2;
    const attackerCenterX = attacker.x + attacker.width / 2;
    
    if (attackerCenterX < defenderCenterX) {
      // Attacker is on the left, defender should face left (-1)
      return defender.facing === -1;
    } else {
      // Attacker is on the right, defender should face right (1)
      return defender.facing === 1;
    }
  }
  
  onHit(attacker, defender) {
    const baseDamage = attacker.currentAttack ? attacker.currentAttack.damage : 10;
    const damageMultiplier = attacker.damageMultiplier || 1;
    const damage = Math.max(1, Math.round(baseDamage * damageMultiplier));
    const knockback = attacker.currentAttack ? attacker.currentAttack.knockback : { x: 5, y: -3 };
    const hitstun = attacker.currentAttack ? attacker.currentAttack.hitstun : 0.3;
    
    // Apply damage
    defender.takeDamage(damage);
    
    // Apply knockback
    const direction = attacker.facing;
    defender.velocityX = knockback.x * direction;
    defender.velocityY = knockback.y;
    
    // Apply hitstun
    defender.setState('hit', hitstun);
    defender.hitStun = hitstun;
    
    // Notify game for combo counter
    if (window.game) {
      window.game.registerHit(attacker.id, damage);
    }
    
    // Visual effects
    this.spawnHitEffect(defender.x + defender.width / 2, defender.y + defender.height / 2, attacker.currentAttack.type, attacker.character);
    
    // Screen shake on hit
    if (window.game && window.game.renderer) {
      const shakeIntensity = attacker.currentAttack && (attacker.currentAttack.type === 'heavy' || attacker.currentAttack.type === 'special') ? 15 : 8;
      window.game.renderer.shakeCamera(shakeIntensity, 250);
      
      // Screen flash for heavy/special
      if (attacker.currentAttack && (attacker.currentAttack.type === 'heavy' || attacker.currentAttack.type === 'special')) {
        window.game.renderer.flashScreen('#FFFFFF', 120);
      }
    }
  }
  
  onBlock(attacker, defender) {
    // Reduced knockback on block
    const direction = attacker.facing;
    defender.velocityX = 2 * direction;
    
    // Small blockstun
    defender.hitStun = 0.15;
    
    // Push attacker back slightly
    attacker.velocityX = -1 * direction;
    
    // Visual effects
    this.spawnBlockEffect(defender.x + defender.width / 2, defender.y + defender.height / 2, defender.character);
    
    // Subtle screen shake on block
    if (window.game && window.game.renderer) {
      window.game.renderer.shakeCamera(4, 100);
    }
  }
  
  spawnHitEffect(x, y, attackType, attackerStyle) {
    if (!window.game || !window.game.renderer) return;
    
    const renderer = window.game.renderer;
    const isCapoeira = attackerStyle === 'crimson';
    
    // Particles - different colors per style
    const particleCount = attackType === 'heavy' || attackType === 'special' ? 18 : 10;
    const color = isCapoeira ? '#FF6600' : '#4488FF';
    const secondaryColor = isCapoeira ? '#FFCC00' : '#88CCFF';
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const speed = 3 + Math.random() * 4;
      renderer.addParticle(
        x, y, i % 2 === 0 ? color : secondaryColor,
        { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed - 2 },
        400 + Math.random() * 300,
        3 + Math.random() * 3
      );
    }
    
    // Impact ring
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        if (renderer && renderer.addParticle) {
          renderer.addParticle(
            x, y, i % 2 === 0 ? color : secondaryColor,
            { x: 0, y: 0 },
            200,
            8 + i * 4
          );
        }
      }, i * 30);
    }
  }
  
spawnBlockEffect(x, y, defenderStyle) {
    if (!window.game || !window.game.renderer) return;
    
    const renderer = window.game.renderer;
    const isCapoeira = defenderStyle === 'crimson';
    const color = isCapoeira ? '#FF6600' : '#4488FF';
    const secondaryColor = isCapoeira ? '#FFCC00' : '#88CCFF';
    
    // Style-specific block particles
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI + (Math.random() - 0.5) * Math.PI / 2;
      const speed = 1.5 + Math.random() * 2.5;
      renderer.addParticle(
        x, y, i % 2 === 0 ? color : secondaryColor,
        { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        250 + Math.random() * 150,
        2 + Math.random() * 2
      );
    }
    
    // Small shake
    renderer.shakeCamera(3, 100);
  }
  
  // Attack definitions
  static ATTACKS = {
    light: {
      type: 'light',
      damage: 8,
      knockback: { x: 4, y: -2 },
      hitstun: 0.25,
      startup: 0.08,
      active: 0.12,
      recovery: 0.15,
      hitboxOffset: { x: 40, y: 20 },
      hitboxSize: { width: 50, height: 40 }
    },
    light2: {
      type: 'light',
      damage: 6,
      knockback: { x: 3, y: -1 },
      hitstun: 0.2,
      startup: 0.06,
      active: 0.1,
      recovery: 0.12,
      hitboxOffset: { x: 45, y: 15 },
      hitboxSize: { width: 55, height: 45 }
    },
    light3: {
      type: 'light',
      damage: 12,
      knockback: { x: 8, y: -5 },
      hitstun: 0.35,
      startup: 0.1,
      active: 0.15,
      recovery: 0.25,
      hitboxOffset: { x: 50, y: 10 },
      hitboxSize: { width: 65, height: 55 }
    },
    heavy: {
      type: 'heavy',
      damage: 15,
      knockback: { x: 8, y: -4 },
      hitstun: 0.4,
      startup: 0.15,
      active: 0.18,
      recovery: 0.3,
      hitboxOffset: { x: 45, y: 15 },
      hitboxSize: { width: 60, height: 50 }
    },
    heavy2: {
      type: 'heavy',
      damage: 18,
      knockback: { x: 10, y: -6 },
      hitstun: 0.5,
      startup: 0.12,
      active: 0.2,
      recovery: 0.35,
      hitboxOffset: { x: 50, y: 10 },
      hitboxSize: { width: 70, height: 60 }
    },
    special: {
      type: 'special',
      damage: 20,
      knockback: { x: 12, y: -6 },
      hitstun: 0.6,
      startup: 0.25,
      active: 0.25,
      recovery: 0.45,
      hitboxOffset: { x: 50, y: 10 },
      hitboxSize: { width: 70, height: 60 }
    },
    crouchLight: {
      type: 'light',
      damage: 7,
      knockback: { x: 3, y: 0 },
      hitstun: 0.2,
      startup: 0.08,
      active: 0.12,
      recovery: 0.18,
      hitboxOffset: { x: 35, y: 50 },
      hitboxSize: { width: 45, height: 30 }
    },
    airLight: {
      type: 'light',
      damage: 9,
      knockback: { x: 5, y: -3 },
      hitstun: 0.3,
      startup: 0.1,
      active: 0.15,
      recovery: 0.2,
      hitboxOffset: { x: 40, y: 25 },
      hitboxSize: { width: 50, height: 40 }
    }
  };
}