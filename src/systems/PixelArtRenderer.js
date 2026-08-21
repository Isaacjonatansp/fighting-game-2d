// Pixel Art Fighter Renderer - Creates detailed pixel art style characters
export class PixelArtRenderer {
  constructor(config) {
    this.config = config;
    this.canvas = config.canvas;
    this.ctx = this.canvas.getContext('2d');
    this.width = config.width;
    this.height = config.height;
    
    // Character sprite data - each character has unique colors and details
    this.characterSprites = {
      // Player 1 - Crimson Warrior
      crimson: {
        name: 'Crimson Warrior',
        skin: '#E8C5A0',
        skinDark: '#D4A57A',
        primary: '#C0392B',
        primaryLight: '#E74C3C',
        primaryDark: '#922B21',
        secondary: '#F39C12',
        secondaryLight: '#F7DC6F',
        accent: '#FFFFFF',
        outline: '#1A0307',
        hair: '#5D2E1E',
        hairDark: '#3D1E10',
        eye: '#2E86C1',
        eyeGlow: '#85C1E9',
        // Animation frames data
        idleFrames: 4,
        walkFrames: 6,
        jumpFrames: 3,
        crouchFrames: 2,
        attackFrames: 5,
        heavyAttackFrames: 6,
        airAttackFrames: 4,
        crouchAttackFrames: 4,
        specialFrames: 7,
        blockFrames: 2,
        hitFrames: 3,
      },
      // Player 2 - Azure Knight
      azure: {
        name: 'Undead Kyokushin',
        skin: '#E8C5A0',
        skinDark: '#D4A57A',
        primary: '#2980B9',
        primaryLight: '#3498DB',
        primaryDark: '#1F618D',
        secondary: '#8E44AD',
        secondaryLight: '#D2B4DE',
        accent: '#FFFFFF',
        outline: '#1A0307',
        hair: '#1C2833',
        hairDark: '#0B0F14',
        eye: '#F39C12',
        eyeGlow: '#F7DC6F',
        idleFrames: 4,
        walkFrames: 6,
        jumpFrames: 3,
        crouchFrames: 2,
        attackFrames: 5,
        heavyAttackFrames: 6,
        airAttackFrames: 4,
        crouchAttackFrames: 4,
        specialFrames: 7,
        blockFrames: 2,
        hitFrames: 3,
      },
      // Player 3 - Emerald Ninja
      emerald: {
        name: 'Emerald Ninja',
        skin: '#E8C5A0',
        skinDark: '#D4A57A',
        primary: '#27AE60',
        primaryLight: '#2ECC71',
        primaryDark: '#1E8449',
        secondary: '#E67E22',
        secondaryLight: '#FAD7A0',
        accent: '#FFFFFF',
        outline: '#1A0307',
        hair: '#1C2833',
        hairDark: '#0B0F14',
        eye: '#E74C3C',
        eyeGlow: '#FADBD8',
        idleFrames: 4,
        walkFrames: 6,
        jumpFrames: 3,
        crouchFrames: 2,
        attackFrames: 5,
        heavyAttackFrames: 6,
        airAttackFrames: 4,
        crouchAttackFrames: 4,
        specialFrames: 7,
        blockFrames: 2,
        hitFrames: 3,
      },
      // Player 4 - Violet Mage
      violet: {
        name: 'Violet Mage',
        skin: '#E8C5A0',
        skinDark: '#D4A57A',
        primary: '#8E44AD',
        primaryLight: '#9B59B6',
        primaryDark: '#6C3483',
        secondary: '#E74C3C',
        secondaryLight: '#FADBD8',
        accent: '#FFFFFF',
        outline: '#1A0307',
        hair: '#4A235A',
        hairDark: '#2D1437',
        eye: '#F39C12',
        eyeGlow: '#F7DC6F',
        idleFrames: 4,
        walkFrames: 6,
        jumpFrames: 3,
        crouchFrames: 2,
        attackFrames: 5,
        heavyAttackFrames: 6,
        airAttackFrames: 4,
        crouchAttackFrames: 4,
        specialFrames: 7,
        blockFrames: 2,
        hitFrames: 3,
      }
    };
    
    // Current character selection
    this.currentCharacter = 'crimson';

    // CC0 character poses from Kenney's Platformer Characters pack.
    this.spriteAssets = {
      crimson: {
        root: '/assets/kenney-platformer/PNG/Adventurer/Poses/',
        prefix: 'adventurer_'
      },
      azure: {
        root: '/assets/kenney-platformer/PNG/Zombie/Poses/',
        prefix: 'zombie_'
      }
    };
    this.loadedSpriteAssets = new Map();
    this.loadSpriteAssets();
    
    // Animation timing
    this.animSpeed = {
      idle: 0.15,
      walk: 0.12,
      jump: 0.1,
      crouch: 0.2,
      attack: 0.08,
      heavyAttack: 0.07,
      airAttack: 0.08,
      crouchAttack: 0.08,
      special: 0.06,
      block: 0.2,
      hit: 0.1,
    };
    
    // Particle effects
    this.particles = [];
    this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
    this.screenFlash = { active: false, color: '#FFFFFF', alpha: 0, duration: 0, elapsed: 0 };
  }
  
  // Get character sprite data
  getSprite(characterKey) {
    return this.characterSprites[characterKey] || this.characterSprites.crimson;
  }
  
  // Set character for a fighter
  setCharacter(fighter, characterKey) {
    fighter.character = characterKey;
    fighter.sprite = this.getSprite(characterKey);
  }

  loadSpriteAssets() {
    for (const [characterKey, asset] of Object.entries(this.spriteAssets)) {
      const poseNames = ['idle', 'stand', 'walk1', 'walk2', 'jump', 'duck', 'hurt', 'kick', 'hold1', 'hold2'];
      for (const poseName of poseNames) {
        const image = new Image();
        image.src = `${asset.root}${asset.prefix}${poseName}.png`;
        image.onload = () => this.loadedSpriteAssets.set(`${characterKey}:${poseName}`, image);
      }
    }
  }
  
  // Main draw function
  drawFighter(fighter) {
    const { x, y, width, height, facing, state, animFrame, character, sprite, color } = fighter;
    const cx = x + width / 2;
    const cy = y + height / 2;
    
    // Use character sprite or fallback to color-based
    const spr = sprite || this.getSprite(character || 'crimson');
    
    this.ctx.save();
    this.ctx.translate(cx + this.screenShake.x, cy + this.screenShake.y);
    if (facing === -1) this.ctx.scale(-1, 1);
    
    // Calculate current animation frame
    const frameIndex = this.getAnimFrame(fighter, state, animFrame);
    
    // Draw character based on state
    this.drawCharacter(fighter, spr, frameIndex, state);
    
    this.ctx.restore();
  }
  
  // Get current animation frame index
  getAnimFrame(fighter, state, animFrame) {
    const spr = fighter.sprite || this.getSprite(fighter.character || 'crimson');
    const speed = this.animSpeed[state] || this.animSpeed.idle;
    let maxFrames = spr.idleFrames;
    
    switch (state) {
      case 'idle': maxFrames = spr.idleFrames; break;
      case 'walk': maxFrames = spr.walkFrames; break;
      case 'jump':
      case 'doubleJump': maxFrames = spr.jumpFrames; break;
      case 'crouch': maxFrames = spr.crouchFrames; break;
      case 'attack':
      case 'attack2':
      case 'attack3': maxFrames = spr.attackFrames; break;
      case 'heavyAttack':
      case 'heavyAttack2': maxFrames = spr.heavyAttackFrames; break;
      case 'airAttack': maxFrames = spr.airAttackFrames; break;
      case 'crouchAttack': maxFrames = spr.crouchAttackFrames; break;
      case 'special': maxFrames = spr.specialFrames; break;
      case 'block': maxFrames = spr.blockFrames; break;
      case 'hit': maxFrames = spr.hitFrames; break;
    }
    
    const frame = Math.floor(animFrame / speed) % maxFrames;
    return frame;
  }

  getSpritePose(fighter, state, frame) {
    const characterKey = fighter.character === 'azure' ? 'azure' : 'crimson';
    if (state === 'dash') return frame % 2 === 0 ? 'walk1' : 'walk2';
    if (state === 'walk') return frame % 2 === 0 ? 'walk1' : 'walk2';
    if (state === 'block') return frame % 2 === 0 ? 'hold1' : 'hold2';
    if (state === 'jump' || state === 'doubleJump') return 'jump';
    if (state === 'crouch' || state === 'crouchAttack') return 'duck';
    if (state === 'hit') return 'hurt';
    if (state === 'attack' || state === 'attack2' || state === 'special') return 'kick';
    if (state === 'attack3' || state === 'heavyAttack' || state === 'heavyAttack2' || state === 'airAttack') return 'kick';
    return state === 'idle' && frame % 2 === 0 ? 'idle' : 'stand';
  }

