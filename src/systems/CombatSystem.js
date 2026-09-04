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
    
    // Visual effects - use attacker's color & movement
    const attackType = attacker.currentAttack ? attacker.currentAttack.type : 'attack';
    const attackerColor = attacker.color || '#D4AF37';
    const defenderX = defender.x + defender.width / 2;
    const defenderY = defender.y + defender.height / 2;
    const attackerFacing = attacker.facing;
    
    this.spawnHitEffect(defenderX, defenderY, attackType, attackerColor, attacker.velocityX, damage, attackerFacing);
    
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
    this.spawnBlockEffect(defender.x + defender.width / 2, defender.y + defender.height / 2, defender.color);
    
    // Subtle screen shake on block
    if (window.game && window.game.renderer) {
      window.game.renderer.shakeCamera(4, 100);
    }
  }
  
  spawnHitEffect(x, y, attackType, attackerColor, attackerVelocityX = 0, damage = 0, attackerFacing = 1) {
    if (!window.game || !window.game.renderer) return;
    
    const renderer = window.game.renderer;
    const isHeavy = attackType === 'heavy';
    const isSpecial = attackType === 'special';
    const isLight = attackType === 'light' || attackType === 'light2' || attackType === 'light3';
    
    // Use attacker's color for particles
    const primaryColor = attackerColor;
    const secondaryColor = this.lightenColor(attackerColor, 40);
    const sparkColor = '#FFFFFF';
    const goldColor = '#FFD700';
    
    // === SLASH ARC (curved blade trail) ===
    // Direction: facing the defender (opposite of attacker's facing)
    const slashDir = -attackerFacing; // slash comes from attacker's side
    const slashAngle = slashDir > 0 ? -Math.PI / 6 : Math.PI - Math.PI / 6;
    const slashLength = isSpecial ? 110 : (isHeavy ? 85 : 60);
    const slashThickness = isSpecial ? 12 : (isHeavy ? 9 : 6);
    const slashLife = isSpecial ? 0.35 : (isHeavy ? 0.28 : 0.2);
    renderer.addSlash(x, y, slashAngle, slashLength, primaryColor, slashThickness, slashLife);
    
    // Secondary cross slash for heavy/special
    if (isHeavy || isSpecial) {
      const crossAngle = slashAngle + Math.PI / 2;
      renderer.addSlash(x, y, crossAngle, slashLength * 0.7, secondaryColor, slashThickness * 0.7, slashLife * 0.8);
    }
    
    // === SHOCKWAVE RING (expanding impact) ===
    const shockwaveCount = isSpecial ? 2 : (isHeavy ? 1 : 1);
    for (let i = 0; i < shockwaveCount; i++) {
      setTimeout(() => {
        if (!renderer || !renderer.particles) return;
        renderer.particles.push({
          type: 'shockwave',
          x, y,
          color: i === 0 ? primaryColor : secondaryColor,
          size: 6,
          maxRadius: isSpecial ? 70 : (isHeavy ? 50 : 30),
          thickness: isSpecial ? 4 : (isHeavy ? 3 : 2),
          life: isSpecial ? 0.35 : (isHeavy ? 0.28 : 0.2),
          maxLife: isSpecial ? 0.35 : (isHeavy ? 0.28 : 0.2),
          alpha: 1
        });
      }, i * 50);
    }
    
    // === SPARK BURST (radial streaks) ===
    const sparkCount = isSpecial ? 18 : (isHeavy ? 14 : 8);
    const moveDirection = attackerVelocityX > 0 ? 1 : (attackerVelocityX < 0 ? -1 : 0);
    for (let i = 0; i < sparkCount; i++) {
      const baseAngle = (Math.PI * 2 * i) / sparkCount;
      const moveBias = moveDirection * 0.4;
      const angle = baseAngle + (Math.random() - 0.5) * 0.6 + moveBias;
      
      const speed = isSpecial ? (8 + Math.random() * 10) : (isHeavy ? (6 + Math.random() * 8) : (4 + Math.random() * 5));
      const size = isSpecial ? (2.5 + Math.random() * 2) : (isHeavy ? (2 + Math.random() * 2) : (1.5 + Math.random() * 1.5));
      const life = isSpecial ? (0.5 + Math.random() * 0.3) : (isHeavy ? (0.4 + Math.random() * 0.25) : (0.3 + Math.random() * 0.2));
      
      const vx = Math.cos(angle) * speed * 30 + attackerVelocityX * 0.3;
      const vy = Math.sin(angle) * speed * 30 - 40;
      
      const color = i % 4 === 0 ? goldColor : (i % 3 === 0 ? sparkColor : (i % 2 === 0 ? primaryColor : secondaryColor));
      
      renderer.addParticle(
        x, y,
        color,
        { x: vx, y: vy },
        life,
        size,
        'spark',
        { gravity: 200 }
      );
    }
    
    // === CENTRAL FLARE (bright burst at impact point) ===
    renderer.particles.push({
      type: 'flare',
      x, y,
      color: isSpecial ? '#FFFFFF' : primaryColor,
      size: isSpecial ? 16 : (isHeavy ? 12 : 8),
      life: isSpecial ? 0.2 : (isHeavy ? 0.16 : 0.12),
      maxLife: isSpecial ? 0.2 : (isHeavy ? 0.16 : 0.12),
      alpha: 1
    });
    
    // === DAMAGE NUMBER ===
    if (damage > 0) {
      renderer.addDamageNumber(x, y - 30, damage, isHeavy || isSpecial);
    }
    
    // === DEBRIS (small chunks flying off) ===
    if (isHeavy || isSpecial) {
      const debrisCount = isSpecial ? 5 : 3;
      for (let i = 0; i < debrisCount; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
        const speed = 60 + Math.random() * 100;
        renderer.addParticle(
          x, y,
          i % 2 === 0 ? '#FFD700' : '#FF6B35',
          { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
          0.5 + Math.random() * 0.25,
          1.5 + Math.random() * 1.5,
          'circle',
          { gravity: 500 }
        );
      }
    }
    
    // === SCREEN SHAKE & FLASH ===
    if (isSpecial) {
      renderer.shakeCamera(18, 400);
      renderer.triggerScreenFlash('#FFFFFF', 180);
    } else if (isHeavy) {
      renderer.shakeCamera(12, 300);
      renderer.triggerScreenFlash('#FFFFFF', 150);
    } else {
      renderer.shakeCamera(5, 150);
      renderer.triggerScreenFlash(primaryColor, 80);
    }
  }
  
  // Helper to lighten a hex color
  lightenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return '#' + (0x1000000 + (R << 16) + (G << 8) + B).toString(16).slice(1);
  }
  
