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
    const attackType = attacker.currentAttack ? attacker.currentAttack.type : 'attack';

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
      window.game.registerHit(attacker.id, damage, attackType);
    }
    
    // Visual effects - use attacker's color & movement
    const attackerColor = attacker.color || '#D4AF37';
    const defenderX = defender.x + defender.width / 2;
    const defenderY = defender.y + defender.height / 2;
    const attackerFacing = attacker.facing;

    this.lastDefenderId = defender.id;

    this.spawnHitEffect(defenderX, defenderY, attackType, attackerColor, attacker.velocityX, damage, attackerFacing);
  }
  
  onBlock(attacker, defender) {
    // Reduced knockback on block
    const direction = attacker.facing;
    defender.velocityX = 3 * direction;

    // Small blockstun
    defender.hitStun = 0.15;

    // Push attacker back slightly
    attacker.velocityX = -2 * direction;

    // Visual effects
    this.spawnBlockEffect(defender.x + defender.width / 2, defender.y + defender.height / 2, defender.color, direction);
  }
  
  spawnHitEffect(x, y, attackType, attackerColor, attackerVelocityX = 0, damage = 0, attackerFacing = 1) {
    if (!window.game || !window.game.renderer) return;

    const renderer = window.game.renderer;
    const isHeavy = attackType === 'heavy';
    const isSpecial = attackType === 'special';
    const isLight = attackType === 'light' || attackType === 'light2' || attackType === 'light3';

    // Power tier drives every scale value below.
    const power = isSpecial ? 2 : (isHeavy ? 1.4 : 1);

    const primaryColor = attackerColor;
    const secondaryColor = this.lightenColor(attackerColor, 40);
    const sparkColor = '#FFFFFF';
    const goldColor = '#FFD700';

    // Impact point gets nudged in the direction of the blow so the FX read
    // as coming *from* the attacker rather than being centred on the body.
    const impactX = x + attackerFacing * 8;
    const impactY = y - 4;

    // Direction the blade travelled (attacker -> defender).
    const travelDir = attackerFacing;

    // === A. SWING ARC ======================================================
    // The blade trail sweeps across the impact point instead of sitting still.
    const slashAngle = travelDir > 0 ? -Math.PI / 7 : Math.PI + Math.PI / 7;
    const slashLength = 52 * power;
    const slashThickness = 5 * power;
    const slashLife = 0.2 + 0.1 * power;
    renderer.addSlash(impactX, impactY, slashAngle, slashLength, primaryColor, slashThickness, slashLife, { arc: Math.PI * 0.75 });

    // Reverse-angle echo, slightly delayed, gives a "double-edge" swing read.
    const echoAngle = slashAngle + (travelDir > 0 ? 0.45 : -0.45);
    renderer.addSlash(impactX, impactY, echoAngle, slashLength * 0.8, secondaryColor, slashThickness * 0.6, slashLife * 0.9, { arc: Math.PI * 0.6 });

    // Cross slash only on the big hits — keeps it feeling like a finisher.
    if (isHeavy || isSpecial) {
      renderer.addCrossSlash(impactX, impactY, goldColor, 46 * power, 7 * power, 0.26, Math.PI / 4);
    }

    // === B. IMPACT FLASH ===================================================
    renderer.particles.push({
      type: 'flare',
      x: impactX,
      y: impactY,
      color: isSpecial ? '#FFFFFF' : primaryColor,
      size: 10 * power,
      life: 0.1 + 0.06 * power,
      maxLife: 0.1 + 0.06 * power,
      alpha: 1
    });

    // === C. SHOCKWAVES =====================================================
    // Staggered rings read as a shock traveling outward.
    const waveCount = isSpecial ? 3 : (isHeavy ? 2 : 1);
    const maxRadius = 26 * power + Math.min(damage, 24) * 1.6;
    for (let i = 0; i < waveCount; i++) {
      renderer.addShockwave(
        impactX,
        impactY,
        i === 0 ? '#FFFFFF' : (i % 2 === 0 ? secondaryColor : primaryColor),
        maxRadius * (1 + i * 0.55),
        (3.5 - i * 0.8) * power,
        0.22 + 0.08 * power,
        i * 45
      );
    }

    // Ground-hugging ring for heavy/special — sells the weight.
    if (isHeavy || isSpecial) {
      renderer.particles.push({
        type: 'shockwave',
        x: impactX,
        y,
        color: goldColor,
        size: 4,
        radius: 4,
        maxRadius: maxRadius * 1.4,
        thickness: 2,
        life: 0.3,
        maxLife: 0.3,
        progress: 0,
        alpha: 1
      });
    }

    // === D. SPARK BURST ====================================================
    // Biased along the attack direction so sparks fly *through* the target.
    const sparkCount = isSpecial ? 22 : (isHeavy ? 16 : 10);
    for (let i = 0; i < sparkCount; i++) {
      const baseAngle = (Math.PI * 2 * i) / sparkCount;
      const angle = baseAngle + (Math.random() - 0.5) * 0.7;

      // Push the distribution toward the attack direction.
      const bias = travelDir * (0.6 + Math.random() * 0.9);
      const vx = (Math.cos(angle) + bias) * (110 + Math.random() * 320) * power;
      const vy = (Math.sin(angle) - 0.35) * (110 + Math.random() * 260) * power;

      const size = (1.6 + Math.random() * 2.4) * power;
      const life = 0.28 + Math.random() * 0.32;

      const roll = i % 5;
      const color = roll === 0 ? goldColor
        : roll === 1 ? sparkColor
        : roll === 2 ? primaryColor
        : roll === 3 ? secondaryColor
        : sparkColor;

      renderer.addParticle(
        impactX, impactY,
        color,
        { x: vx, y: vy },
        life,
        size,
        'spark',
        { gravity: 480 }
      );
    }

    // === E. SPEED LINES ====================================================
    // Horizontal streaks that emphasize the strike direction.
    renderer.addSpeedLines(
      impactX - travelDir * 60,
      impactY,
      travelDir,
      isSpecial ? 10 : (isHeavy ? 7 : 4),
      isSpecial ? goldColor : '#FFFFFF',
      110 + 40 * power
    );

    // === F. DEBRIS =========================================================
    // Chunky shards tumbling off — reads heavier than round circles.
    if (isHeavy || isSpecial) {
      renderer.addDebris(
        impactX,
        impactY,
        goldColor,
        isSpecial ? 7 : 4,
        -Math.PI / 2 + (attackerFacing > 0 ? -0.5 : 0.5),
        Math.PI * 0.9,
        200 * power
      );
    }

    // === G. SPIRIT WISPS (special only) ====================================
    if (isSpecial) {
      renderer.addSpirits(impactX, impactY, primaryColor, 12, 70);
      renderer.addSpirits(impactX, impactY, goldColor, 6, 45);
    }

    // === H. DAMAGE NUMBER ==================================================
    if (damage > 0) {
      renderer.addDamageNumber(x, y - 30, damage, isHeavy || isSpecial);
    }

    // === I. CAMERA JUICE ===================================================
    // One bundled call: shake + zoom punch + radial flash + vignette.
    renderer.impact({
      x: impactX,
      y: impactY,
      shake: 5 * power * (isSpecial ? 1.6 : 1),
      shakeDuration: 0.2 + 0.14 * power,
      zoom: isSpecial ? 0.055 : (isHeavy ? 0.035 : 0.014),
      zoomDuration: isSpecial ? 0.26 : 0.18,
      flashColor: isSpecial ? '#FFFFFF' : this.lightenColor(primaryColor, 60),
      flashRadius: 40 * power + damage * 1.2,
      flashDuration: 0.16 + 0.08 * power,
      vignetteColor: isSpecial ? '#FFD700' : (isHeavy ? '#FF3D00' : null),
      vignetteStrength: isSpecial ? 0.5 : (isHeavy ? 0.34 : 0),
      vignetteDuration: isSpecial ? 0.4 : 0.3,
      screenFlashColor: isSpecial ? '#FFFFFF' : null,
      screenFlashDuration: isSpecial ? 130 : 0
    });

    // Body flash on the defender so the hit reads even on dark sprites.
    if (isHeavy || isSpecial) {
      renderer.flashFighter(this.lastDefenderId, 0.14);
    } else {
      renderer.flashFighter(this.lastDefenderId, 0.08);
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
  
  spawnBlockEffect(x, y, defenderColor, incomingDir = 1) {
    if (!window.game || !window.game.renderer) return;

    const renderer = window.game.renderer;
    const primaryColor = defenderColor || '#D4AF37';
    const secondaryColor = this.lightenColor(primaryColor, 50);
    const sparkColor = '#FFFFFF';

    // Spark shower spraying back toward the attacker.
    for (let i = 0; i < 18; i++) {
      const angle = (Math.random() - 0.5) * Math.PI * 1.15;
      const speed = 180 + Math.random() * 340;
      const vx = -incomingDir * Math.abs(Math.cos(angle)) * speed;
      const vy = (Math.sin(angle) - 0.25) * speed * 0.8;

      renderer.addParticle(
        x, y,
        i % 3 === 0 ? sparkColor : (i % 2 === 0 ? primaryColor : secondaryColor),
        { x: vx, y: vy },
        0.28 + Math.random() * 0.28,
        1.8 + Math.random() * 2.6,
        'spark',
        { gravity: 420 }
      );
    }

    // Guardian ring — flat ellipse so it reads as a shield, not an explosion.
    renderer.particles.push({
      type: 'shockwave',
      x, y,
      color: secondaryColor,
      size: 10,
      radius: 10,
      maxRadius: 52,
      thickness: 3,
      life: 0.26,
      maxLife: 0.26,
      progress: 0,
      alpha: 1
    });

    // Guard flash flare
    renderer.particles.push({
      type: 'flare',
      x, y,
      color: sparkColor,
      size: 11,
      life: 0.12,
      maxLife: 0.12,
      alpha: 1
    });

    // Tight, punchy camera feedback — noticeably weaker than a real hit.
    renderer.impact({
      x, y,
      shake: 4.5,
      shakeDuration: 0.16,
      zoom: 0.012,
      zoomDuration: 0.12,
      flashColor: secondaryColor,
      flashRadius: 26,
      flashDuration: 0.14
    });
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