  drawSpriteCharacter(fighter, state, frame) {
    const characterKey = fighter.character === 'azure' ? 'azure' : 'crimson';
    const poseName = this.getSpritePose(fighter, state, frame);
    const image = this.loadedSpriteAssets.get(`${characterKey}:${poseName}`);
    if (!image) return false;

    const imageWidth = 110;
    const imageHeight = 151;
    const floorAnchor = 60;
    const isLightCombo = state === 'attack' || state === 'attack2' || state === 'attack3';
    const comboStep = state === 'attack2' ? 2 : (state === 'attack3' ? 3 : 1);
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.globalAlpha = state === 'hit' ? 0.9 : 1;
    if (state === 'dash') {
      this.ctx.globalAlpha = 0.18;
      this.ctx.translate(-fighter.facing * 18, 0);
      this.ctx.drawImage(image, -imageWidth / 2, floorAnchor - imageHeight, imageWidth, imageHeight);
      this.ctx.globalAlpha = 0.35;
      this.ctx.translate(fighter.facing * 9, 0);
      this.ctx.drawImage(image, -imageWidth / 2, floorAnchor - imageHeight, imageWidth, imageHeight);
      this.ctx.globalAlpha = 1;
      this.ctx.translate(fighter.facing * 9, 0);
    } else if (isLightCombo && comboStep === 2) {
      this.ctx.translate(fighter.facing * 5, -3);
      this.ctx.rotate(fighter.facing * -0.1);
      this.ctx.scale(1.04, 1.04);
    } else if (isLightCombo && comboStep === 3) {
      this.ctx.translate(fighter.facing * 9, -7);
      this.ctx.rotate(fighter.facing * 0.18);
      this.ctx.scale(1.08, 1.08);
    }
    this.ctx.drawImage(image, -imageWidth / 2, floorAnchor - imageHeight, imageWidth, imageHeight);
    this.ctx.restore();
    return true;
  }

  drawBlockyCharacter(fighter, spr, frame, state) {
    const isCapoeira = fighter.id === 1 || fighter.character === 'crimson';
    const primary = isCapoeira ? '#D94A3A' : '#3D8FC7';
    const primaryDark = isCapoeira ? '#7E201A' : '#1D4F72';
    const primaryLight = isCapoeira ? '#FF8A65' : '#8BD3FF';
    const skin = '#E8C5A0';
    const skinDark = '#B97956';
    const accent = isCapoeira ? '#F7C948' : '#F2F4F7';
    const phase = fighter.animFrame * (isCapoeira ? 14 : 10);
    const moving = state === 'walk' || state === 'dash';
    const attacking = state === 'attack' || state === 'attack2' || state === 'attack3' ||
      state === 'heavyAttack' || state === 'heavyAttack2' || state === 'airAttack' || state === 'crouchAttack' || state === 'special';
    const step = moving ? Math.sin(phase) : 0;
    const crouch = state === 'crouch' || state === 'crouchAttack';
    const airborne = state === 'jump' || state === 'doubleJump' || state === 'airAttack';
    const comboStep = state === 'attack2' ? 2 : (state === 'attack3' ? 3 : 1);
    const attackDuration = fighter.currentAttack
      ? fighter.currentAttack.startup + fighter.currentAttack.active + fighter.currentAttack.recovery
      : 1;
    const attackProgress = attacking ? Math.min(1, fighter.animFrame / attackDuration) : 0;
    const strike = Math.sin(attackProgress * Math.PI);
    const bob = airborne ? 0 : Math.sin(phase) * (isCapoeira ? 1.5 : 0.5);
    const floor = 60;
    const hipY = crouch ? 25 : 18;
    const legGap = isCapoeira ? 10 : 8;
    const leftLegX = -legGap + (isCapoeira ? step * 5 : step * 2);
    const rightLegX = legGap - (isCapoeira ? step * 5 : step * 2);
    const leftLegLift = airborne ? -5 : Math.max(0, step * (isCapoeira ? 4 : 2));
    const rightLegLift = airborne ? -5 : Math.max(0, -step * (isCapoeira ? 4 : 2));
    const blocking = state === 'block';
    const leftArmAngle = blocking
      ? (isCapoeira ? 1.15 : 0.8)
      : attacking
        ? (isCapoeira ? (comboStep === 3 ? -1.15 + strike * 0.55 : 0.8 - strike * 1.1) : (comboStep === 3 ? -0.7 + strike * 0.35 : 0.25 - strike * 0.65))
        : (isCapoeira ? 0.6 + step * 0.3 : 0.3);
    const rightArmAngle = blocking
      ? (isCapoeira ? -1.15 : -0.8)
      : attacking
        ? (isCapoeira ? (comboStep === 2 ? -0.95 + strike * 0.45 : 0.9 - strike * 1.1) : (comboStep === 2 ? -0.65 + strike * 0.3 : -0.3 + strike * 0.5))
        : (isCapoeira ? -0.55 - step * 0.3 : -0.45);
    const leftKickAngle = state === 'airAttack'
      ? -1.2 + strike * 0.55
      : (isCapoeira && attacking ? -0.65 + strike * 0.9 : 0.08);
    const rightKickAngle = state === 'airAttack'
      ? 0.85 - strike * 0.35
      : (isCapoeira && state === 'attack3' ? 0.65 - strike * 0.5 : 0.08);

    this.ctx.save();
    this.ctx.translate(isCapoeira ? Math.sin(phase * 0.5) * 2 : 0, bob);
    this.drawBlockyLimb(leftLegX, floor - hipY + leftLegLift, 9, 24, leftKickAngle, primary, primaryDark, primaryLight, accent, skin, skinDark);
    this.drawBlockyLimb(rightLegX, floor - hipY + rightLegLift, 9, 24, rightKickAngle, primary, primaryDark, primaryLight, accent, skin, skinDark);
    this.drawBlockyBox(0, floor - hipY - 25, 25, crouch ? 22 : 30, 8, primary, primaryDark, primaryLight);
    this.drawBlockyLimb(-18, floor - hipY - 21, 7, 21, leftArmAngle, primary, primaryDark, primaryLight, accent, skin, skinDark);
    this.drawBlockyLimb(18, floor - hipY - 21, 7, 21, rightArmAngle, primary, primaryDark, primaryLight, accent, skin, skinDark);
    this.drawBlockyBox(0, floor - hipY - (crouch ? 51 : 59), 19, 19, 8, skin, skinDark, '#FFF1DE');
    this.drawBlockyBox(0, floor - hipY - (crouch ? 62 : 70), 21, 7, 8, isCapoeira ? '#4B2418' : '#17212B', primaryDark, primaryLight);
    this.drawBlockyBox(isCapoeira ? 10 : 0, floor - hipY - 40, 5, 4, 4, accent, primaryDark, primaryLight);
    this.ctx.restore();
    return true;
  }

