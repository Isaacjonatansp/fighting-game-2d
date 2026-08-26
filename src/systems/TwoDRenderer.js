// 2D Pixel Art Renderer for Fighting Game
export class TwoDRenderer {
  constructor(config) {
    this.config = config;
    this.canvas = config.canvas;
    this.ctx = this.canvas.getContext('2d');
    this.width = config.width;
    this.height = config.height;
    
    // Reference dimensions
    this.referenceWidth = 1280;
    this.referenceHeight = 720;
    
    // Scale factors
    this.scaleX = 1;
    this.scaleY = 1;
    
    // Camera/viewport
    this.cameraX = 0;
    this.cameraY = 0;
    this.viewportWidth = this.referenceWidth;
    this.viewportHeight = this.referenceHeight;
    
    // Arena bounds in game coordinates
    this.arenaLeft = 0;
    this.arenaRight = this.referenceWidth;
    this.groundY = config.groundY;
    
    // Character sprite data
    this.characterSprites = {};
    this.characterAnimations = {};
    this.fighterSprites = { 1: null, 2: null };
    this.fighterAnimationState = { 1: 'idle', 2: 'idle' };
    this.fighterAnimationFrame = { 1: 0, 2: 0 };
    this.fighterAnimationTimer = { 1: 0, 2: 0 };
    
    // Animation frame rates (frames per second)
    this.animationFPS = {
      idle: 6,
      walk: 10,
      run: 12,
      jump: 8,
      fall: 8,
      attack: 15,
      heavyAttack: 12,
      special: 10,
      airAttack: 12,
      crouchAttack: 12,
      block: 4,
      hit: 8,
      dash: 15,
      die: 4
    };
    
    // Frame counts for each animation
    this.animationFrameCounts = {
      idle: 4,
      walk: 6,
      run: 6,
      jump: 3,
      fall: 2,
      attack: 6,
      heavyAttack: 7,
      special: 8,
      airAttack: 5,
      crouchAttack: 5,
      block: 3,
      hit: 3,
      dash: 5,
      die: 4
    };
    
    // Particle system
    this.particles = [];
    this.screenFlash = { active: false, alpha: 0, color: '#ffffff', duration: 0, timer: 0 };
    this.screenShake = { intensity: 0, duration: 0, elapsed: 0, x: 0, y: 0 };
    
    // Initialize
    this.generateCharacterSprites();
    this.loadKenneySprites();
    this.setupCanvas();
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
    this.resize(window.innerWidth, window.innerHeight);
  }

  // Load Kenney Platformer CC0 sprites as optional skin
  async loadKenneySprites() {
    this.kenneySprites = {};
    this.kenneyLoaded = { 1: false, 2: false };
    this.kenneyCharacterType = { 1: 'Adventurer', 2: 'Player' };

    // Map game states to Kenney pose files
    this.kenneyPoseMap = {
      idle: 'idle',
      walk: ['walk1', 'walk2'],
      run: ['walk1', 'walk2'],
      jump: 'jump',
      fall: 'fall',
      attack: 'action1',
      heavyAttack: 'action2',
      special: 'kick',
      airAttack: 'kick',
      crouchAttack: 'action1',
      block: 'stand',
      hit: 'hurt',
      dash: 'skid',
      die: 'hurt',
      crouch: 'duck'
    };

    // Load for both characters
    await Promise.all([
      this.loadKenneyCharacter(1, 'Adventurer'),
      this.loadKenneyCharacter(2, 'Player')
    ]);
  }

