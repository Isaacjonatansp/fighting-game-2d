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
    
    this.hurtbox = { x: this.x, y: this.y, width: this.width, height: this.height };
    
    // 3D animation state flags
    this.isAttacking = false;
    this.isBlocking = false;
    this.isDashing = false;
    this.isHit = false;
    
    // Velocity aliases for 3D renderer
    Object.defineProperty(this, 'velX', {
      get: () => this.velocityX,
      set: (v) => { this.velocityX = v; }
    });
    Object.defineProperty(this, 'velY', {
      get: () => this.velocityY,
      set: (v) => { this.velocityY = v; }
    });
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

    // Handle hitstun
    if (this.hitStun > 0) {
      this.hitStun -= dt;
      if (this.hitStun <= 0) {
        this.setState('idle');
      }
      this.updateHurtbox();
      return;
    }
    
    // Handle state-based logic
    if (this.state === 'dash') {
      this.updateDash(dt);
    } else if (this.state === 'attack' || this.state === 'attack2' || this.state === 'attack3' || 
        this.state === 'heavyAttack' || this.state === 'heavyAttack2' || this.state === 'special' ||
        this.state === 'airAttack' || this.state === 'crouchAttack') {
      this.updateAttack(dt);
    } else {
      this.handleMovement(input);
      this.handleAttacks(input);
      
      // Update animation frame for non-attack states
      this.animFrame += dt;
    }
    
    // Update hurtbox
    this.updateHurtbox();
  }
  
  handleMovement(input) {
    const dir = input.getDirection(this.controls);
    const jumpPressed = input.isKeyJustPressed(this.controls.up);
    const actions = input.getActionState(this.controls);

    if (this.state === 'block') {
      if (!actions.block) {
        this.setState('idle');
        this.isBlocking = false;
      } else {
        this.velocityX = 0;
        this.isBlocking = true;
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
      this.isBlocking = true;
      return;
    }
    
    // Horizontal movement
    if (dir.x !== 0) {
      const movementSpeed = this.character === 'crimson' ? 6.5 : 5.4;
      this.velocityX = dir.x * movementSpeed;
      this.facing = dir.x;
      if (this.onGround && this.state !== 'walk') this.setState('walk');
    } else {
      if (this.onGround && this.state === 'walk') this.setState('idle');
    }
    
    // Jump
    if (jumpPressed && this.onGround) {
      this.velocityY = -15;
      this.onGround = false;
      this.canDoubleJump = true;
      this.setState('jump');
    } else if (jumpPressed && !this.onGround && this.canDoubleJump) {
      // Double jump
      this.velocityY = -13;
      this.canDoubleJump = false;
      this.setState('doubleJump');
    }
    
    // Crouch
    if (dir.y > 0 && this.onGround) {
      this.setState('crouch');
    } else if (this.state === 'crouch' && dir.y <= 0) {
      this.setState('idle');
    }
  }
  
  handleAttacks(input) {
    const actions = input.getActionState(this.controls);
    
    // Only allow new attacks if not already attacking or in hitstun
    if (this.state !== 'attack' && this.state !== 'attack2' && this.state !== 'attack3' && 
        this.state !== 'heavyAttack' && this.state !== 'heavyAttack2' && this.state !== 'special' &&
        this.state !== 'airAttack' && this.state !== 'crouchAttack' && this.state !== 'block' && this.state !== 'dash' &&
        this.hitStun <= 0) {
      if (actions.light) {
        if (!this.onGround) {
          // Air light attack
          this.startAttack(CombatSystem.ATTACKS.airLight, 'airAttack');
        } else if (this.state === 'crouch') {
          // Crouch light attack
          this.startAttack(CombatSystem.ATTACKS.crouchLight, 'crouchAttack');
        } else {
          // Standing light combo
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
    
    // Light attacks have exactly three steps. A late input or a different
    // attack type always starts a fresh sequence.
    if (canContinueCombo && type === 'light' && this.comboStep < 3) {
      this.comboStep++;
    } else if (canContinueCombo && type !== 'light') {
      this.comboStep = this.comboStep >= 2 ? 1 : this.comboStep + 1;
    } else {
      this.comboStep = 1;
    }
    
    this.comboType = type;
    this.lastAttackTime = now;
    
    // Select attack based on combo step and type
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
    this.velocityX = 0; // Stop movement during attack
    this.isAttacking = true;
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
    // Longer dash with more distance
    this.velocityX = this.facing * (this.character === 'crimson' ? 22 : 20);
    this.velocityY = 0;
    this.dashTimer = 0.25;
    this.dashCooldown = 0.5;
    this.invincible = true;
    this.setState('dash');
    this.isDashing = true;
  }

  updateDash(dt) {
    this.dashTimer -= dt;
    this.animFrame += dt;
    if (this.dashTimer <= 0) {
      this.velocityX = 0;
      this.invincible = false;
      this.setState('idle');
      this.isDashing = false;
    }
  }
  
  updateAttack(dt) {
    this.animFrame += dt;
    
    const attack = this.currentAttack;
    if (!attack) {
      this.setState('idle');
      return;
    }
    
    // Check attack phases
    if (this.animFrame < attack.startup) {
      // Startup
      this.hitboxActive = false;
      this.hitbox = null;
    } else if (this.animFrame < attack.startup + attack.active) {
      // Active
      this.hitboxActive = true;
      this.updateHitbox(attack);
    } else if (this.animFrame < attack.startup + attack.active + attack.recovery) {
      // Recovery
      this.hitboxActive = false;
      this.hitbox = null;
    } else {
      // Finished - check if we can chain into next combo
      this.hitbox = null;
      this.hitboxActive = false;
      this.currentAttack = null;
      this.hitLanded = false;
      this.isAttacking = false;
      
      // Reset combo if too much time passed
      const now = performance.now();
      if (now - this.lastAttackTime > 800) {
        this.comboStep = 0;
        this.comboType = null;
      }
      
      // Return to appropriate state
      if (this.onGround) {
        if (this.state === 'airAttack' || this.state === 'crouchAttack') {
          this.setState('idle');
        } else {
          this.setState('idle');
        }
      } else {
        this.setState('jump');
      }
    }
  }
  
  updateHitbox(attack) {
    const offset = attack.hitboxOffset;
    const size = attack.hitboxSize;
    
    this.hitbox = {
      x: this.x + (this.facing === 1 ? offset.x : -offset.x - size.width + this.width),
      y: this.y + offset.y,
      width: size.width,
      height: size.height
    };
  }
  
  updateHurtbox() {
    this.hurtbox = {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
  
  setState(newState, duration = 0) {
    if (this.state === newState && newState !== 'attack' && newState !== 'attack2' && newState !== 'attack3' && newState !== 'heavyAttack' && newState !== 'heavyAttack2' && newState !== 'special' && newState !== 'airAttack' && newState !== 'crouchAttack') return;
    this.state = newState;
    this.animFrame = 0;
  }
  
  takeDamage(damage) {
    this.health -= damage;
    if (this.health < 0) this.health = 0;
    this.isHit = true;
    // Reset hit flag after short delay
    setTimeout(() => { this.isHit = false; }, 300);
  }
  
  render(renderer, inputManager) {
    // Delegate to renderer
    renderer.drawFighter(this);
    
    // Debug hitboxes
    if (inputManager.isKeyPressed('KeyH')) {
      renderer.drawHurtbox(this.hurtbox);
      if (this.hitboxActive) {
        renderer.drawHitbox(this.hitbox);
      }
    }
  }
}