spawnBlockEffect(x, y, defenderColor) {
    if (!window.game || !window.game.renderer) return;
    
    const renderer = window.game.renderer;
    const primaryColor = defenderColor || '#D4AF37';
    const secondaryColor = this.lightenColor(primaryColor, 40);
    const sparkColor = '#FFFFFF';
    
    // Block spark burst - colored to defender
    for (let i = 0; i < 16; i++) {
      const angle = Math.PI + (Math.random() - 0.5) * Math.PI * 0.7;
      const speed = 6 + Math.random() * 10;
      renderer.addParticle(
        x, y, i % 3 === 0 ? sparkColor : (i % 2 === 0 ? primaryColor : secondaryColor),
        { x: Math.cos(angle) * speed * 35, y: Math.sin(angle) * speed * 35 - 40 },
        0.4 + Math.random() * 0.3,
        3 + Math.random() * 4
      );
    }
    
    // Parry flash ring
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        if (renderer && renderer.addParticle) {
          renderer.addParticle(
            x, y, i % 2 === 0 ? primaryColor : secondaryColor,
            { x: 0, y: 0 },
            0.15,
            12 + i * 8
          );
        }
      }, i * 15);
    }
    
    // Screen shake & flash
    renderer.shakeCamera(6, 180);
    renderer.triggerScreenFlash(primaryColor, 100);
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
      hitboxOffset: { x: 10, y: -5 },
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
      hitboxOffset: { x: 10, y: 0 },
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
      hitboxOffset: { x: 10, y: 5 },
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
      hitboxOffset: { x: 10, y: 0 },
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
      hitboxOffset: { x: 10, y: 5 },
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
      hitboxOffset: { x: 10, y: 5 },
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
      hitboxOffset: { x: 10, y: 15 },
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
      hitboxOffset: { x: 10, y: -10 },
      hitboxSize: { width: 50, height: 40 }
    }
  };
}