  async loadKenneyCharacter(fighterId, characterType) {
    const sprites = {};
    const basePath = `/assets/kenney-platformer/PNG/${characterType}/Poses`;

    for (const [gameState, poseRef] of Object.entries(this.kenneyPoseMap)) {
      const poseFiles = Array.isArray(poseRef) ? poseRef : [poseRef];
      const frames = [];

      for (const poseFile of poseFiles) {
        const fileName = `${characterType.toLowerCase()}_${poseFile}.png`;
        const imagePath = `${basePath}/${fileName}`;

        try {
          const img = await this.loadImage(imagePath);
          frames.push(img);
        } catch (err) {
          console.warn(`Failed to load Kenney sprite: ${imagePath}`, err);
          frames.push(this.createPlaceholder());
        }
      }

      sprites[gameState] = frames;
    }

    this.kenneySprites[fighterId] = sprites;
    this.kenneyLoaded[fighterId] = true;
    console.log(`Kenney ${characterType} sprites loaded for fighter ${fighterId}`);
  }

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }

  createPlaceholder() {
    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 110;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(0, 0, 80, 110);
    return canvas;
  }
  
  setupCanvas() {
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx.imageSmoothingEnabled = false; // Pixel art look
  }
  
  generateCharacterSprites() {
    // Color schemes for different characters
    const colorSchemes = {
      crimson: { // Player 1 - Capoeira (Red/Orange)
        skin: '#ffccaa',
        hair: '#ff6600',
        shirt: '#cc3333',
        pants: '#333366',
        shoes: '#111111',
        outline: '#882222',
        style: 'capoeira'
      },
      azure: { // Player 2 - Kyokushin (Blue)
        skin: '#ffccaa',
        hair: '#4444ff',
        shirt: '#3366cc',
        pants: '#112244',
        shoes: '#111111',
        outline: '#223366',
        style: 'kyokushin'
      }
    };
    
    // Generate sprites for each character type
    for (const [charName, colors] of Object.entries(colorSchemes)) {
      this.characterSprites[charName] = {};
      this.characterAnimations[charName] = {};
      
      for (const [animName, frameCount] of Object.entries(this.animationFrameCounts)) {
        const frames = [];
        for (let frame = 0; frame < frameCount; frame++) {
          const canvas = document.createElement('canvas');
          canvas.width = 64;
          canvas.height = 128;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = false;
          
          this.drawCharacterFrame(ctx, colors, animName, frame, frameCount);
          frames.push(canvas);
        }
        this.characterSprites[charName][animName] = frames;
      }
    }
  }
  
  // ============ COLOR HELPERS ============
  
  darkenColor(color, amount) {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.round(parseInt(hex.substr(0, 2), 16) * (1 - amount)));
    const g = Math.max(0, Math.round(parseInt(hex.substr(2, 2), 16) * (1 - amount)));
    const b = Math.max(0, Math.round(parseInt(hex.substr(4, 2), 16) * (1 - amount)));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  
  lightenColor(color, amount) {
    const hex = color.replace('#', '');
    const r = Math.min(255, Math.round(parseInt(hex.substr(0, 2), 16) + (255 - parseInt(hex.substr(0, 2), 16)) * amount));
    const g = Math.min(255, Math.round(parseInt(hex.substr(2, 2), 16) + (255 - parseInt(hex.substr(2, 2), 16)) * amount));
    const b = Math.min(255, Math.round(parseInt(hex.substr(4, 2), 16) + (255 - parseInt(hex.substr(4, 2), 16)) * amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  
  // ============ DRAWING PRIMITIVES ============
  
  fillRect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  
  strokeLine(ctx, x1, y1, x2, y2, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.round(x1), Math.round(y1));
    ctx.lineTo(Math.round(x2), Math.round(y2));
    ctx.stroke();
  }
  
  // ============ MAIN CHARACTER FRAME RENDERER ============
  
  drawCharacterFrame(ctx, colors, animName, frameIndex, frameCount) {
    const w = 64;
    const h = 128;
    const cx = w / 2;
    const cy = h / 2;
    const isCapoeira = colors.style === 'capoeira';
    
    // Animation offsets
    let bodyOffsetY = 0;
    let armOffset = 0;
    let legOffset = 0;
    let headOffset = 0;
    let lean = 0;
    
    const progress = frameIndex / Math.max(1, frameCount - 1);
    
    switch (animName) {
      case 'idle':
        if (isCapoeira) {
          bodyOffsetY = Math.sin(progress * Math.PI * 2) * 3;
          armOffset = Math.sin(progress * Math.PI * 2) * 4;
          headOffset = Math.sin(progress * Math.PI * 2) * 2;
          lean = Math.sin(progress * Math.PI * 2) * 6;
        } else {
          bodyOffsetY = Math.sin(progress * Math.PI * 2) * 1;
          armOffset = Math.sin(progress * Math.PI * 2) * 1;
          headOffset = 0;
          lean = 1;
        }
        break;
      case 'walk':
        if (isCapoeira) {
          armOffset = Math.sin(progress * Math.PI * 2) * 8;
          legOffset = Math.sin(progress * Math.PI * 2) * 8;
          bodyOffsetY = Math.abs(Math.sin(progress * Math.PI * 2)) * 4;
          lean = Math.sin(progress * Math.PI * 2) * 8;
        } else {
          armOffset = Math.sin(progress * Math.PI * 2) * 5;
          legOffset = Math.sin(progress * Math.PI * 2) * 5;
          bodyOffsetY = Math.abs(Math.sin(progress * Math.PI * 2)) * 2;
          lean = 3;
        }
        break;
      case 'run':
        armOffset = Math.sin(progress * Math.PI * 2) * 12;
        legOffset = Math.sin(progress * Math.PI * 2) * 12;
        bodyOffsetY = Math.abs(Math.sin(progress * Math.PI * 2)) * 4;
        lean = isCapoeira ? Math.sin(progress * Math.PI * 2) * 12 : 10;
        break;
      case 'jump':
        if (frameIndex === 0) { armOffset = -8; legOffset = -4; lean = isCapoeira ? -10 : -4; }
        else if (frameIndex === 1) { armOffset = 0; legOffset = 0; lean = 0; }
        else { armOffset = 8; legOffset = 8; lean = isCapoeira ? 10 : 4; }
        break;
      case 'fall':
        armOffset = 5; legOffset = 3; lean = isCapoeira ? 6 : 2;
        break;
      case 'attack':
        const attackProgress = progress;
        if (isCapoeira) {
          if (attackProgress < 0.2) { lean = -12; bodyOffsetY = 6; armOffset = -6; }
          else if (attackProgress < 0.5) { lean = 14; bodyOffsetY = 8; armOffset = 18; legOffset = 12; }
          else { lean = 8; bodyOffsetY = 4; armOffset = 8; }
        } else {
          if (attackProgress < 0.2) { lean = -4; bodyOffsetY = 0; armOffset = -8; }
          else if (attackProgress < 0.5) { lean = 6; bodyOffsetY = 1; armOffset = 22; legOffset = 4; }
          else { lean = 3; bodyOffsetY = 0; armOffset = 10; }
        }
        break;
      case 'heavyAttack':
        const heavyProgress = progress;
        if (isCapoeira) {
          if (heavyProgress < 0.3) { lean = -20; bodyOffsetY = 10; armOffset = -15; }
          else if (heavyProgress < 0.65) { lean = 24; bodyOffsetY = -4; armOffset = 25; legOffset = 28; }
          else { lean = 10; bodyOffsetY = 2; armOffset = 10; }
        } else {
          if (heavyProgress < 0.3) { lean = -8; bodyOffsetY = -4; armOffset = -16; }
          else if (heavyProgress < 0.65) { lean = 14; bodyOffsetY = 4; armOffset = 28; legOffset = 22; }
          else { lean = 5; bodyOffsetY = 0; armOffset = 12; }
        }
        break;
      case 'special':
        const specialProgress = progress;
        if (isCapoeira) {
          if (specialProgress < 0.25) { lean = -25; bodyOffsetY = 14; armOffset = -18; }
          else if (specialProgress < 0.7) { lean = 30; bodyOffsetY = 10; armOffset = 32; legOffset = 35; }
          else { lean = 12; bodyOffsetY = 4; armOffset = 14; }
        } else {
          if (specialProgress < 0.25) { lean = -10; bodyOffsetY = -6; armOffset = -20; }
          else if (specialProgress < 0.7) { lean = 18; bodyOffsetY = 6; armOffset = 35; legOffset = 28; }
          else { lean = 6; bodyOffsetY = 0; armOffset = 15; }
        }
        break;
      case 'airAttack':
        lean = isCapoeira ? Math.sin(progress * Math.PI) * 15 : 5;
        bodyOffsetY = progress * 8 - 4;
        armOffset = Math.sin(progress * Math.PI) * 18;
        legOffset = Math.sin(progress * Math.PI) * 12;
        break;
      case 'crouchAttack':
        bodyOffsetY = isCapoeira ? 16 : 10;
        lean = isCapoeira ? 14 : 4;
        armOffset = isCapoeira ? 16 : 12;
        legOffset = isCapoeira ? 22 : 10;
        break;
      case 'block':
        bodyOffsetY = isCapoeira ? 8 : 4;
        lean = isCapoeira ? -6 : -2;
        armOffset = -4;
        break;
      case 'hit':
        if (frameIndex === 0) { lean = -14; armOffset = -12; legOffset = -6; headOffset = -6; bodyOffsetY = -2; }
        else if (frameIndex === 1) { lean = 10; armOffset = 10; legOffset = 6; headOffset = 6; bodyOffsetY = 2; }
        else { lean = -4; armOffset = -4; legOffset = -2; headOffset = -2; bodyOffsetY = 0; }
        break;
      case 'dash':
        lean = isCapoeira ? 25 : 18;
        armOffset = -12;
        legOffset = 20;
        bodyOffsetY = isCapoeira ? 10 : 4;
        break;
      case 'die':
        bodyOffsetY = progress * 24;
        lean = progress * 35;
        armOffset = progress * 12;
        legOffset = progress * 8;
        headOffset = progress * 18;
        break;
    }
    
    // ============ DETAILED PIXEL ART RENDERING ============
    // Color palette with shading
    const skin = colors.skin;
    const skinDark = this.darkenColor(skin, 0.25);
    const skinDarker = this.darkenColor(skin, 0.45);
    const skinLight = this.lightenColor(skin, 0.15);
    
    const hair = colors.hair;
    const hairDark = this.darkenColor(hair, 0.3);
    const hairLight = this.lightenColor(hair, 0.2);
    
    const shirt = colors.shirt;
    const shirtDark = this.darkenColor(shirt, 0.3);
    const shirtDarker = this.darkenColor(shirt, 0.5);
    const shirtLight = this.lightenColor(shirt, 0.15);
    
    const pants = colors.pants;
    const pantsDark = this.darkenColor(pants, 0.3);
    const pantsDarker = this.darkenColor(pants, 0.5);
    const pantsLight = this.lightenColor(pants, 0.15);
    
    const shoes = colors.shoes;
    const shoesLight = this.lightenColor(shoes, 0.2);
    
    const outline = colors.outline;
    
    // ============ LEGS (detailed with joints, muscles, clothing folds) ============
    const legY = cy + 32 + bodyOffsetY;
    const leftLegX = cx - 10 + lean;
    const rightLegX = cx + 10 + lean;
    
    // Draw detailed legs with shading
    this.drawDetailedLeg(ctx, leftLegX, legY, legOffset, isCapoeira, pants, pantsDark, pantsDarker, pantsLight, shoes, shoesLight, outline, animName, progress, -1);
    this.drawDetailedLeg(ctx, rightLegX, legY, -legOffset, isCapoeira, pants, pantsDark, pantsDarker, pantsLight, shoes, shoesLight, outline, animName, progress, 1);
    
    // Attack-specific leg animations
    if (animName === 'attack' && progress > 0.2 && progress < 0.5) {
      if (isCapoeira) {
        const kickProgress = (progress - 0.2) / 0.3;
        const kickExtension = kickProgress * 20;
        this.drawDetailedLeg(ctx, rightLegX + kickExtension, legY - 4, 0, isCapoeira, pants, pantsDark, pantsDarker, pantsLight, shoes, shoesLight, outline, animName, progress, 1);
      } else {
        const stepProgress = (progress - 0.2) / 0.3;
        const stepExtension = stepProgress * 10;
        this.drawDetailedLeg(ctx, rightLegX + stepExtension, legY - 2, 0, isCapoeira, pants, pantsDark, pantsDarker, pantsLight, shoes, shoesLight, outline, animName, progress, 1);
      }
    } else if (animName === 'heavyAttack' && progress > 0.3 && progress < 0.65) {
      if (isCapoeira) {
        const kickProgress = (progress - 0.3) / 0.35;
        const kickExtension = kickProgress * 30;
        const kickHeight = Math.sin(kickProgress * Math.PI) * 18;
        this.drawDetailedLeg(ctx, rightLegX + kickExtension, legY - kickHeight - 6, 0, isCapoeira, pants, pantsDark, pantsDarker, pantsLight, shoes, shoesLight, outline, animName, progress, 1);
      } else {
        const kickProgress = (progress - 0.3) / 0.35;
        const kickExtension = kickProgress * 24;
        const kickHeight = Math.sin(kickProgress * Math.PI) * 10;
        this.drawDetailedLeg(ctx, rightLegX + kickExtension, legY - kickHeight, 0, isCapoeira, pants, pantsDark, pantsDarker, pantsLight, shoes, shoesLight, outline, animName, progress, 1);
      }
    } else if (animName === 'special' && progress > 0.25 && progress < 0.7) {
      if (isCapoeira) {
        const kickProgress = (progress - 0.25) / 0.45;
        const kickExtension = kickProgress * 36;
        const kickHeight = Math.sin(kickProgress * Math.PI) * 24;
        this.drawDetailedLeg(ctx, rightLegX + kickExtension, legY - kickHeight - 12, 0, isCapoeira, pants, pantsDark, pantsDarker, pantsLight, shoes, shoesLight, outline, animName, progress, 1);
      } else {
        const kickProgress = (progress - 0.25) / 0.45;
        const kickExtension = kickProgress * 28;
        const kickHeight = Math.sin(kickProgress * Math.PI) * 20;
        this.drawDetailedLeg(ctx, rightLegX + kickExtension, legY - kickHeight - 8, 0, isCapoeira, pants, pantsDark, pantsDarker, pantsLight, shoes, shoesLight, outline, animName, progress, 1);
      }
    } else if (animName === 'airAttack' && progress > 0.2 && progress < 0.8) {
      const airProgress = (progress - 0.2) / 0.6;
      if (airProgress < 0.5) {
        this.drawDetailedLeg(ctx, leftLegX, legY - 8, 0, isCapoeira, pants, pantsDark, pantsDarker, pantsLight, shoes, shoesLight, outline, animName, progress, -1);
        this.drawDetailedLeg(ctx, rightLegX, legY - 8, 0, isCapoeira, pants, pantsDark, pantsDarker, pantsLight, shoes, shoesLight, outline, animName, progress, 1);
      } else {
        const extendProgress = (airProgress - 0.5) / 0.5;
        this.drawDetailedLeg(ctx, leftLegX, legY - 8 + extendProgress * 16, 0, isCapoeira, pants, pantsDark, pantsDarker, pantsLight, shoes, shoesLight, outline, animName, progress, -1);
        this.drawDetailedLeg(ctx, rightLegX, legY - 8 + extendProgress * 16, 0, isCapoeira, pants, pantsDark, pantsDarker, pantsLight, shoes, shoesLight, outline, animName, progress, 1);
      }
    } else if (animName === 'crouchAttack' && progress > 0.2 && progress < 0.8) {
      const sweepProgress = (progress - 0.2) / 0.6;
      const sweepAngle = sweepProgress * Math.PI;
      const sweepExtension = Math.sin(sweepAngle) * (isCapoeira ? 26 : 18);
      const sweepHeight = Math.sin(sweepAngle) * 6;
      this.drawDetailedLeg(ctx, rightLegX + sweepExtension, legY + sweepHeight, 0, isCapoeira, pants, pantsDark, pantsDarker, pantsLight, shoes, shoesLight, outline, animName, progress, 1);
      this.drawDetailedLeg(ctx, leftLegX - 2, legY + 6, 0, isCapoeira, pants, pantsDark, pantsDarker, pantsLight, shoes, shoesLight, outline, animName, progress, -1);
    }
    
    // ============ TORSO (detailed with muscles, clothing folds, belt) ============
    const torsoY = cy - 14 + bodyOffsetY;
    this.drawDetailedTorso(ctx, cx + lean, torsoY, isCapoeira, shirt, shirtDark, shirtDarker, shirtLight, pants, pantsDark, pantsLight, outline, lean);
    
    // ============ ARMS (detailed with hands, muscles, shading) ============
    const armY = torsoY + 6;
    const leftArmX = cx - 16 + lean;
    const rightArmX = cx + 16 + lean;
    
    // Extend arm forward during attack frames
    let attackReach = 0;
    let attackType = 'none';
    if (animName === 'attack' && progress > 0.2 && progress < 0.5) {
      attackReach = ((progress - 0.2) / 0.3) * (isCapoeira ? 16 : 22);
      attackType = isCapoeira ? 'capoeira_jab' : 'kyokushin_punch';
    } else if (animName === 'heavyAttack' && progress > 0.3 && progress < 0.65) {
      attackReach = ((progress - 0.3) / 0.35) * (isCapoeira ? 28 : 24);
      attackType = isCapoeira ? 'capoeira_kick' : 'kyokushin_heavy';
    } else if (animName === 'special' && progress > 0.25 && progress < 0.7) {
      attackReach = ((progress - 0.25) / 0.45) * (isCapoeira ? 32 : 35);
      attackType = isCapoeira ? 'capoeira_special' : 'kyokushin_special';
    } else if (animName === 'airAttack' && progress > 0.2 && progress < 0.8) {
      attackReach = Math.sin((progress - 0.2) / 0.6 * Math.PI) * 18;
      attackType = 'aerial';
    } else if (animName === 'crouchAttack' && progress > 0.2 && progress < 0.8) {
      attackReach = Math.sin((progress - 0.2) / 0.6 * Math.PI) * 16;
      attackType = 'sweep';
    }
    
    // Draw detailed arms
    this.drawDetailedArm(ctx, leftArmX, armY, armOffset, attackReach, attackType, isCapoeira, skin, skinDark, skinDarker, skinLight, shirt, shirtDark, outline, -1, animName, progress);
    this.drawDetailedArm(ctx, rightArmX, armY, -armOffset, attackReach, attackType, isCapoeira, skin, skinDark, skinDarker, skinLight, shirt, shirtDark, outline, 1, animName, progress);
    
    // ============ HEAD (detailed with face, hair, expression) ============
    const headY = torsoY - 22 + headOffset;
    this.drawDetailedHead(ctx, cx + lean, headY, isCapoeira, skin, skinDark, skinDarker, skinLight, hair, hairDark, hairLight, outline, animName, progress);
  }
  
  // ============ DETAILED BODY PART RENDERERS ============
  
  drawDetailedLeg(ctx, x, y, offset, isCapoeira, pants, pantsDark, pantsDarker, pantsLight, shoes, shoesLight, outline, animName, progress, side) {
    const thighW = 10;
    const thighH = 16;
    const calfW = 8;
    const calfH = 16;
    const footW = 10;
    const footH = 4;
    
    const thighY = y;
    const calfY = y + thighH + offset;
    const footY = y + thighH + calfH + offset;
    
    // Thigh with shading (3-tone)
    this.fillRect(ctx, x - thighW/2, thighY, thighW, thighH, pants);
    // Highlight
    this.fillRect(ctx, x - thighW/2 + 1, thighY + 1, 2, thighH - 2, pantsLight);
    // Shadow
    this.fillRect(ctx, x + thighW/2 - 2, thighY + 1, 2, thighH - 2, pantsDark);
    // Deep shadow line
    this.strokeLine(ctx, x + thighW/2 - 1, thighY, x + thighW/2 - 1, thighY + thighH, pantsDarker);
    
    // Knee cap
    this.fillRect(ctx, x - 3, calfY - 2, 6, 3, pantsLight);
    this.strokeLine(ctx, x - 2, calfY - 1, x + 2, calfY - 1, pantsDark);
    
    // Calf with muscle definition
    this.fillRect(ctx, x - calfW/2, calfY, calfW, calfH, pants);
    this.fillRect(ctx, x - calfW/2 + 1, calfY + 1, 2, calfH - 2, pantsLight);
    this.fillRect(ctx, x + calfW/2 - 2, calfY + 1, 2, calfH - 2, pantsDark);
    this.strokeLine(ctx, x + calfW/2 - 1, calfY, x + calfW/2 - 1, calfY + calfH, pantsDarker);
    
    // Ankle
    this.fillRect(ctx, x - 5, calfY + calfH - 1, 10, 3, pantsDark);
    
    // Foot / Shoe
    const footX = x - footW/2 + (side > 0 ? 2 : -2);
    this.fillRect(ctx, footX, footY, footW, footH, shoes);
    this.fillRect(ctx, footX, footY - 1, footW, 2, shoesLight);
    // Shoe detail
    this.fillRect(ctx, footX + 1, footY, 2, footH, this.darkenColor(shoes, 0.2));
    // Sole
    this.strokeLine(ctx, footX, footY + footH, footX + footW, footY + footH, '#000000');
  }
  
  drawDetailedTorso(ctx, cx, y, isCapoeira, shirt, shirtDark, shirtDarker, shirtLight, pants, pantsDark, pantsLight, outline, lean) {
    const torsoW = 26;
    const torsoH = 28;
    const torsoX = cx - torsoW/2;
    
    // Torso base with shading
    this.fillRect(ctx, torsoX, y, torsoW, torsoH, shirt);
    // Highlight (left side - light source from top-left)
    this.fillRect(ctx, torsoX + 1, y + 1, 3, torsoH - 2, shirtLight);
    this.fillRect(ctx, torsoX + 1, y + 1, torsoW - 2, 2, shirtLight);
    // Shadow (right side)
    this.fillRect(ctx, torsoX + torsoW - 3, y + 1, 3, torsoH - 2, shirtDark);
    this.fillRect(ctx, torsoX + 1, y + torsoH - 3, torsoW - 2, 2, shirtDark);
    // Deep shadow
    this.strokeLine(ctx, torsoX + torsoW - 2, y, torsoX + torsoW - 2, y + torsoH, shirtDarker);
    this.strokeLine(ctx, torsoX, y + torsoH - 1, torsoX + torsoW, y + torsoH - 1, shirtDarker);
    
    // Pectoral muscles
    this.fillRect(ctx, torsoX + 4, y + 4, 6, 4, shirtLight);
    this.fillRect(ctx, torsoX + 16, y + 4, 6, 4, shirtLight);
    this.strokeLine(ctx, torsoX + 4, y + 6, torsoX + 9, y + 6, shirtDark);
    this.strokeLine(ctx, torsoX + 16, y + 6, torsoX + 21, y + 6, shirtDark);
    
    // Abs
    for (let i = 0; i < 3; i++) {
      const absY = y + 12 + i * 4;
      this.fillRect(ctx, torsoX + 8, absY, 10, 2, shirtLight);
      this.strokeLine(ctx, torsoX + 8, absY + 1, torsoX + 17, absY + 1, shirtDark);
    }
    
    // Belt
    const beltY = y + torsoH - 4;
    this.fillRect(ctx, torsoX, beltY, torsoW, 4, pantsDark);
    this.fillRect(ctx, torsoX + 1, beltY + 1, torsoW - 2, 2, pantsLight);
    // Belt knot
    this.fillRect(ctx, cx - 2, beltY, 4, 4, pants);
    this.fillRect(ctx, cx - 1, beltY + 1, 2, 2, pantsLight);
    
    // Clothing folds (vertical lines)
    this.strokeLine(ctx, torsoX + 6, y + 8, torsoX + 6, y + torsoH - 6, shirtDark);
    this.strokeLine(ctx, torsoX + 19, y + 8, torsoX + 19, y + torsoH - 6, shirtDark);
    
    // Capoeira: loose shirt bottom flutter
    if (isCapoeira) {
      this.fillRect(ctx, torsoX - 2, y + torsoH - 2, torsoW + 4, 3, shirt);
      this.strokeLine(ctx, torsoX, y + torsoH - 1, torsoX + torsoW, y + torsoH - 1, shirtDark);
    }
  }
  
  drawDetailedArm(ctx, x, y, offset, attackReach, attackType, isCapoeira, skin, skinDark, skinDarker, skinLight, shirt, shirtDark, outline, side, animName, progress) {
    const upperArmW = 6;
    const upperArmH = 14;
    const forearmW = 5;
    const forearmH = 12;
    const handW = 6;
    const handH = 6;
    
    const shoulderY = y;
    const elbowY = y + upperArmH + offset;
    const wristY = y + upperArmH + forearmH + offset;
    const handY = wristY;
    
    // Determine arm position based on attack
    let upperArmAngle = 0;
    let forearmAngle = 0;
    let handOpen = false;
    
    if (attackType === 'kyokushin_punch' && attackReach > 2) {
      // Straight punch - arm fully extended
      upperArmAngle = -0.3 * side;
      forearmAngle = 0;
      handOpen = false;
    } else if (attackType === 'capoeira_jab' && attackReach > 2) {
      // Low jab from ginga
      upperArmAngle = 0.5 * side;
      forearmAngle = -0.2 * side;
      handOpen = false;
    } else if (attackType === 'kyokushin_heavy' && attackReach > 2) {
      // Heavy straight punch
      upperArmAngle = -0.4 * side;
      forearmAngle = 0.1 * side;
      handOpen = false;
    } else if (attackType === 'capoeira_kick' && attackReach > 2) {
      // Hands on floor for balance
      upperArmAngle = 1.2 * side;
      forearmAngle = 0.3 * side;
      handOpen = true;
    } else if (attackType === 'kyokushin_special' && attackReach > 2) {
      // Guard position
      upperArmAngle = 0.2 * side;
      forearmAngle = -0.5 * side;
      handOpen = false;
    } else if (attackType === 'capoeira_special' && attackReach > 2) {
      // Both hands on floor
      upperArmAngle = 1.3 * side;
      forearmAngle = 0.4 * side;
      handOpen = true;
    } else if (attackType === 'aerial' && attackReach > 2) {
      upperArmAngle = 0.8 * side;
      forearmAngle = 0.2 * side;
      handOpen = false;
    } else if (attackType === 'sweep' && attackReach > 2) {
      upperArmAngle = 0.6 * side;
      forearmAngle = 0;
      handOpen = true;
    } else {
      // Idle / guard position
      if (isCapoeira) {
        upperArmAngle = side > 0 ? 0.8 : -0.3;
        forearmAngle = side > 0 ? -0.5 : 0.5;
        handOpen = true;
      } else {
        upperArmAngle = 0.3 * side;
        forearmAngle = -0.4 * side;
        handOpen = false;
      }
    }
    
    // Apply attack reach extension
    const reachExtension = attackReach > 2 ? attackReach * 0.5 : 0;
    
    // Upper arm
    const ux = x + Math.cos(upperArmAngle) * 2;
    const uy = shoulderY + Math.sin(upperArmAngle) * 4;
    this.fillRect(ctx, ux - upperArmW/2, uy, upperArmW, upperArmH, skin);
    this.fillRect(ctx, ux - upperArmW/2 + 1, uy + 1, 2, upperArmH - 2, skinLight);
    this.fillRect(ctx, ux + upperArmW/2 - 2, uy + 1, 2, upperArmH - 2, skinDark);
    this.strokeLine(ctx, ux + upperArmW/2 - 1, uy, ux + upperArmW/2 - 1, uy + upperArmH, skinDarker);
    
    // Elbow
    this.fillRect(ctx, ux - 3, elbowY - 2, 6, 4, skinDark);
    this.fillRect(ctx, ux - 2, elbowY - 1, 4, 2, skinLight);
    
    // Forearm (extended during attacks)
    const fx = ux + Math.cos(forearmAngle) * (upperArmH * 0.8);
    const fy = uy + upperArmH + Math.sin(forearmAngle) * (upperArmH * 0.8);
    const forearmLen = forearmH + reachExtension;
    this.fillRect(ctx, fx - forearmW/2, fy, forearmW, forearmLen, skin);
    this.fillRect(ctx, fx - forearmW/2 + 1, fy + 1, 2, forearmLen - 2, skinLight);
    this.fillRect(ctx, fx + forearmW/2 - 2, fy + 1, 2, forearmLen - 2, skinDark);
    this.strokeLine(ctx, fx + forearmW/2 - 1, fy, fx + forearmW/2 - 1, fy + forearmLen, skinDarker);
    
    // Wrist
    this.fillRect(ctx, fx - 3, fy + forearmLen - 1, 6, 3, skinDark);
    
    // Hand / Fist
    const hx = fx + Math.cos(forearmAngle) * 2;
    const hy = fy + forearmLen;
    if (handOpen) {
      // Open hand
      this.fillRect(ctx, hx - handW/2, hy, handW, handH, skin);
      this.fillRect(ctx, hx - handW/2 + 1, hy + 1, handW - 2, handH - 2, skinLight);
      // Fingers
      for (let i = 0; i < 4; i++) {
        this.fillRect(ctx, hx - handW/2 + 1 + i * 1.2, hy - 3, 1, 4, skin);
        this.fillRect(ctx, hx - handW/2 + 1 + i * 1.2, hy - 2, 1, 1, skinLight);
      }
      // Thumb
      this.fillRect(ctx, hx - handW/2 - 1, hy + 1, 2, 3, skin);
    } else {
      // Fist
      this.fillRect(ctx, hx - handW/2, hy, handW, handH, skin);
      this.fillRect(ctx, hx - handW/2 + 1, hy + 1, handW - 2, handH - 2, skinLight);
      this.fillRect(ctx, hx + handW/2 - 2, hy + 1, 2, handH - 2, skinDark);
      // Knuckles
      this.strokeLine(ctx, hx - 2, hy, hx - 2, hy + handH, skinDarker);
      this.strokeLine(ctx, hx, hy, hx, hy + handH, skinDarker);
      this.strokeLine(ctx, hx + 2, hy, hx + 2, hy + handH, skinDarker);
    }
  }
  
  drawDetailedHead(ctx, cx, y, isCapoeira, skin, skinDark, skinDarker, skinLight, hair, hairDark, hairLight, outline, animName, progress) {
    const headW = 28;
    const headH = 26;
    const headX = cx - headW/2;
    
    // Head base (oval-ish)
    this.fillRect(ctx, headX + 2, y, headW - 4, headH - 2, skin);
    this.fillRect(ctx, headX + 1, y + 2, headW - 2, headH - 4, skin);
    this.fillRect(ctx, headX, y + 4, headW, headH - 8, skin);
    this.fillRect(ctx, headX + 1, y + headH - 6, headW - 2, 2, skin);
    this.fillRect(ctx, headX + 2, y + headH - 4, headW - 4, 2, skin);
    
    // Shading
    this.fillRect(ctx, headX + 2, y + 2, 3, headH - 6, skinLight);
    this.fillRect(ctx, headX + headW - 5, y + 2, 3, headH - 6, skinDark);
    this.strokeLine(ctx, headX + headW - 3, y + 4, headX + headW - 3, y + headH - 4, skinDarker);
    this.strokeLine(ctx, headX + 2, y + headH - 3, headX + headW - 2, y + headH - 3, skinDarker);
    
    // Face details
    const eyeY = y + 8;
    const eyeSpacing = 6;
    
    // Eyes (with expression based on animation)
    let eyeState = 'normal';
    if (animName === 'attack' || animName === 'heavyAttack' || animName === 'special') eyeState = 'focused';
    else if (animName === 'hit') eyeState = 'pain';
    else if (animName === 'block') eyeState = 'determined';
    
    // Left eye
    if (eyeState === 'focused') {
      this.fillRect(ctx, cx - eyeSpacing - 1, eyeY, 3, 2, '#000000');
      this.fillRect(ctx, cx - eyeSpacing, eyeY + 1, 1, 1, skinLight);
    } else if (eyeState === 'pain') {
      this.strokeLine(ctx, cx - eyeSpacing - 2, eyeY, cx - eyeSpacing + 1, eyeY + 2, '#000000');
      this.strokeLine(ctx, cx - eyeSpacing - 2, eyeY + 2, cx - eyeSpacing + 1, eyeY, '#000000');
    } else if (eyeState === 'determined') {
      this.fillRect(ctx, cx - eyeSpacing - 1, eyeY, 3, 1, '#000000');
      this.fillRect(ctx, cx - eyeSpacing, eyeY + 1, 1, 1, skinLight);
    } else {
      this.fillRect(ctx, cx - eyeSpacing - 1, eyeY, 3, 3, '#000000');
      this.fillRect(ctx, cx - eyeSpacing, eyeY + 1, 1, 1, '#FFFFFF');
    }
    
    // Right eye
    if (eyeState === 'focused') {
      this.fillRect(ctx, cx + eyeSpacing - 2, eyeY, 3, 2, '#000000');
      this.fillRect(ctx, cx + eyeSpacing - 1, eyeY + 1, 1, 1, skinLight);
    } else if (eyeState === 'pain') {
      this.strokeLine(ctx, cx + eyeSpacing - 1, eyeY, cx + eyeSpacing + 2, eyeY + 2, '#000000');
      this.strokeLine(ctx, cx + eyeSpacing - 1, eyeY + 2, cx + eyeSpacing + 2, eyeY, '#000000');
    } else if (eyeState === 'determined') {
      this.fillRect(ctx, cx + eyeSpacing - 2, eyeY, 3, 1, '#000000');
      this.fillRect(ctx, cx + eyeSpacing - 1, eyeY + 1, 1, 1, skinLight);
    } else {
      this.fillRect(ctx, cx + eyeSpacing - 2, eyeY, 3, 3, '#000000');
      this.fillRect(ctx, cx + eyeSpacing - 1, eyeY + 1, 1, 1, '#FFFFFF');
    }
    
    // Nose
    this.fillRect(ctx, cx - 1, eyeY + 5, 2, 2, skinDark);
    this.fillRect(ctx, cx, eyeY + 5, 1, 1, skinLight);
    
    // Mouth
    const mouthY = eyeY + 9;
    if (eyeState === 'focused' || eyeState === 'determined') {
      this.strokeLine(ctx, cx - 3, mouthY, cx + 3, mouthY, '#333333');
    } else if (eyeState === 'pain') {
      this.fillRect(ctx, cx - 2, mouthY, 4, 2, '#333333');
      this.fillRect(ctx, cx - 1, mouthY + 1, 2, 1, '#666666');
    } else {
      this.strokeLine(ctx, cx - 2, mouthY + 1, cx + 2, mouthY + 1, '#333333');
    }
    
    // Hair
    if (isCapoeira) {
      // Capoeira: dreadlocks / tied back hair with headband
      // Headband
      this.fillRect(ctx, headX, y - 1, headW, 3, '#CC0000');
      this.fillRect(ctx, headX + 1, y, headW - 2, 1, '#FF3333');
      // Dreadlocks / hair flowing back
      for (let i = 0; i < 5; i++) {
        const dx = headX + 3 + i * 5;
        this.fillRect(ctx, dx, y - 6, 3, 10, hair);
        this.fillRect(ctx, dx + 1, y - 5, 1, 8, hairLight);
        this.fillRect(ctx, dx, y + 4, 3, 8, hairDark);
      }
      // Sideburns
      this.fillRect(ctx, headX - 1, y + 6, 2, 8, hair);
      this.fillRect(ctx, headX + headW - 1, y + 6, 2, 8, hair);
    } else {
      // Kyokushin: short cropped hair / buzz cut
      this.fillRect(ctx, headX, y - 3, headW, 5, hair);
      this.fillRect(ctx, headX + 1, y - 2, headW - 2, 2, hairLight);
      this.fillRect(ctx, headX + 2, y - 1, headW - 4, 1, hairDark);
      // Side fade
      this.fillRect(ctx, headX - 1, y + 2, 2, 10, hair);
      this.fillRect(ctx, headX + headW - 1, y + 2, 2, 10, hair);
    }
    
    // Ears
    this.fillRect(ctx, headX - 2, y + 8, 2, 6, skin);
    this.fillRect(ctx, headX + headW, y + 8, 2, 6, skin);
    this.fillRect(ctx, headX - 1, y + 9, 1, 4, skinDark);
    this.fillRect(ctx, headX + headW, y + 9, 1, 4, skinDark);
  }
  
  setCharacter(fighter, characterName) {
    this.fighterSprites[fighter.id] = characterName;
    this.fighterAnimationState[fighter.id] = 'idle';
    this.fighterAnimationFrame[fighter.id] = 0;
    this.fighterAnimationTimer[fighter.id] = 0;
  }
  
  updateFighterAnimation(fighter, dt) {
    // Determine animation state from fighter
    let targetState = 'idle';
    
    if (fighter.state === 'dash') targetState = 'dash';
    else if (fighter.state === 'block') targetState = 'block';
    else if (fighter.state === 'hit' || fighter.isHit) targetState = 'hit';
    else if (fighter.state.startsWith('attack') || fighter.state === 'special' || fighter.isAttacking) {
      if (fighter.state === 'heavyAttack' || fighter.state === 'heavyAttack2') targetState = 'heavyAttack';
      else if (fighter.state === 'special') targetState = 'special';
      else if (fighter.state === 'airAttack') targetState = 'airAttack';
      else if (fighter.state === 'crouchAttack') targetState = 'crouchAttack';
      else targetState = 'attack';
    }
    else if (!fighter.onGround) {
      if (fighter.velocityY < 0) targetState = 'jump';
      else targetState = 'fall';
    }
    else if (Math.abs(fighter.velocityX) > 1) {
      targetState = 'walk';
    }
    else if (fighter.state === 'crouch') {
      targetState = 'block'; // Use block as crouch
    }
    
    // Update animation state
    if (this.fighterAnimationState[fighter.id] !== targetState) {
      this.fighterAnimationState[fighter.id] = targetState;
      this.fighterAnimationFrame[fighter.id] = 0;
      this.fighterAnimationTimer[fighter.id] = 0;
    }
    
    // For attack animations, use attackProgress directly for frame selection
    if (fighter.isAttacking && fighter.attackDuration > 0) {
      const frameCount = this.animationFrameCounts[targetState] || 1;
      // Map attackProgress (0-1) to frame index
      this.fighterAnimationFrame[fighter.id] = Math.floor(fighter.attackProgress * frameCount) % frameCount;
    } else {
      // Advance animation frame normally for non-attack states
      const fps = this.animationFPS[targetState] || 6;
      const frameCount = this.animationFrameCounts[targetState] || 1;
      this.fighterAnimationTimer[fighter.id] += dt;
      const frameTime = 1 / fps;
      
      if (this.fighterAnimationTimer[fighter.id] >= frameTime) {
        this.fighterAnimationTimer[fighter.id] -= frameTime;
        this.fighterAnimationFrame[fighter.id] = (this.fighterAnimationFrame[fighter.id] + 1) % frameCount;
      }
    }
  }
  
  updateCamera(dt) {
    // Camera shake
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
    
    // Smooth camera follow - center on midpoint between fighters
    const f1 = this.game?.fighter1;
    const f2 = this.game?.fighter2;
    
    if (f1 && f2) {
      const midX = (f1.x + f2.x) / 2;
      const distance = Math.abs(f1.x - f2.x);
      
      // Target camera position
      const targetX = midX - this.viewportWidth / 2;
      
      // Clamp to arena bounds
      const minX = this.arenaLeft - this.viewportWidth / 2;
      const maxX = this.arenaRight - this.viewportWidth / 2;
      this.cameraX = Math.max(minX, Math.min(maxX, targetX));
      
      // Vertical camera follows action
      const midY = (f1.y + f2.y) / 2;
      this.cameraY = Math.max(0, midY - this.viewportHeight / 2);
    }
  }
  
  updateParticles(dt) {
    this.particles = this.particles.filter(p => {
      p.life -= dt;
      if (p.life <= 0) return false;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 500 * dt; // gravity
      p.alpha = p.life / p.maxLife;
      return true;
    });
  }
  
  addHitParticles(x, y, color = '#ffd700', count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 150;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        life: 0.3 + Math.random() * 0.5,
        maxLife: 0.8,
        color,
        size: 2 + Math.random() * 4,
        alpha: 1
      });
    }
  }
  
  addParticle(x, y, color, velocity, life, size = 3) {
    this.particles.push({
      x, y,
      vx: velocity.x,
      vy: velocity.y,
      life,
      maxLife: life,
      color,
      size,
      alpha: 1
    });
  }
  
  triggerScreenFlash(color = '#ffffff', duration = 150) {
    this.screenFlash = { active: true, color, alpha: 0.6, duration, timer: duration };
  }
  
  shakeCamera(intensity, duration = 300) {
    this.screenShake.intensity = intensity;
    this.screenShake.duration = duration;
    this.screenShake.elapsed = 0;
  }
  
  flashScreen(color, duration = 100) {
    this.triggerScreenFlash(color, duration);
  }
  
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    
    // Calculate scale to fit reference resolution
    this.scaleX = width / this.referenceWidth;
    this.scaleY = height / this.referenceHeight;
    const scale = Math.min(this.scaleX, this.scaleY);
    
    this.viewportWidth = this.referenceWidth;
    this.viewportHeight = this.referenceHeight;
  }
  
  handleResize() {
    this.resize(window.innerWidth, window.innerHeight);
  }
  
  clear() {
    // Sky blue - Stage draws full background
    this.ctx.fillStyle = '#87CEEB';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }
  
  render() {
    this.clear();
    
    // Apply camera transform
    this.ctx.save();
    this.ctx.translate(-this.cameraX + this.screenShake.x, -this.cameraY + this.screenShake.y);
    this.ctx.scale(this.scaleX, this.scaleY);
    
    // Draw stage (Kenney-style arena with mountains, clouds, platforms, etc.)
    if (this.game?.stage) {
      this.game.stage.render(this.ctx, this);
    }
    
    // Draw fighters
    this.drawFighter(1);
    this.drawFighter(2);
    
    // Draw particles
    this.drawParticles();
    
    this.ctx.restore();
    
    // Draw screen flash (on top, not affected by camera)
    this.drawScreenFlash();
  }
  
  drawArena() {
    const groundY = this.groundY;
    const arenaWidth = this.arenaRight - this.arenaLeft;
    
    // Ground
    const groundGradient = this.ctx.createLinearGradient(0, groundY, 0, this.referenceHeight);
    groundGradient.addColorStop(0, '#2B050B');
    groundGradient.addColorStop(0.5, '#360A11');
    groundGradient.addColorStop(1, '#4A0E17');
    this.ctx.fillStyle = groundGradient;
    this.ctx.fillRect(this.arenaLeft, groundY, arenaWidth, this.referenceHeight - groundY);
    
    // Grid lines
    this.ctx.strokeStyle = '#4A0E17';
    this.ctx.lineWidth = 1;
    const gridSize = 50;
    for (let x = this.arenaLeft; x <= this.arenaRight; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, groundY);
      this.ctx.lineTo(x, this.referenceHeight);
      this.ctx.stroke();
    }
    for (let y = groundY; y <= this.referenceHeight; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.arenaLeft, y);
      this.ctx.lineTo(this.arenaRight, y);
      this.ctx.stroke();
    }
    
    // Gold accent lines at edges
    this.ctx.strokeStyle = '#D4AF37';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(this.arenaLeft, groundY);
    this.ctx.lineTo(this.arenaLeft, this.referenceHeight);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(this.arenaRight, groundY);
    this.ctx.lineTo(this.arenaRight, this.referenceHeight);
    this.ctx.stroke();
    
    // Center line
    this.ctx.strokeStyle = '#D4AF37';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([10, 10]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.referenceWidth / 2, groundY);
    this.ctx.lineTo(this.referenceWidth / 2, this.referenceHeight);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }
  
  drawFighter(fighterId) {
    const fighter = this.game?.['fighter' + fighterId];
    if (!fighter) return;

    // Try to use Kenney sprite if loaded
    if (this.kenneyLoaded[fighterId] && this.kenneySprites[fighterId]) {
      const charType = this.kenneyCharacterType[fighterId];
      const animState = this.fighterAnimationState[fighterId];
      const frameIndex = this.fighterAnimationFrame[fighterId];
      const frames = this.kenneySprites[fighterId][animState];
      if (frames && frames.length > 0) {
        const frame = frames[frameIndex % frames.length];
        const x = fighter.x;
        const y = fighter.y;
        const facing = fighter.facing || 1;
        const targetWidth = 64; // Match procedural sprite width
        const targetHeight = 128; // Match procedural sprite height
        // Kenney sprites have feet ~10px from bottom, adjust so feet touch ground
        const footOffset = 10;

        this.ctx.save();
        this.ctx.translate(x, y + fighter.height);
        if (facing < 0) {
          this.ctx.scale(-1, 1);
        }
        // Kenney sprites are 80x110, we need to center them at bottom
        // Adjust so feet align with ground (similar to procedural)
        this.ctx.drawImage(frame, -targetWidth / 2, -targetHeight + footOffset);
        this.ctx.restore();

        // Attack-specific visual effects (same as procedural)
        if (fighter.isAttacking && fighter.currentAttack) {
          const attackType = fighter.currentAttack.type || fighter.currentAttack;
          const progress = fighter.attackProgress || 0;
          if ((attackType === 'attack' && progress > 0.4 && progress < 0.5) ||
              (attackType === 'heavyAttack' && progress > 0.5 && progress < 0.6) ||
              (attackType === 'special' && progress > 0.5 && progress < 0.6) ||
              (attackType === 'airAttack' && progress > 0.3 && progress < 0.5) ||
              (attackType === 'crouchAttack' && progress > 0.3 && progress < 0.5)) {
            this.triggerScreenFlash('#ffd700', 80);
            this.addHitParticles(x + (facing * 20), y - 10, '#ffd700', 8);
          }
          if ((attackType === 'heavyAttack' && progress > 0.4 && progress < 0.7) ||
              (attackType === 'special' && progress > 0.4 && progress < 0.7)) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillStyle = '#8B0000';
            this.ctx.translate(-facing * 8, 0);
            this.ctx.drawImage(frame, -targetWidth / 2, -targetHeight);
            this.ctx.restore();
          }
        }
        return; // Skip procedural drawing
      }
    }

    // Fallback to procedural sprite (original code)
    const charName = this.fighterSprites[fighterId];
    if (!charName || !this.characterSprites[charName]) return;
    const animState = this.fighterAnimationState[fighterId];
    const frameIndex = this.fighterAnimationFrame[fighterId];
    const frames = this.characterSprites[charName][animState];
    if (!frames || frames.length === 0) return;
    const frame = frames[frameIndex % frames.length];
    const x = fighter.x;
    const y = fighter.y;
    const facing = fighter.facing || 1;
    this.ctx.save();
    this.ctx.translate(x, y + fighter.height);
    if (facing < 0) {
      this.ctx.scale(-1, 1);
    }
    // Procedural sprites are 64x128, feet at bottom
    this.ctx.drawImage(frame, -frame.width / 2, -frame.height);
    if (fighter.isAttacking && fighter.currentAttack) {
      const attackType = fighter.currentAttack.type || fighter.currentAttack;
      const progress = fighter.attackProgress || 0;
      if ((attackType === 'attack' && progress > 0.4 && progress < 0.5) ||
          (attackType === 'heavyAttack' && progress > 0.5 && progress < 0.6) ||
          (attackType === 'special' && progress > 0.5 && progress < 0.6) ||
          (attackType === 'airAttack' && progress > 0.3 && progress < 0.5) ||
          (attackType === 'crouchAttack' && progress > 0.3 && progress < 0.5)) {
        this.triggerScreenFlash('#ffd700', 80);
        this.addHitParticles(x + (facing * 20), y - 10, '#ffd700', 8);
      }
      if ((attackType === 'heavyAttack' && progress > 0.4 && progress < 0.7) ||
          (attackType === 'special' && progress > 0.4 && progress < 0.7)) {
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillStyle = '#8B0000';
        this.ctx.translate(-facing * 8, 0);
        this.ctx.drawImage(frame, -frame.width / 2, -frame.height);
        this.ctx.restore();
      }
    }
    this.ctx.restore();
  }
  
  drawParticles() {
    for (const p of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }
  
  drawScreenFlash() {
    if (this.screenFlash.active) {
      const dt = 1/60; // approximate
      this.screenFlash.timer -= dt * 1000;
      this.screenFlash.alpha = 0.6 * Math.max(0, this.screenFlash.timer / this.screenFlash.duration);
      
      if (this.screenFlash.timer <= 0) {
        this.screenFlash.active = false;
      }
      
      if (this.screenFlash.active) {
        this.ctx.save();
        this.ctx.globalAlpha = this.screenFlash.alpha;
        this.ctx.fillStyle = this.screenFlash.color;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.restore();
      }
    }
  }
}