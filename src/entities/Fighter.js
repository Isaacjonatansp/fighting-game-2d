// Fighter entity - manages state, movement, attacks
import { CombatSystem } from '../systems/CombatSystem.js';

export class Fighter {
  constructor({ id, x, y, width, height, color, facing, character, controls }) {
    this.id = id;
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.facing = facing;
    this.character = character;
    this.controls = controls;
    
    this.maxHealth = 100;
    this.health = 100;
    this.maxStamina = 100;
    this.stamina = 100;
    
    this.velocityX = 0;
    this.velocityY = 0;
    this.onGround = true;
    this.canDoubleJump = true;
    
    this.state = 'idle';
    this.animFrame = 0;
    this.hitStun = 0;
    this.invincible = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    
    this.hitbox = null;
    this.hitboxActive = false;
    this.hitLanded = false;
    this.currentAttack = null;
    this.comboStep = 0;
    this.comboType = null;
    this.lastAttackTime = 0;
    this.damageMultiplier = 1;
    this.attackProgress = 0;
    this.attackDuration = 0;
    this.attackElapsed = 0;
    
    this.hurtbox = { x: this.x, y: this.y, width: this.width, height: this.height };
  }
  
  reset(x, y, facing) {
    this.x = x;
    this.y = y;
    this.facing = facing;
    this.health = this.maxHealth;
    this.stamina = this.maxStamina;
    this.velocityX = 0;
    this.velocityY = 0;
    this.onGround = true;
    this.canDoubleJump = true;
    this.state = 'idle';
    this.animFrame = 0;
    this.hitStun = 0;
    this.invincible = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.hitbox = null;
    this.hitboxActive = false;
    this.hitLanded = false;
    this.currentAttack = null;
    this.comboStep = 0;
    this.comboType = null;
    this.lastAttackTime = 0;
    this.damageMultiplier = 1;
  }
  
  update(dt, input, opponent, config) {
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    if (!this.currentAttack && this.state !== 'dash') {
      this.stamina = Math.min(this.maxStamina, this.stamina + 24 * dt);
    }

    if (this.hitStun > 0) {
      this.hitStun -= dt;
      if (this.hitStun <= 0) {
        this.setState('idle');
      }
      this.updateHurtbox();
      return;
    }
    
    if (this.state === 'dash') {
      this.updateDash(dt);
    } else if (this.state === 'attack' || this.state === 'attack2' || this.state === 'attack3' || 
        this.state === 'heavyAttack' || this.state === 'heavyAttack2' || this.state === 'special' ||
        this.state === 'airAttack' || this.state === 'crouchAttack') {
      this.updateAttack(dt);
    } else {
      this.handleMovement(input);
      this.handleAttacks(input);
      
      this.animFrame += dt;
    }
    
    this.updateHurtbox();
  }
  
  handleMovement(input) {
    const dir = input.getDirection(this.controls);
    const jumpPressed = input.isKeyJustPressed(this.controls.up);
    const actions = input.getActionState(this.controls);

    if (this.state === 'block') {
      if (!actions.block) {
        this.setState('idle');
      } else {
        this.velocityX = 0;
        return;
      }
    }

    if (actions.dash && this.onGround && this.dashCooldown <= 0) {
      this.startDash(dir.x || this.facing);
      return;
    }

    if (actions.block && this.onGround && this.state !== 'crouch') {
      this.velocityX = 0;
      this.invincible = false;
      this.setState('block');
      return;
    }
    
    // Horizontal movement (pixel per second based on PhysicsEngine moveSpeed)
    if (dir.x !== 0) {
      const speed = this.character === 'crimson' ? 360 : 300;
      this.velocityX = dir.x * speed;
      this.facing = dir.x;
      if (this.onGround && this.state !== 'walk') this.setState('walk');
    } else {
      if (this.onGround && this.state === 'walk') this.setState('idle');
    }
    
    // Jump (pixels per second upward)
    if (jumpPressed && this.onGround) {
      this.velocityY = -650;
      this.onGround = false;
      this.canDoubleJump = true;
      this.setState('jump');
    } else if (jumpPressed && !this.onGround && this.canDoubleJump) {
      this.velocityY = -550;
      this.canDoubleJump = false;
      this.setState('doubleJump');
    }
    
    if (dir.y > 0 && this.onGround) {
      this.setState('crouch');
    } else if (this.state === 'crouch' && dir.y <= 0) {
      this.setState('idle');
    }
  }
  
  handleAttacks(input) {
    const actions = input.getActionState(this.controls);
    
    if (this.state !== 'attack' && this.state !== 'attack2' && this.state !== 'attack3' && 
        this.state !== 'heavyAttack' && this.state !== 'heavyAttack2' && this.state !== 'special' &&
        this.state !== 'airAttack' && this.state !== 'crouchAttack' && this.state !== 'block' && this.state !== 'dash' &&
        this.hitStun <= 0) {
      if (actions.light) {
        if (!this.onGround) {
          this.startAttack(CombatSystem.ATTACKS.airLight, 'airAttack');
        } else if (this.state === 'crouch') {
          this.startAttack(CombatSystem.ATTACKS.crouchLight, 'crouchAttack');
        } else {
          this.startComboAttack('light');
        }
      } else if (actions.heavy) {
        this.startComboAttack('heavy');
      } else if (actions.special) {
        this.startAttack(CombatSystem.ATTACKS.special, 'special');
      }
    }
  }
  