  drawBlockyLimb(x, y, width, length, angle, front, side, top, accent, skin, skinDark) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(angle);
    this.drawBlockyBox(0, length / 2, width, length, 6, front, side, top);
    this.drawBlockyBox(0, length + 3, width + 3, 6, 5, skin, skinDark, '#FFF1DE');
    this.ctx.restore();
  }

  drawBlockyBox(x, y, width, height, depth, front, side, top) {
    const halfWidth = width / 2;
    const depthX = depth * 0.45;
    const depthY = depth * 0.28;
    this.ctx.fillStyle = side;
    this.ctx.beginPath();
    this.ctx.moveTo(x + halfWidth, y - height / 2);
    this.ctx.lineTo(x + halfWidth + depthX, y - height / 2 - depthY);
    this.ctx.lineTo(x + halfWidth + depthX, y + height / 2 - depthY);
    this.ctx.lineTo(x + halfWidth, y + height / 2);
    this.ctx.fill();
    this.ctx.fillStyle = top;
    this.ctx.beginPath();
    this.ctx.moveTo(x - halfWidth, y - height / 2);
    this.ctx.lineTo(x, y - height / 2 - depthY);
    this.ctx.lineTo(x + halfWidth + depthX, y - height / 2 - depthY);
    this.ctx.lineTo(x + halfWidth, y - height / 2);
    this.ctx.fill();
    this.ctx.fillStyle = front;
    this.ctx.fillRect(x - halfWidth, y - height / 2, width, height);
  }
  
  // Draw complete character
  drawCharacter(fighter, spr, frame, state) {
    const { x, y, width, height, facing } = fighter;
    const scale = 2; // Pixel art scale factor
    
    // Body proportions (in pixels at 1x scale)
    const headW = 16;
    const headH = 16;
    const torsoW = 18;
    const torsoH = 21;
    const armW = 6;
    const armH = 18;
    const legW = 9;
    const legH = 38;
    const footH = 8;

    const centerX = 0;
    const headY = -height/2 + 4;
    const torsoY = headY + headH - 2;
    const legY = torsoY + torsoH;
    
    const crouchOffset = state === 'crouch' || state === 'crouchAttack' ? 8 : 0;
    const jumpOffset = state === 'jump' || state === 'doubleJump' ? -4 : 0;
    const floorRelativeToCenter = (this.config.groundY - (y + height / 2)) / scale;
    const floorContactCompensation = 18;
    const verticalOffset = floorRelativeToCenter - (legY + legH + footH) + floorContactCompensation + crouchOffset + jumpOffset;
    const motionPhase = fighter.animFrame * 12;
    const isCapoeira = fighter.id === 1 || fighter.character === 'crimson';
    const motionAmount = state === 'walk' ? (isCapoeira ? 2.5 : 0.8) : (isCapoeira ? 1.1 : 0.35);
    const bodyBob = state === 'jump' || state === 'doubleJump' ? 0 : Math.sin(motionPhase) * motionAmount;
    const bodySway = state === 'walk'
      ? Math.sin(motionPhase) * (isCapoeira ? 2.2 : 0.5)
      : Math.sin(motionPhase * 0.5) * (isCapoeira ? 1.2 : 0.3);
    const bodyX = centerX + bodySway;
    const bodyY = torsoY + verticalOffset + bodyBob;

    if (this.drawBlockyCharacter(fighter, spr, frame, state)) {
      const spriteFloor = this.config.groundY - (y + height / 2);
      this.drawShadow(centerX, spriteFloor + 4, width * 0.8);
      if (state === 'dash') {
        this.drawDashEffect(fighter, spr, scale);
      } else if (state === 'block') {
        this.drawBlockEffect(fighter, spr, scale);
      }
      if (state === 'special') {
        this.drawSpecialEffect(fighter, spr, frame, centerX, torsoY + verticalOffset, scale);
      }
      if (state.includes('Attack') || state === 'attack' || state === 'attack2' || state === 'attack3') {
        this.drawAttackEffect(fighter, spr, frame, state, centerX, torsoY + verticalOffset, scale);
      }
      return;
    }
    
    // Draw shadow
    this.drawShadow(centerX, legY + legH + 8 + verticalOffset, width * 0.8);
    
    // Draw legs
    this.drawLegs(fighter, spr, frame, state, centerX, legY + verticalOffset, legW, legH, scale);
    
    // Draw torso
    this.drawTorso(fighter, spr, frame, state, bodyX, bodyY, torsoW, torsoH, scale);
    
    // Draw arms
    this.drawArms(fighter, spr, frame, state, bodyX, bodyY, torsoW, armW, armH, scale);
    
    // Draw head
    this.drawHead(fighter, spr, frame, state, bodyX, headY + verticalOffset + bodyBob, headW, headH, scale);
    
    // Draw weapon/effects for special attacks
    if (state === 'special') {
      this.drawSpecialEffect(fighter, spr, frame, centerX, torsoY + verticalOffset, scale);
    }
    
    // Draw attack effects
    if (state.includes('Attack') || state === 'attack' || state === 'attack2' || state === 'attack3') {
      this.drawAttackEffect(fighter, spr, frame, state, centerX, torsoY + verticalOffset, scale);
    }
  }
  
  // Draw shadow
  drawShadow(x, y, width) {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, width / 2, 4, 0, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawDashEffect(fighter, spr, scale) {
    const pulse = 0.45 + Math.sin(fighter.animFrame * 30) * 0.2;
    this.ctx.save();
    this.ctx.globalAlpha = pulse;
    this.ctx.globalCompositeOperation = 'lighter';
    for (let index = 0; index < 4; index++) {
      this.drawPixelRect(-fighter.facing * (18 + index * 8), 42 + index * 3, 12 - index * 2, 3, spr.secondary, spr.secondaryLight, spr.accent, scale);
    }
    this.ctx.restore();
  }

  drawBlockEffect(fighter, spr, scale) {
    const pulse = 0.55 + Math.sin(fighter.animFrame * 16) * 0.15;
    this.ctx.save();
    this.ctx.globalAlpha = pulse;
    this.ctx.strokeStyle = spr.secondaryLight;
    this.ctx.lineWidth = 3 * scale;
    this.ctx.beginPath();
    this.ctx.arc(fighter.facing * 18, -8, 25 + Math.sin(fighter.animFrame * 12) * 2, -Math.PI * 0.65, Math.PI * 0.65);
    this.ctx.stroke();
    this.ctx.globalAlpha = 0.8;
    this.drawPixelRect(fighter.facing * 20 - 4, -12, 8, 8, spr.secondary, spr.secondaryLight, spr.accent, scale);
    this.ctx.restore();
  }
  
  // Draw legs with pixel art detail
  drawLegs(fighter, spr, frame, state, x, y, w, h, scale) {
    const { facing } = fighter;
    const isCapoeira = fighter.id === 1 || fighter.character === 'crimson';
    const isKyokushin = fighter.id === 2 || fighter.character === 'azure';
    const isMoving = state === 'walk';
    const isCrouching = state === 'crouch' || state === 'crouchAttack';
    const isJumping = state === 'jump' || state === 'doubleJump';
    const isAttacking = state.includes('Attack') || state === 'attack' || state === 'attack2' || state === 'attack3';
    
    // Leg animation offsets
    let leftLegX = -w - 2;
    let rightLegX = w + 2;
    let leftLegY = 0;
    let rightLegY = 0;
    let leftKneeBend = 0;
    let rightKneeBend = 0;
    let leftFootAngle = -0.12;
    let rightFootAngle = 0.12;
    
    if (isMoving) {
      const walkCycle = (frame / spr.walkFrames) * Math.PI * 2;
      const step = Math.sin(walkCycle);
      if (isCapoeira) {
        leftLegX = -w - 6 + step * 5;
        rightLegX = w + 3 - step * 5;
        leftLegY = Math.max(0, step * 5);
        rightLegY = Math.max(0, -step * 5);
        leftKneeBend = step * 0.55;
        rightKneeBend = -step * 0.55;
        leftFootAngle = -0.25 + step * 0.18;
        rightFootAngle = 0.18 - step * 0.18;
      } else {
        leftLegX = -w - 4 + step * 2;
        rightLegX = w + 4 - step * 2;
        leftLegY = Math.max(0, step * 2);
        rightLegY = Math.max(0, -step * 2);
        leftKneeBend = Math.max(0, step * 0.22);
        rightKneeBend = Math.max(0, -step * 0.22);
        leftFootAngle = -0.08;
        rightFootAngle = 0.08;
      }
    } else if (isJumping) {
      leftLegX = -w + 2;
      rightLegX = w - 2;
      leftLegY = -2;
      rightLegY = -2;
      leftKneeBend = 0.8;
      rightKneeBend = 0.8;
      leftFootAngle = -0.3;
      rightFootAngle = -0.3;
    } else if (isCrouching) {
      leftLegX = -w - 2;
      rightLegX = w + 2;
      leftLegY = 6;
      rightLegY = 6;
      leftKneeBend = 1.2;
      rightKneeBend = 1.2;
    } else if (isAttacking && state !== 'airAttack') {
      // Stance during attack
      leftLegX = -w - 1;
      rightLegX = w + 1;
      leftKneeBend = 0.2;
      rightKneeBend = 0.2;
      if (isCapoeira && state !== 'crouchAttack') {
        leftLegY = -6;
        rightLegY = 3;
        leftKneeBend = -0.65;
        rightKneeBend = 0.35;
        leftFootAngle = -0.45;
        rightFootAngle = 0.15;
      } else if (isKyokushin) {
        leftLegX = -w - 3;
        rightLegX = w + 3;
        leftKneeBend = 0.12;
        rightKneeBend = 0.12;
      }
    }

    if (!isMoving && !isJumping && !isCrouching && !isAttacking) {
      if (isCapoeira) {
        // Capoeira base: wide, offset feet ready to ginga.
        leftLegX = -w - 5;
        rightLegX = w + 2;
        leftKneeBend = -0.18;
        rightKneeBend = 0.3;
        leftFootAngle = -0.22;
        rightFootAngle = 0.12;
      } else if (isKyokushin) {
        // Kyokushin base: grounded, symmetrical and knees slightly bent.
        leftLegX = -w - 4;
        rightLegX = w + 4;
        leftKneeBend = 0.12;
        rightKneeBend = 0.12;
        leftFootAngle = -0.08;
        rightFootAngle = 0.08;
      }
    }
    
    // Air attack - legs tucked
    if (state === 'airAttack') {
      leftLegX = -w + 1;
      rightLegX = w - 1;
      leftLegY = -4;
      rightLegY = -4;
      leftKneeBend = 1.0;
      rightKneeBend = 1.0;
      leftFootAngle = -0.5;
      rightFootAngle = -0.5;
    }
    
    // Draw left leg (thigh + calf + foot)
    this.drawPixelLeg(x + leftLegX, y + leftLegY, w, h, leftKneeBend, leftFootAngle, spr, scale, true);
    // Draw right leg
    this.drawPixelLeg(x + rightLegX, y + rightLegY, w, h, rightKneeBend, rightFootAngle, spr, scale, false);
  }
  
  // Draw a single pixel art leg
  drawPixelLeg(x, y, w, h, kneeBend, footAngle, spr, scale, isLeft) {
    const thighH = h * 0.5;
    const calfH = h * 0.5;
    const footH = 8;
    const footW = w + 13;
    
    this.ctx.save();
    this.ctx.translate(x, y);
    if (!isLeft) this.ctx.scale(-1, 1);
    
    // Thigh
    this.drawPixelRect(-w/2, 0, w, thighH, spr.primary, spr.primaryDark, spr.primaryLight, scale);
    
    // Calf (with knee bend)
    this.ctx.save();
    this.ctx.translate(0, thighH);
    this.ctx.rotate(kneeBend);
    this.drawPixelRect(-w/2 + 1, 0, w - 2, calfH, spr.primary, spr.primaryDark, spr.primaryLight, scale);
    
    // Foot
    this.ctx.save();
    this.ctx.translate(0, calfH);
    this.ctx.rotate(footAngle);
    this.drawPixelRect(-footW/2, 0, footW, footH, spr.outline, spr.primaryDark, spr.primary, scale);
    this.drawPixelRect(-footW/2 + 2, 1, footW - 4, 4, spr.primary, spr.primaryLight, spr.secondaryLight, scale);
    this.drawPixelRect(-footW/2 + 1, footH - 3, footW - 2, 3, spr.primaryDark, spr.outline, spr.primary, scale);
    this.ctx.restore();
    this.ctx.restore();
    this.ctx.restore();
  }
  
  // Draw torso with pixel art detail
  drawTorso(fighter, spr, frame, state, x, y, w, h, scale) {
    const { facing } = fighter;
    const isHit = state === 'hit';
    const isBlocking = state === 'block';
    const isAttacking = state.includes('Attack') || state === 'attack' || state === 'attack2' || state === 'attack3';
    
    let torsoLean = 0;
    let shoulderOffset = 0;
    
    if (isHit) {
      torsoLean = facing * 0.3;
    } else if (isBlocking) {
      torsoLean = -facing * 0.15;
      shoulderOffset = -3;
    } else if (isAttacking) {
      torsoLean = facing * 0.1;
    }
    
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(torsoLean);
    
    // Main torso body
    this.drawPixelRect(-w/2, 0, w, h, spr.primary, spr.primaryDark, spr.primaryLight, scale);
    
    // Chest plate / armor detail
    this.drawPixelRect(-w/2 + 2, 2, w - 4, h - 8, spr.primaryLight, spr.primary, spr.secondary, scale);
    
    // Belt
    this.drawPixelRect(-w/2, h - 6, w, 4, spr.secondary, spr.secondaryLight, spr.accent, scale);

    if (fighter.id === 1 || fighter.character === 'crimson') {
      // Capoeira sash and open vest lines.
      this.ctx.strokeStyle = spr.secondaryLight;
      this.ctx.lineWidth = scale;
      this.ctx.beginPath();
      this.ctx.moveTo(-w / 2 + 3, 3);
      this.ctx.lineTo(2, h - 7);
      this.ctx.moveTo(w / 2 - 3, 3);
      this.ctx.lineTo(-2, h - 7);
      this.ctx.stroke();
    } else {
      // Kyokushin gi lapels and a simple cloth belt, without body armor.
      this.ctx.strokeStyle = spr.accent;
      this.ctx.lineWidth = scale;
      this.ctx.beginPath();
      this.ctx.moveTo(-2, 2);
      this.ctx.lineTo(-1, h - 7);
      this.ctx.moveTo(2, 2);
      this.ctx.lineTo(1, h - 7);
      this.ctx.stroke();
    }
    
    // Capoeira uses loose shoulder cloth; Kyokushin keeps a plain karate-gi silhouette.
    const shoulderY = shoulderOffset;
    if (fighter.id === 1 || fighter.character === 'crimson') {
      this.drawPixelRect(-w/2 - 3, shoulderY, 6, 6, spr.secondary, spr.primaryDark, spr.secondaryLight, scale);
      this.drawPixelRect(w/2 - 3, shoulderY, 6, 6, spr.secondary, spr.primaryDark, spr.secondaryLight, scale);
    }
    
    // Back detail (cape/cloth)
    if (state !== 'crouch' && state !== 'crouchAttack' && (fighter.id === 1 || fighter.character === 'crimson')) {
      this.drawPixelRect(-w/2, h - 2, w, 8, spr.primaryDark, spr.primary, spr.secondary, scale);
    }
    
    this.ctx.restore();
  }
  
  // Draw arms with detailed animation
  drawArms(fighter, spr, frame, state, x, y, torsoW, armW, armH, scale) {
    const { facing, currentAttack } = fighter;
    const isCapoeira = fighter.id === 1 || fighter.character === 'crimson';
    const isKyokushin = fighter.id === 2 || fighter.character === 'azure';
    const isAttacking = state.includes('Attack') || state === 'attack' || state === 'attack2' || state === 'attack3';
    const isHeavyAttack = state === 'heavyAttack' || state === 'heavyAttack2';
    const isAirAttack = state === 'airAttack';
    const isCrouchAttack = state === 'crouchAttack';
    const isSpecial = state === 'special';
    const isBlocking = state === 'block';
    const isHit = state === 'hit';
    const isCrouching = state === 'crouch';
    const isJumping = state === 'jump' || state === 'doubleJump';
    const isMoving = state === 'walk';
    const isAnyAttack = isAttacking || isHeavyAttack || isAirAttack || isCrouchAttack || isSpecial;
    
    const startup = (currentAttack?.startup) || 0.1;
    const active = (currentAttack?.active) || 0.15;
    const recovery = (currentAttack?.recovery) || 0.2;
    const totalDuration = startup + active + recovery;
    const progress = Math.min(1, fighter.animFrame / totalDuration);
    
    const shoulderReach = 4;
    let leftShoulderX = -torsoW/2 - shoulderReach;
    let rightShoulderX = torsoW/2 + shoulderReach;
    let shoulderY = 2;
    
    let leftUpperArmRot = 0;
    let rightUpperArmRot = 0;
    let leftForearmRot = 0;
    let rightForearmRot = 0;
    let leftHandRot = 0;
    let rightHandRot = 0;
    
    // Easing function
    const easeInOut = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const easeIn = (t) => t * t * t;
    
    if (isMoving) {
      const walkCycle = (frame / spr.walkFrames) * Math.PI * 2;
      const step = Math.sin(walkCycle);
      if (isCapoeira) {
        leftUpperArmRot = 0.35 + step * 0.95;
        rightUpperArmRot = -0.2 - step * 0.8;
        leftForearmRot = -0.8 + step * 0.35;
        rightForearmRot = 0.95 - step * 0.35;
        leftHandRot = -0.35 + step * 0.25;
        rightHandRot = 0.3 - step * 0.25;
      } else {
        leftUpperArmRot = 0.35 + step * 0.35;
        rightUpperArmRot = -0.5 - step * 0.35;
        leftForearmRot = 0.25;
        rightForearmRot = 0.35;
        leftHandRot = 0.08;
        rightHandRot = -0.08;
      }
    } else if (isJumping) {
      leftUpperArmRot = -0.5;
      rightUpperArmRot = 0.5;
      leftForearmRot = 0.3;
      rightForearmRot = -0.3;
      leftHandRot = 0.2;
      rightHandRot = -0.2;
    } else if (isCrouching) {
      leftUpperArmRot = 0.6;
      rightUpperArmRot = -0.6;
      leftForearmRot = -0.3;
      rightForearmRot = 0.3;
      leftHandRot = -0.2;
      rightHandRot = 0.2;
    } else if (isBlocking) {
      leftUpperArmRot = 0.9;
      rightUpperArmRot = -0.9;
      leftForearmRot = -0.6;
      rightForearmRot = 0.6;
      leftHandRot = -0.4;
      rightHandRot = 0.4;
    } else if (isHit) {
      leftUpperArmRot = 1.4;
      rightUpperArmRot = -1.4;
      leftForearmRot = 0.7;
      rightForearmRot = -0.7;
      leftHandRot = 0.3;
      rightHandRot = -0.3;
    } else if (isAirAttack) {
      // Air attack - downward strike
      if (progress < startup / totalDuration) {
        const p = progress / (startup / totalDuration);
        leftUpperArmRot = -1.5 * easeOut(p);
        rightUpperArmRot = -1.5 * easeOut(p);
        leftForearmRot = -1.0 * easeOut(p);
        rightForearmRot = -1.0 * easeOut(p);
        leftHandRot = -0.5 * easeOut(p);
        rightHandRot = -0.5 * easeOut(p);
      } else if (progress < (startup + active) / totalDuration) {
        const p = (progress - startup / totalDuration) / (active / totalDuration);
        leftUpperArmRot = -1.5 + 3.0 * easeInOut(p);
        rightUpperArmRot = -1.5 + 3.0 * easeInOut(p);
        leftForearmRot = -1.0 + 2.5 * easeInOut(p);
        rightForearmRot = -1.0 + 2.5 * easeInOut(p);
        leftHandRot = -1.0 + 1.5 * easeInOut(p);
        rightHandRot = -1.0 + 1.5 * easeInOut(p);
      } else {
        const p = (progress - (startup + active) / totalDuration) / (recovery / totalDuration);
        leftUpperArmRot = 1.5 - 2.0 * easeIn(p);
        rightUpperArmRot = 1.5 - 2.0 * easeIn(p);
        leftForearmRot = 1.5 - 1.5 * easeIn(p);
        rightForearmRot = 1.5 - 1.5 * easeIn(p);
        leftHandRot = 0.5 - 0.5 * easeIn(p);
        rightHandRot = 0.5 - 0.5 * easeIn(p);
      }
    } else if (isCrouchAttack) {
      // Crouch attack - low sweep
      if (progress < startup / totalDuration) {
        const p = progress / (startup / totalDuration);
        leftUpperArmRot = 0.5 * easeOut(p);
        rightUpperArmRot = -0.5 * easeOut(p);
        leftForearmRot = 0.3 * easeOut(p);
        rightForearmRot = -0.3 * easeOut(p);
        leftHandRot = 0.4 * easeOut(p);
        rightHandRot = -0.4 * easeOut(p);
      } else if (progress < (startup + active) / totalDuration) {
        const p = (progress - startup / totalDuration) / (active / totalDuration);
        leftUpperArmRot = 0.5 + 2.0 * easeInOut(p);
        rightUpperArmRot = -0.5 - 2.0 * easeInOut(p);
        leftForearmRot = 0.3 + 1.5 * easeInOut(p);
        rightForearmRot = -0.3 - 1.5 * easeOut(p);
        leftHandRot = 0.4 + 0.8 * easeInOut(p);
        rightHandRot = -0.4 - 0.8 * easeInOut(p);
      } else {
        const p = (progress - (startup + active) / totalDuration) / (recovery / totalDuration);
        leftUpperArmRot = 2.5 - 2.0 * easeIn(p);
        rightUpperArmRot = -2.5 + 2.0 * easeIn(p);
        leftForearmRot = 1.8 - 1.5 * easeIn(p);
        rightForearmRot = -1.8 + 1.5 * easeIn(p);
        leftHandRot = 1.2 - 1.0 * easeIn(p);
        rightHandRot = -1.2 + 1.0 * easeIn(p);
      }
    } else if (isSpecial) {
      // Special - magical charge and release
      if (progress < startup / totalDuration) {
        const p = progress / (startup / totalDuration);
        leftUpperArmRot = -1.0 * easeOut(p);
        rightUpperArmRot = -1.0 * easeOut(p);
        leftForearmRot = -0.8 * easeOut(p);
        rightForearmRot = -0.8 * easeOut(p);
        leftHandRot = -0.5 * easeOut(p);
        rightHandRot = -0.5 * easeOut(p);
      } else if (progress < (startup + active) / totalDuration) {
        const p = (progress - startup / totalDuration) / (active / totalDuration);
        leftUpperArmRot = -1.0 + 2.5 * easeInOut(p);
        rightUpperArmRot = -1.0 + 2.5 * easeInOut(p);
        leftForearmRot = -0.8 + 2.0 * easeInOut(p);
        rightForearmRot = -0.8 + 2.0 * easeInOut(p);
        leftHandRot = -0.5 + 1.5 * easeInOut(p);
        rightHandRot = -0.5 + 1.5 * easeInOut(p);
      } else {
        const p = (progress - (startup + active) / totalDuration) / (recovery / totalDuration);
        leftUpperArmRot = 1.5 - 1.5 * easeIn(p);
        rightUpperArmRot = 1.5 - 1.5 * easeIn(p);
        leftForearmRot = 1.2 - 1.2 * easeIn(p);
        rightForearmRot = 1.2 - 1.2 * easeIn(p);
        leftHandRot = 1.0 - 1.0 * easeIn(p);
        rightHandRot = 1.0 - 1.0 * easeIn(p);
      }
    } else if (isHeavyAttack) {
      // Heavy attack - big windup and follow through
      if (progress < startup / totalDuration) {
        const p = progress / (startup / totalDuration);
        leftUpperArmRot = -1.5 * easeOut(p);
        rightUpperArmRot = 1.8 * easeOut(p);
        leftForearmRot = -0.5 * easeOut(p);
        rightForearmRot = 0.5 * easeOut(p);
        leftHandRot = -0.3 * easeOut(p);
        rightHandRot = 0.3 * easeOut(p);
      } else if (progress < (startup + active) / totalDuration) {
        const p = (progress - startup / totalDuration) / (active / totalDuration);
        leftUpperArmRot = -1.5 + 3.5 * easeInOut(p);
        rightUpperArmRot = 1.8 - 3.0 * easeInOut(p);
        leftForearmRot = -0.5 + 2.0 * easeInOut(p);
        rightForearmRot = 0.5 - 1.5 * easeInOut(p);
        leftHandRot = -0.3 + 1.0 * easeInOut(p);
        rightHandRot = 0.3 - 1.0 * easeInOut(p);
      } else {
        const p = (progress - (startup + active) / totalDuration) / (recovery / totalDuration);
        leftUpperArmRot = 2.0 - 1.5 * easeIn(p);
        rightUpperArmRot = -1.2 + 1.5 * easeIn(p);
        leftForearmRot = 1.5 - 1.5 * easeIn(p);
        rightForearmRot = -1.0 + 1.0 * easeIn(p);
        leftHandRot = 0.7 - 0.7 * easeIn(p);
        rightHandRot = -0.7 + 0.7 * easeIn(p);
      }
    } else if (isAttacking) {
      // Light attacks - combo variations
      const attackNum = state === 'attack2' ? 2 : (state === 'attack3' ? 3 : 1);
      
      if (progress < startup / totalDuration) {
        const p = progress / (startup / totalDuration);
        if (attackNum === 1) {
          // Jab - straight punch
          leftUpperArmRot = -0.5 * easeOut(p);
          rightUpperArmRot = 1.0 * easeOut(p);
          leftForearmRot = 0.3 * easeOut(p);
          leftHandRot = -0.3 * easeOut(p);
        } else if (attackNum === 2) {
          // Cross - opposite hand
          leftUpperArmRot = 1.0 * easeOut(p);
          rightUpperArmRot = -0.5 * easeOut(p);
          rightForearmRot = -0.3 * easeOut(p);
          rightHandRot = 0.3 * easeOut(p);
        } else {
          // Uppercut/finisher
          leftUpperArmRot = -1.0 * easeOut(p);
          rightUpperArmRot = -1.0 * easeOut(p);
          leftForearmRot = -0.8 * easeOut(p);
          rightForearmRot = -0.8 * easeOut(p);
          leftHandRot = -0.5 * easeOut(p);
          rightHandRot = -0.5 * easeOut(p);
        }
      } else if (progress < (startup + active) / totalDuration) {
        const p = (progress - startup / totalDuration) / (active / totalDuration);
        if (attackNum === 1) {
          leftUpperArmRot = -0.5 + 2.0 * easeInOut(p);
          rightUpperArmRot = 1.0 - 1.5 * easeInOut(p);
          leftForearmRot = 0.3 + 1.2 * easeInOut(p);
          leftHandRot = -0.3 + 0.8 * easeInOut(p);
        } else if (attackNum === 2) {
          leftUpperArmRot = 1.0 - 1.5 * easeInOut(p);
          rightUpperArmRot = -0.5 + 2.0 * easeInOut(p);
          rightForearmRot = -0.3 - 1.2 * easeInOut(p);
          rightHandRot = 0.3 - 0.8 * easeInOut(p);
        } else {
          leftUpperArmRot = -1.0 + 2.5 * easeInOut(p);
          rightUpperArmRot = -1.0 + 2.5 * easeInOut(p);
          leftForearmRot = -0.8 + 2.0 * easeInOut(p);
          rightForearmRot = -0.8 + 2.0 * easeInOut(p);
          leftHandRot = -0.5 + 1.0 * easeInOut(p);
          rightHandRot = -0.5 + 1.0 * easeInOut(p);
        }
      } else {
        const p = (progress - (startup + active) / totalDuration) / (recovery / totalDuration);
        if (attackNum === 1) {
          leftUpperArmRot = 1.5 - 1.5 * easeIn(p);
          rightUpperArmRot = -0.5 + 1.0 * easeIn(p);
          leftForearmRot = 1.5 - 1.5 * easeIn(p);
          leftHandRot = 0.5 - 0.5 * easeIn(p);
        } else if (attackNum === 2) {
          leftUpperArmRot = -0.5 + 1.0 * easeIn(p);
          rightUpperArmRot = 1.5 - 1.5 * easeIn(p);
          rightForearmRot = -1.5 + 1.5 * easeIn(p);
          rightHandRot = -0.5 + 0.5 * easeIn(p);
        } else {
          leftUpperArmRot = 1.5 - 1.5 * easeIn(p);
          rightUpperArmRot = 1.5 - 1.5 * easeIn(p);
          leftForearmRot = 1.2 - 1.2 * easeIn(p);
          rightForearmRot = 1.2 - 1.2 * easeIn(p);
          leftHandRot = 0.5 - 0.5 * easeIn(p);
          rightHandRot = 0.5 - 0.5 * easeIn(p);
        }
      }
    } else {
      // Idle breathing animation
      const breathe = Math.sin(fighter.animFrame * 2) * 0.08;
      if (isCapoeira) {
        // Capoeira guard: loose, open hands with a relaxed sway.
        leftUpperArmRot = 0.8 + breathe;
        rightUpperArmRot = -0.45 - breathe;
        leftForearmRot = -0.55 + breathe * 0.5;
        rightForearmRot = 0.8 - breathe * 0.5;
        leftHandRot = -0.3;
        rightHandRot = 0.25;
      } else {
        // Kyokushin guard: compact elbows and fists close to the body.
        leftUpperArmRot = 0.45 + breathe;
        rightUpperArmRot = -0.65 - breathe;
        leftForearmRot = 0.15 + breathe * 0.5;
        rightForearmRot = 0.45 - breathe * 0.5;
        leftHandRot = 0.1;
        rightHandRot = -0.15;
      }
    }

    if (isCapoeira && isAnyAttack) {
      const circle = Math.sin(progress * Math.PI);
      if (isAirAttack) {
        leftUpperArmRot = -1.8 + circle * 0.8;
        rightUpperArmRot = 0.9 - circle * 0.5;
        leftForearmRot = -0.8;
        rightForearmRot = 0.6;
      } else if (isCrouchAttack) {
        leftUpperArmRot = 1.2 + circle * 0.8;
        rightUpperArmRot = -1.5 - circle * 0.6;
        leftForearmRot = -1.0;
        rightForearmRot = 1.1;
      } else if (isHeavyAttack) {
        leftUpperArmRot = -1.4 + circle * 2.4;
        rightUpperArmRot = 1.2 - circle * 2.1;
        leftForearmRot = -0.7 + circle * 1.4;
        rightForearmRot = 0.8 - circle * 1.4;
      } else if (isSpecial) {
        leftUpperArmRot = -1.1 + circle * 1.7;
        rightUpperArmRot = -0.9 + circle * 1.9;
        leftForearmRot = -0.9 + circle * 1.8;
        rightForearmRot = -0.7 + circle * 1.6;
      } else {
        leftUpperArmRot += circle * 0.55;
        rightUpperArmRot -= circle * 0.75;
        leftForearmRot -= circle * 0.8;
        rightForearmRot += circle * 0.65;
      }
      leftHandRot += 0.25;
      rightHandRot -= 0.25;
    } else if (isKyokushin && isAnyAttack) {
      const snap = easeOut(progress);
      if (isAirAttack) {
        leftUpperArmRot = -0.7 - snap * 0.7;
        rightUpperArmRot = -0.3 - snap * 1.0;
        leftForearmRot = -0.2;
        rightForearmRot = -0.4;
      } else if (isCrouchAttack) {
        leftUpperArmRot = 0.7;
        rightUpperArmRot = -0.8;
        leftForearmRot = 1.0 + snap * 0.6;
        rightForearmRot = -1.0 - snap * 0.6;
      } else if (isHeavyAttack) {
        leftUpperArmRot = 0.2 - snap * 0.4;
        rightUpperArmRot = -0.3 + snap * 0.2;
        leftForearmRot = 0.1 - snap * 0.8;
        rightForearmRot = -0.2 + snap * 0.9;
      } else if (isSpecial) {
        leftUpperArmRot = -0.8 + snap * 1.2;
        rightUpperArmRot = 0.8 - snap * 1.2;
        leftForearmRot = -0.7 + snap * 1.0;
        rightForearmRot = 0.7 - snap * 1.0;
      } else {
        leftUpperArmRot *= 0.45;
        rightUpperArmRot *= 0.45;
        leftForearmRot *= 0.35;
        rightForearmRot *= 0.35;
      }
      leftHandRot *= 0.45;
      rightHandRot *= 0.45;
    }
    
    // Keep both shoulders visibly outside the torso in the neutral guard.
    if (!isAttacking && !isJumping && !isCrouching) {
      leftUpperArmRot += 0.2;
      rightUpperArmRot -= 0.2;
    }

    // Draw left arm
    this.ctx.save();
    this.ctx.translate(leftShoulderX, shoulderY);
    this.ctx.rotate(leftUpperArmRot * facing);
    this.drawPixelArm(0, 0, armW, armH, spr, scale, true, leftForearmRot, leftHandRot, facing, isAttacking, progress);
    this.ctx.restore();
    
    // Draw right arm
    this.ctx.save();
    this.ctx.translate(rightShoulderX, shoulderY);
    this.ctx.rotate(rightUpperArmRot * facing);
    this.drawPixelArm(0, 0, armW, armH, spr, scale, false, rightForearmRot, rightHandRot, facing, isAttacking, progress);
    this.ctx.restore();
  }
  
  // Draw a single pixel art arm
  drawPixelArm(x, y, w, h, spr, scale, isLeft, forearmRot, handRot, facing, isAttacking = false, attackProgress = 0) {
    const upperArmH = h * 0.5;
    const forearmH = h * 0.5;
    const handW = 7;
    const handH = 6;
    
    this.ctx.save();
    this.ctx.translate(x, y);
    if (!isLeft) this.ctx.scale(-1, 1);
    
    // Upper arm with shoulder detail
    this.drawPixelRect(-w/2, 0, w, upperArmH, spr.primary, spr.primaryDark, spr.primaryLight, scale);
    // Shoulder highlight
    this.drawPixelRect(-w/2 + 1, 1, w - 2, 3, spr.primaryLight, spr.primary, spr.accent, scale);
    
    // Elbow joint
    this.ctx.save();
    this.ctx.translate(0, upperArmH);
    this.ctx.rotate(forearmRot * facing);
    
    // Forearm
    this.drawPixelRect(-w/2 + 1, 0, w - 2, forearmH, spr.primary, spr.primaryDark, spr.primaryLight, scale);
    // Forearm highlight
    this.drawPixelRect(-w/2 + 2, 1, w - 4, 3, spr.primaryLight, spr.primary, spr.accent, scale);
    
    // Wrist
    this.ctx.save();
    this.ctx.translate(0, forearmH);
    this.ctx.rotate(handRot * facing);
    
      // Hand - more detailed
      const fistClenched = isAttacking && attackProgress > 0.3 && attackProgress < 0.8;
      
      if (fistClenched) {
        // Clenched fist
        this.drawPixelRect(-handW/2, 0, handW, handH, spr.skin, spr.skinDark, spr.accent, scale);
        // Knuckles
        this.drawPixelRect(-handW/2 + 1, 1, handW - 2, 2, spr.skinDark, spr.skin, spr.accent, scale);
        // Thumb
        this.drawPixelRect(-handW/2 - 2, 1, 3, 4, spr.skin, spr.skinDark, spr.accent, scale);
      } else {
        // Open hand
        this.drawPixelRect(-handW/2, 0, handW, handH, spr.skin, spr.skinDark, spr.accent, scale);
        // Palm detail
        this.drawPixelRect(-handW/2 + 1, 1, handW - 2, handH - 2, spr.skin, spr.skinDark, spr.accent, scale);
        // Short fingers
        for (let i = -1; i <= 1; i++) {
          this.drawPixelRect(i * 2 - 1, handH - 1, 2, 3, spr.skin, spr.skinDark, spr.accent, scale);
        }
        // Thumb
        this.drawPixelRect(-handW/2 - 2, 2, 3, 4, spr.skin, spr.skinDark, spr.accent, scale);
      }
    
    this.ctx.restore();
    this.ctx.restore();
    this.ctx.restore();
  }
  
  // Draw head with pixel art detail
  drawHead(fighter, spr, frame, state, x, y, w, h, scale) {
    const { facing } = fighter;
    const isHit = state === 'hit';
    const isAttacking = state.includes('Attack') || state === 'attack' || state === 'attack2' || state === 'attack3';
    const isJumping = state === 'jump' || state === 'doubleJump';
    
    let headTilt = 0;
    let eyeState = 'normal'; // normal, angry, focused, closed
    let mouthState = 'neutral'; // neutral, grit, shout, open
    
    if (isHit) {
      headTilt = facing * 0.3;
      eyeState = 'closed';
      mouthState = 'open';
    } else if (isAttacking) {
      eyeState = 'focused';
      mouthState = 'grit';
    } else if (isJumping) {
      eyeState = 'focused';
      mouthState = 'neutral';
    }
    
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(headTilt);
    
    // Head base
    this.drawPixelRect(-w/2, 0, w, h, spr.skin, spr.skinDark, spr.accent, scale);
    
    // Hair
    this.drawPixelHair(-w/2, -2, w, h, spr, scale, facing);

    if (fighter.id === 1 || fighter.character === 'crimson') {
      // Capoeira headband adds motion and a clear dance-fighter silhouette.
      this.drawPixelRect(-w/2 - 1, 1, w + 2, 3, spr.secondary, spr.secondaryLight, spr.accent, scale);
      this.drawPixelRect(facing * (w/2 + 1), 3, 7, 2, spr.secondary, spr.secondaryLight, spr.accent, scale);
    } else {
      // Kyokushin keeps a close-cropped, focused brow line.
      this.drawPixelRect(-w/2 + 2, 5, w - 4, 2, spr.hairDark, spr.hair, spr.accent, scale);
    }
    
    // Face details
    this.drawPixelFace(0, 0, w, h, spr, scale, facing, eyeState, mouthState);
    
    // Ears
    this.drawPixelRect(-w/2 - 2, 4, 3, 6, spr.skin, spr.skinDark, spr.accent, scale);
    this.drawPixelRect(w/2 - 1, 4, 3, 6, spr.skin, spr.skinDark, spr.accent, scale);
    
    this.ctx.restore();
  }
  
  // Draw pixel art hair
  drawPixelHair(x, y, w, h, spr, scale, facing) {
    // Main hair mass
    this.drawPixelRect(x - 2, y - 4, w + 4, h * 0.6, spr.hair, spr.hairDark, spr.accent, scale);
    
    // Hair strands / spikes
    const spikeCount = 5;
    for (let i = 0; i < spikeCount; i++) {
      const spikeX = x - 2 + (w + 4) * (i / (spikeCount - 1));
      const spikeHeight = 6 + Math.sin(i * 1.5) * 3;
      this.drawPixelTriangle(spikeX, y - 4, spikeHeight, spr.hair, spr.hairDark, scale);
    }
    
    // Forehead hair
    this.drawPixelRect(x, y - 2, w, 3, spr.hair, spr.hairDark, spr.accent, scale);
  }
  
  // Draw pixel art face
  drawPixelFace(x, y, w, h, spr, scale, facing, eyeState, mouthState) {
    const eyeY = 3;
    const eyeSpacing = 4;
    const eyeSize = 3;
    const mouthY = 10;
    
    // Eyes
    this.ctx.save();
    this.ctx.translate(x, y);
    
    // Left eye
    this.drawPixelEye(-eyeSpacing, eyeY, eyeSize, spr, scale, facing, eyeState, true);
    // Right eye
    this.drawPixelEye(eyeSpacing, eyeY, eyeSize, spr, scale, facing, eyeState, false);
    
    // Eyebrows
    this.drawPixelEyebrow(-eyeSpacing, eyeY - 3, spr, scale, facing, eyeState, true);
    this.drawPixelEyebrow(eyeSpacing, eyeY - 3, spr, scale, facing, eyeState, false);
    
    // Mouth
    this.drawPixelMouth(0, mouthY, spr, scale, mouthState);
    
    this.ctx.restore();
  }
  
  // Draw a single pixel eye
  drawPixelEye(x, y, size, spr, scale, facing, eyeState, isLeft) {
    const eyeWhite = '#FFFFFF';
    const eyeIris = spr.eye;
    const eyeGlow = spr.eyeGlow;
    const eyeOutline = spr.outline;
    
    // Eye white
    this.drawPixelRect(x - size/2, y - size/2, size, size, eyeWhite, eyeOutline, eyeWhite, scale);
    
    if (eyeState !== 'closed') {
      // Iris
      const irisOffset = facing === 1 ? (isLeft ? 0 : 1) : (isLeft ? -1 : 0);
      this.drawPixelRect(x - 1 + irisOffset, y - 1, 2, 2, eyeIris, eyeOutline, eyeGlow, scale);
      
      // Pupil
      this.drawPixelRect(x + irisOffset, y, 1, 1, eyeOutline, eyeOutline, eyeOutline, scale);
      
      // Highlight
      if (eyeState === 'focused' || eyeState === 'angry') {
        this.drawPixelRect(x - 1 + irisOffset, y - 1, 1, 1, eyeGlow, eyeGlow, eyeGlow, scale);
      }
    } else {
      // Closed eye - just a line
      this.drawPixelRect(x - size/2, y, size, 1, eyeOutline, eyeOutline, eyeOutline, scale);
    }
  }
  
  // Draw eyebrow
  drawPixelEyebrow(x, y, spr, scale, facing, eyeState, isLeft) {
    const browColor = spr.hairDark;
    const browW = 4;
    const browH = 1;
    
    let browAngle = 0;
    if (eyeState === 'angry') browAngle = isLeft ? -0.3 : 0.3;
    else if (eyeState === 'focused') browAngle = isLeft ? -0.15 : 0.15;
    
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(browAngle * facing);
    this.drawPixelRect(-browW/2, -browH/2, browW, browH, browColor, browColor, browColor, scale);
    this.ctx.restore();
  }
  
  // Draw mouth
  drawPixelMouth(x, y, spr, scale, mouthState) {
    const mouthColor = spr.outline;
    
    switch (mouthState) {
      case 'grit':
        // Gritted teeth
        this.drawPixelRect(x - 3, y, 6, 1, mouthColor, mouthColor, mouthColor, scale);
        for (let i = -2; i <= 2; i++) {
          this.drawPixelRect(x + i * 2, y - 1, 1, 3, mouthColor, mouthColor, mouthColor, scale);
        }
        break;
      case 'shout':
        // Open mouth
        this.drawPixelEllipse(x, y, 4, 3, mouthColor, scale);
        break;
      case 'open':
        // Slightly open
        this.drawPixelRect(x - 2, y, 4, 2, mouthColor, mouthColor, mouthColor, scale);
        break;
      default:
        // Neutral line
        this.drawPixelRect(x - 3, y, 6, 1, mouthColor, mouthColor, mouthColor, scale);
    }
  }
  
  // Draw special attack effects
  drawSpecialEffect(fighter, spr, frame, x, y, scale) {
    const { facing } = fighter;
    const progress = fighter.animFrame / (fighter.currentAttack?.startup + fighter.currentAttack?.active + fighter.currentAttack?.recovery || 1);
    
    this.ctx.save();
    this.ctx.translate(x, y - 20);

    if (fighter.id === 1 || fighter.character === 'crimson') {
      this.drawFootAttackEffect('special', progress, spr, scale, true, facing);
      this.drawSlashEffect(facing * 12, 4, 44, facing * -0.9, spr, scale, progress, true);
      this.drawSlashEffect(facing * 4, 14, 34, facing * 0.75, spr, scale, progress, false);
      this.ctx.restore();
      return;
    }

    if (fighter.id === 2 || fighter.character === 'azure') {
      this.drawFootAttackEffect('special', progress, spr, scale, false, facing);
      this.drawThrustEffect(facing * 28, -8, spr, scale, progress);
      this.drawUppercutEffect(facing * 12, -18, spr, scale, Math.max(0, progress - 0.25));
      this.ctx.restore();
      return;
    }
    
    // Magical particles
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + progress * Math.PI * 4;
      const radius = 20 + Math.sin(progress * Math.PI * 8 + i) * 10;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius * 0.5;
      
      const alpha = 1 - progress;
      const size = 3 + Math.sin(progress * Math.PI * 4 + i) * 2;
      
      this.ctx.globalAlpha = alpha;
      this.drawPixelRect(px, py, size, size, spr.secondary, spr.secondaryLight, spr.accent, scale);
      
      // Inner glow
      this.ctx.globalAlpha = alpha * 0.5;
      this.drawPixelRect(px + 1, py + 1, size - 2, size - 2, spr.accent, spr.accent, spr.accent, scale);
    }
    
    // Ground effect
    if (progress > 0.3) {
      this.ctx.globalAlpha = (progress - 0.3) * 1.5;
      for (let i = -3; i <= 3; i++) {
        this.drawPixelRect(i * 6, 30, 4, 4, spr.secondary, spr.secondaryLight, spr.accent, scale);
      }
    }
    
    this.ctx.restore();
  }
  
  // Draw attack effects (slash, impact, etc.)
  drawAttackEffect(fighter, spr, frame, state, x, y, scale) {
    const { facing } = fighter;
    const isCapoeira = fighter.id === 1 || fighter.character === 'crimson';
    const isKyokushin = fighter.id === 2 || fighter.character === 'azure';
    const progress = fighter.animFrame / (fighter.currentAttack?.startup + fighter.currentAttack?.active + fighter.currentAttack?.recovery || 1);
    const isHeavy = state === 'heavyAttack' || state === 'heavyAttack2';
    const isAir = state === 'airAttack';
    const isCrouch = state === 'crouchAttack';
    const attackNum = state === 'attack2' ? 2 : (state === 'attack3' ? 3 : 1);
    
    // Only draw during active frames
    const startup = fighter.currentAttack?.startup || 0.1;
    const active = fighter.currentAttack?.active || 0.15;
    if (fighter.animFrame < startup || fighter.animFrame > startup + active) return;
    
    const activeProgress = (fighter.animFrame - startup) / active;
    
    this.ctx.save();
    this.ctx.translate(x, y);
    if (fighter.facing === -1) this.ctx.scale(-1, 1);
    
    if (isCapoeira) {
      this.drawFootAttackEffect(state, activeProgress, spr, scale, true, facing);
      if (isAir) {
        this.drawSlashEffect(facing * 8, 8, 42, facing * -1.15, spr, scale, activeProgress, false);
      } else if (isCrouch) {
        this.drawSlashEffect(facing * 12, 18, 40, facing * 0.65, spr, scale, activeProgress, false);
      } else if (isHeavy) {
        this.drawSlashEffect(facing * 10, 2, 48, facing * -0.9, spr, scale, activeProgress, true);
      } else {
        const angle = attackNum === 1 ? facing * 0.9 : facing * -0.75;
        this.drawSlashEffect(facing * 18, attackNum === 3 ? -14 : 2, 42, angle, spr, scale, activeProgress, false);
      }
    } else if (isKyokushin) {
      this.drawFootAttackEffect(state, activeProgress, spr, scale, false, facing);
      if (isAir) {
        this.drawUppercutEffect(facing * 14, 6, spr, scale, activeProgress);
      } else if (isCrouch) {
        this.drawThrustEffect(facing * 28, 18, spr, scale, activeProgress);
      } else if (isHeavy) {
        this.drawUppercutEffect(facing * 16, -12, spr, scale, activeProgress);
      } else if (attackNum === 1) {
        this.drawThrustEffect(facing * 30, -6, spr, scale, activeProgress);
      } else if (attackNum === 2) {
        this.drawThrustEffect(facing * 36, -2, spr, scale, activeProgress);
      } else {
        this.drawUppercutEffect(facing * 14, -18, spr, scale, activeProgress);
      }
    } else {
      // Light attacks - different slash per combo step
      if (attackNum === 1) {
        // Jab - small forward thrust effect
        this.drawThrustEffect(facing * 25, -5, spr, scale, activeProgress);
      } else if (attackNum === 2) {
        // Cross - diagonal slash
        this.drawSlashEffect(facing * 20, -10, 30, facing * -0.5, spr, scale, activeProgress, false);
      } else {
        // Finisher - uppercut effect
        this.drawUppercutEffect(facing * 15, -15, spr, scale, activeProgress);
      }
    }
    
    this.ctx.restore();
  }

  drawFootAttackEffect(state, progress, spr, scale, isCapoeira, facing) {
    const kickState = state === 'airAttack' || state === 'crouchAttack' || state === 'attack3';
    const kickHeight = state === 'crouchAttack' ? 22 : (state === 'airAttack' ? 8 : 2);
    const sweepDirection = isCapoeira ? -0.75 : 0;

    this.ctx.save();
    this.ctx.globalCompositeOperation = 'lighter';

    if (isCapoeira) {
      // A flowing crescent follows the raised/sweeping leg.
      this.ctx.translate(facing * 7, kickHeight);
      this.ctx.rotate(facing * sweepDirection);
      const trailLength = state === 'attack3' ? 34 + progress * 42 : 20 + progress * 34;
      const trailCount = state === 'attack2' ? 7 : 5;
      for (let index = 0; index < trailCount; index++) {
        const trailProgress = Math.max(0, progress - index * 0.12);
        const alpha = (1 - trailProgress) * 0.75;
        this.ctx.globalAlpha = alpha;
        this.drawPixelRect(-trailLength / 2 + index * 3, -2 - index * (state === 'attack3' ? 3 : 2), trailLength, 3, spr.secondary, spr.secondaryLight, spr.accent, scale);
      }
      this.ctx.globalAlpha = 0.9;
      this.drawPixelRect(-4, -4, 8, 8, spr.secondaryLight, spr.secondary, spr.accent, scale);
    } else {
      // Kyokushin impact stays close to the planted foot: dense, blunt, and heavy.
      this.ctx.translate(facing * (kickState ? 18 : 24), kickHeight + 14);
      const burst = (state === 'attack3' ? 14 : 8) + progress * (state === 'attack3' ? 30 : 22);
      for (let index = 0; index < 6; index++) {
        const angle = -Math.PI * 0.9 + index * Math.PI * 0.36;
        const distance = burst * (0.55 + index * 0.08);
        this.ctx.globalAlpha = (1 - progress) * 0.85;
        this.drawPixelRect(Math.cos(angle) * distance, Math.sin(angle) * distance, 4, 4, spr.secondary, spr.secondaryLight, spr.accent, scale);
      }
      this.ctx.globalAlpha = 0.8 * (1 - progress * 0.5);
      this.drawPixelRect(-10 - progress * 8, -2, 20 + progress * 16, 5, spr.secondary, spr.secondaryLight, spr.accent, scale);
    }

    this.ctx.restore();
  }
  
  // Draw slash effect
  drawSlashEffect(x, y, length, angle, spr, scale, progress, isHeavy) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(angle);
    
    const segments = isHeavy ? 6 : 4;
    for (let i = 0; i < segments; i++) {
      const segProgress = progress - i * 0.15;
      if (segProgress < 0 || segProgress > 1) continue;
      
      const alpha = 1 - segProgress;
      const segLength = length * segProgress;
      const width = isHeavy ? 8 : 5;
      
      this.ctx.globalAlpha = alpha;
      
      // Outer glow
      this.drawPixelRect(0, -width/2, segLength, width, spr.secondary, spr.secondaryLight, spr.accent, scale);
      
      // Inner core
      this.ctx.globalAlpha = alpha * 0.7;
      this.drawPixelRect(2, -width/2 + 2, segLength - 4, width - 4, spr.accent, spr.accent, spr.accent, scale);
    }
    
    this.ctx.restore();
  }
  
  // Draw thrust effect (for jab)
  drawThrustEffect(x, y, spr, scale, progress) {
    this.ctx.save();
    this.ctx.translate(x, y);
    
    const length = 20 * progress;
    const alpha = 1 - progress;
    
    this.ctx.globalAlpha = alpha;
    this.drawPixelRect(0, -2, length, 4, spr.secondary, spr.secondaryLight, spr.accent, scale);
    this.ctx.globalAlpha = alpha * 0.7;
    this.drawPixelRect(2, -1, length - 4, 2, spr.accent, spr.accent, spr.accent, scale);
    
    this.ctx.restore();
  }
  
  // Draw uppercut effect
  drawUppercutEffect(x, y, spr, scale, progress) {
    this.ctx.save();
    this.ctx.translate(x, y);
    
    const height = 30 * progress;
    const alpha = 1 - progress;
    
    this.ctx.globalAlpha = alpha;
    // Rising fist trail
    this.drawPixelRect(-6, -height, 12, height, spr.secondary, spr.secondaryLight, spr.accent, scale);
    this.ctx.globalAlpha = alpha * 0.7;
    this.drawPixelRect(-4, -height + 2, 8, height - 4, spr.accent, spr.accent, spr.accent, scale);
    
    // Energy particles
    for (let i = 0; i < 5; i++) {
      const py = -height * (i / 5) + Math.sin(progress * 10 + i) * 3;
      this.ctx.globalAlpha = alpha * (1 - i / 5);
      this.drawPixelRect(-2 + Math.sin(progress * 8 + i) * 4, py, 4, 4, spr.secondaryLight, spr.accent, spr.accent, scale);
    }
    
    this.ctx.restore();
  }
  
  // Helper: Draw pixel rectangle with shading
  drawPixelRect(x, y, w, h, baseColor, darkColor, lightColor, scale) {
    const sw = w * scale;
    const sh = h * scale;
    const sx = x * scale;
    const sy = y * scale;
    
    // Base
    this.ctx.fillStyle = baseColor;
    this.ctx.fillRect(sx, sy, sw, sh);
    
    // Top highlight
    this.ctx.fillStyle = lightColor;
    this.ctx.fillRect(sx, sy, sw, scale);
    this.ctx.fillRect(sx, sy, scale, sh);
    
    // Bottom shadow
    this.ctx.fillStyle = darkColor;
    this.ctx.fillRect(sx, sy + sh - scale, sw, scale);
    this.ctx.fillRect(sx + sw - scale, sy, scale, sh);
    
    // Inner detail (for larger rects)
    if (w > 4 && h > 4) {
      this.ctx.fillStyle = this.blendColors(baseColor, lightColor, 0.3);
      this.ctx.fillRect(sx + scale, sy + scale, scale, sh - scale * 2);
      this.ctx.fillRect(sx + scale, sy + scale, sw - scale * 2, scale);
    }
  }
  
  // Helper: Draw pixel triangle
  drawPixelTriangle(x, y, height, baseColor, darkColor, scale) {
    const baseW = Math.max(4, height * 0.6);
    const steps = Math.ceil(height / scale);
    
    for (let i = 0; i < steps; i++) {
      const progress = i / steps;
      const w = baseW * (1 - progress);
      const h = scale;
      const px = x + (baseW - w) / 2;
      const py = y + i * scale;
      
      const color = progress < 0.5 ? this.blendColors(baseColor, '#FFFFFF', progress) : this.blendColors(baseColor, darkColor, (progress - 0.5) * 2);
      this.ctx.fillStyle = color;
      this.ctx.fillRect(px * scale, py * scale, w * scale, h * scale);
    }
  }
  
  // Helper: Draw pixel ellipse
  drawPixelEllipse(x, y, rx, ry, color, scale) {
    const steps = Math.max(rx, ry) * 2;
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const px = x + Math.cos(angle) * rx;
      const py = y + Math.sin(angle) * ry;
      this.ctx.fillStyle = color;
      this.ctx.fillRect(px * scale, py * scale, scale, scale);
    }
  }
  
  // Color blending helper
  blendColors(color1, color2, ratio) {
    const c1 = this.hexToRgb(color1);
    const c2 = this.hexToRgb(color2);
    if (!c1 || !c2) return color1;
    
    const r = Math.round(c1.r * (1 - ratio) + c2.r * ratio);
    const g = Math.round(c1.g * (1 - ratio) + c2.g * ratio);
    const b = Math.round(c1.b * (1 - ratio) + c2.b * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
  
  // Lighten color
  lightenColor(color, amount) {
    const rgb = this.hexToRgb(color);
    if (!rgb) return color;
    const r = Math.min(255, rgb.r + amount);
    const g = Math.min(255, rgb.g + amount);
    const b = Math.min(255, rgb.b + amount);
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  // Darken color
  darkenColor(color, amount) {
    const rgb = this.hexToRgb(color);
    if (!rgb) return color;
    const r = Math.max(0, rgb.r - amount);
    const g = Math.max(0, rgb.g - amount);
    const b = Math.max(0, rgb.b - amount);
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  // Camera shake
  shakeCamera(intensity, duration = 300) {
    this.screenShake.intensity = intensity;
    this.screenShake.duration = duration;
    this.screenShake.elapsed = 0;
  }
  
  updateCamera(dt) {
    if (this.screenShake.duration > 0) {
      this.screenShake.elapsed += dt * 1000;
      const progress = this.screenShake.elapsed / this.screenShake.duration;
      const currentIntensity = this.screenShake.intensity * (1 - progress);
      this.screenShake.x = (Math.random() - 0.5) * currentIntensity;
      this.screenShake.y = (Math.random() - 0.5) * currentIntensity;
      
      if (this.screenShake.elapsed >= this.screenShake.duration) {
        this.screenShake.x = 0;
        this.screenShake.y = 0;
        this.screenShake.duration = 0;
      }
    }
    
    if (this.screenFlash.active) {
      this.screenFlash.elapsed += dt * 1000;
      this.screenFlash.alpha = 0.6 * Math.max(0, 1 - this.screenFlash.elapsed / this.screenFlash.duration);
      if (this.screenFlash.elapsed >= this.screenFlash.duration) {
        this.screenFlash.active = false;
      }
    }
  }
  
  flashScreen(color, duration = 100) {
    this.screenFlash = { active: true, color, alpha: 0.6, duration, elapsed: 0 };
  }
  
  // Draw hitbox/hurtbox for debugging
  drawHurtbox(hurtbox) {
    if (!hurtbox) return;
    this.ctx.strokeStyle = '#00FF00';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(hurtbox.x, hurtbox.y, hurtbox.width, hurtbox.height);
  }
  
  drawHitbox(hitbox) {
    if (!hitbox) return;
    this.ctx.strokeStyle = '#FF0000';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
  }
  
  // Add particle effect
  addParticle(x, y, color, velocity, life, size = 3) {
    this.particles.push({
      x, y,
      vx: velocity.x,
      vy: velocity.y,
      color,
      life,
      maxLife: life,
      size,
      gravity: 0.3
    });
  }
  
  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.vy += p.gravity * dt * 60;
      p.life -= dt * 1000;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
  
  drawParticles() {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    }
    this.ctx.globalAlpha = 1;
  }
  
  // Draw screen flash
  drawScreenFlash() {
    if (this.screenFlash.active) {
      this.ctx.save();
      this.ctx.globalAlpha = this.screenFlash.alpha;
      this.ctx.fillStyle = this.screenFlash.color;
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.restore();
    }
  }
  
  // Render everything
  render(fighters, stage) {
    this.clear();
    
    // Draw stage
    if (stage) {
      stage.render(this.ctx, this);
    }
    
    // Draw fighters
    for (const fighter of fighters) {
      this.drawFighter(fighter);
    }
    
    // Draw particles
    this.drawParticles();
    
    // Draw screen flash
    this.drawScreenFlash();
  }
  
  clear() {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, '#1A0307');
    grad.addColorStop(0.25, '#2B050B');
    grad.addColorStop(0.5, '#360A11');
    grad.addColorStop(0.75, '#4A0E17');
    grad.addColorStop(1, '#5A121C');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.restore();
  }
  
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
  }
}