  startComboAttack(type) {
    if (this.stamina < this.maxStamina * 0.5) {
      this.comboStep = 0;
      this.comboType = null;
      return false;
    }

    const now = performance.now();
    const timeSinceLastAttack = now - this.lastAttackTime;
    const canContinueCombo = timeSinceLastAttack <= 800 && this.comboStep > 0 && this.comboType === type;
    
    if (canContinueCombo && type === 'light' && this.comboStep < 3) {
      this.comboStep++;
    } else if (canContinueCombo && type !== 'light') {
      this.comboStep = this.comboStep >= 2 ? 1 : this.comboStep + 1;
    } else {
      this.comboStep = 1;
    }
    
    this.comboType = type;
    this.lastAttackTime = now;
    
    let attack, stateName;
    
    if (type === 'light') {
      if (this.comboStep === 1) {
        attack = CombatSystem.ATTACKS.light;
        stateName = 'attack';
      } else if (this.comboStep === 2) {
        attack = CombatSystem.ATTACKS.light2;
        stateName = 'attack2';
      } else if (this.comboStep >= 3) {
        attack = CombatSystem.ATTACKS.light3;
        stateName = 'attack3';
      }
    } else if (type === 'heavy') {
      if (this.comboStep === 1) {
        attack = CombatSystem.ATTACKS.heavy;
        stateName = 'heavyAttack';
      } else if (this.comboStep >= 2) {
        attack = CombatSystem.ATTACKS.heavy2;
        stateName = 'heavyAttack2';
      }
    }
    
    if (attack && !this.startAttack(attack, stateName)) {
      this.comboStep = 0;
      this.comboType = null;
    }

    return Boolean(attack);
  }
  
  startAttack(attack, stateName) {
    const staminaCost = this.getAttackStaminaCost(attack, stateName);
    if (this.stamina < staminaCost) return false;

    const staminaRatio = this.stamina / this.maxStamina;
    this.damageMultiplier = 0.35 + staminaRatio * 0.65;
    this.stamina -= staminaCost;
    this.currentAttack = attack;
    this.setState(stateName);
    this.animFrame = 0;
    this.hitLanded = false;
    this.velocityX = 0;
    this.attackProgress = 0;
    this.attackElapsed = 0;
    this.attackDuration = attack.startup + attack.active + attack.recovery;
    return true;
  }

  getAttackStaminaCost(attack, stateName) {
    if (stateName === 'special') return 34;
    if (stateName === 'heavyAttack' || stateName === 'heavyAttack2') return 22;
    if (stateName === 'airAttack' || stateName === 'crouchAttack') return 14;
    return attack.type === 'heavy' ? 22 : 11;
  }

  startDash(direction) {
    this.facing = direction === 0 ? this.facing : Math.sign(direction);
    // Increased dash distance for more impactful movement
    this.velocityX = this.facing * (this.character === 'crimson' ? 1300 : 1200);
    this.velocityY = 0;
    this.dashTimer = 0.32;
    this.dashCooldown = 0.45;
    this.invincible = true;
    this.setState('dash');

    // === DASH VISUAL EFFECTS ===
    this.dashTrail = []; // reset trail
    this.dashAfterimageTimer = 0;

    // Spawn initial burst of dash particles
    this.spawnDashStartEffect();
  }

  updateDash(dt) {
    this.dashTimer -= dt;
    this.animFrame += dt;

    // Continuously spawn trail particles while dashing
    this.spawnDashTrailEffect(dt);

    if (this.dashTimer <= 0) {
      this.velocityX = 0;
      this.invincible = false;
      this.setState('idle');
      // Final burst when dash ends
      this.spawnDashEndEffect();
    }
  }

  // === DASH EFFECT SPAWNERS ===
  spawnDashStartEffect() {
    if (!window.game || !window.game.renderer) return;
    const renderer = window.game.renderer;

    // Burst of sparks at feet (behind fighter)
    const fx = this.x + this.width / 2;
    const fy = this.y + this.height - 10;
    const burstDir = -this.facing;

    // Ground impact burst (8 particles flying back)
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * i) / 4 + Math.PI / 2; // backward semicircle
      const speed = 180 + Math.random() * 140;
      renderer.addParticle(
        fx, fy,
        i % 3 === 0 ? '#FFFFFF' : (i % 2 === 0 ? this.color : '#FFD700'),
        { x: Math.cos(angle) * speed * burstDir, y: -Math.abs(Math.sin(angle)) * speed * 0.6 },
        0.3 + Math.random() * 0.15,
        2 + Math.random() * 2,
        'spark',
        { gravity: 400 }
      );
    }

    // Quick shockwave ring
    renderer.addShockwave(fx, fy, this.color, 50, 4, 0.25);

    // Bright flash at start
    renderer.particles.push({
      type: 'flare',
      x: fx, y: fy,
      color: '#FFFFFF',
      size: 14,
      life: 0.15,
      maxLife: 0.15,
      alpha: 1
    });

    // Camera shake
    renderer.shakeCamera(4, 120);
  }

  spawnDashTrailEffect(dt) {
    if (!window.game || !window.game.renderer) return;
    const renderer = window.game.renderer;

    this.dashAfterimageTimer += dt;
    // Throttle trail spawn to every 0.04s instead of every frame
    if (this.dashAfterimageTimer < 0.04) return;
    this.dashAfterimageTimer = 0;

    const fx = this.x + this.width / 2 - this.facing * (this.width * 0.3);
    const fy = this.y + this.height / 2;

    // Trail particle: 1 streak behind the fighter
    renderer.addParticle(
      fx,
      fy + (Math.random() - 0.5) * this.height * 0.6,
      Math.random() > 0.5 ? this.color : '#FFD700',
      { x: -this.facing * 50, y: (Math.random() - 0.5) * 20 },
      0.2,
      2,
      'spark',
      { gravity: 0 }
    );
  }

  spawnDashEndEffect() {
    if (!window.game || !window.game.renderer) return;
    const renderer = window.game.renderer;

    const fx = this.x + this.width / 2;
    const fy = this.y + this.height / 2;

    // Small spark puff at end
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const speed = 80 + Math.random() * 60;
      renderer.addParticle(
        fx, fy,
        i % 2 === 0 ? this.color : '#FFD700',
        { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        0.3,
        2 + Math.random() * 2,
        'spark',
        { gravity: 200 }
      );
    }

    // Afterimage slash arc (subtle whoosh)
    renderer.addSlash(
      fx, fy,
      -this.facing > 0 ? -Math.PI / 6 : Math.PI - Math.PI / 6,
      40,
      this.color,
      4,
      0.18
    );
  }
  
  updateAttack(dt) {
    this.animFrame += dt;
    
    const attack = this.currentAttack;
    if (!attack) {
      this.setState('idle');
      return;
    }
    
    const totalDuration = attack.startup + attack.active + attack.recovery;
    this.attackDuration = totalDuration;
    this.attackElapsed += dt;
    this.attackProgress = Math.min(1, this.attackElapsed / totalDuration);
    
    if (this.animFrame < attack.startup) {
      this.hitboxActive = false;
      this.hitbox = null;
    } else if (this.animFrame < attack.startup + attack.active) {
      this.hitboxActive = true;
      this.updateHitbox(attack);
    } else if (this.animFrame < attack.startup + attack.active + attack.recovery) {
      this.hitboxActive = false;
      this.hitbox = null;
    } else {
      this.hitbox = null;
      this.hitboxActive = false;
      this.currentAttack = null;
      this.hitLanded = false;
      this.attackProgress = 0;
      this.attackElapsed = 0;
      this.attackDuration = 0;
      
      const now = performance.now();
      if (now - this.lastAttackTime > 800) {
        this.comboStep = 0;
        this.comboType = null;
      }
      
      if (this.onGround) {
        this.setState('idle');
      } else {
        this.setState('jump');
      }
    }
  }
  
  updateHitbox(attack) {
    const offset = attack.hitboxOffset;
    const size = attack.hitboxSize;

    const centerX = this.x + this.width / 2;
    const bottomY = this.y + this.height;
    const handY = bottomY - 40;
    const frontEdgeX = centerX + (this.facing === 1 ? 40 : -40);

    this.hitbox = {
      x: this.facing === 1
        ? frontEdgeX + offset.x
        : frontEdgeX - offset.x - size.width,
      y: handY + offset.y,
      width: size.width,
      height: size.height
    };
  }

  updateHurtbox() {
    const centerX = this.x + this.width / 2;
    const bottomY = this.y + this.height;
    this.hurtbox = {
      x: centerX - 40,
      y: bottomY - 80,
      width: 80,
      height: 80
    };
  }
  
  setState(newState) {
    const attackStates = ['attack', 'attack2', 'attack3', 'heavyAttack', 'heavyAttack2', 'special', 'airAttack', 'crouchAttack'];
    if (this.state === newState && !attackStates.includes(newState)) return;
    this.state = newState;
    this.animFrame = 0;
  }
  
  takeDamage(damage) {
    this.health -= damage;
    if (this.health < 0) this.health = 0;
  }
  
  render(renderer, inputManager) {
    renderer.drawFighter(this);
    
    if (inputManager && inputManager.isKeyPressed('KeyH')) {
      renderer.drawHurtbox(this.hurtbox);
      if (this.hitboxActive) {
        renderer.drawHitbox(this.hitbox);
      }
    }
  }
}
