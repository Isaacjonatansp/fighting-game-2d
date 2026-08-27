// 2D Pixel Art Renderer for Fighting Game
import { ShinobiCharacterLoader } from './ShinobiCharacterLoader.js';

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
    
    // Shinobi character loader
    this.shinobiLoader = new ShinobiCharacterLoader(this);
    this.shinobiLoaded = { 1: false, 2: false };
    
    // Animation frame rates (frames per second) - adjusted for Shinobi sprites
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
      block: 8,
      hit: 10,
      dash: 15,
      die: 4
    };
    
    // Frame counts for each animation (matching Shinobi sprites)
    this.animationFrameCounts = {
      idle: 6,
      walk: 8,
      run: 8,
      jump: 12,
      fall: 12,
      attack: 5,
      heavyAttack: 3,
      special: 4,
      airAttack: 5,
      crouchAttack: 5,
      block: 4,
      hit: 2,
      dash: 8,
      die: 4
    };
    
    // Particle and visual effects system
    this.particles = [];
    this.afterimages = [];
    this.afterimageTimer = { 1: 0, 2: 0 };
    this.screenFlash = { active: false, alpha: 0, color: '#ffffff', duration: 0, timer: 0 };
    this.screenShake = { intensity: 0, duration: 0, elapsed: 0, x: 0, y: 0 };
    
    // Initialize
    this.generateCharacterSprites();
    this.loadShinobiSprites();
    this.setupCanvas();
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
    this.resize(window.innerWidth, window.innerHeight);
  }

  // Load Shinobi sprites from CraftPix assets
  async loadShinobiSprites() {
    await this.shinobiLoader.loadAll();
    this.shinobiLoaded[1] = this.shinobiLoader.isLoaded(1);
    this.shinobiLoaded[2] = this.shinobiLoader.isLoaded(2);
    console.log('Shinobi and Samurai sprites loaded:', this.shinobiLoaded);
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

    // Load for both characters using dynamic character types
    await Promise.all([
      this.loadKenneyCharacter(1, this.kenneyCharacterType[1]),
      this.loadKenneyCharacter(2, this.kenneyCharacterType[2])
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
    const frameCount = this.shinobiLoaded[fighter.id]
      ? this.shinobiLoader.getFrameCount(fighter.id, targetState)
      : (this.animationFrameCounts[targetState] || 1);

    if (fighter.isAttacking && fighter.attackDuration > 0) {
      // Map attackProgress (0-1) to frame index
      this.fighterAnimationFrame[fighter.id] = Math.floor(fighter.attackProgress * frameCount) % frameCount;
    } else {
      // Advance animation frame normally for non-attack states
      const fps = this.animationFPS[targetState] || 6;
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
    // Update afterimages
    this.afterimages = this.afterimages.filter(img => {
      img.life -= dt;
      if (img.life <= 0) return false;
      img.alpha = Math.max(0, (img.life / img.maxLife) * (img.baseAlpha || 0.45));
      return true;
    });

    // Update particles
    this.particles = this.particles.filter(p => {
      p.life -= dt;
      if (p.life <= 0) return false;
      
      p.alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
      
      switch (p.type) {
        case 'electric_spark':
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx += (Math.random() - 0.5) * 600 * dt;
          p.vy += 120 * dt;
          p.vx *= 0.94;
          p.vy *= 0.94;
          break;
          
        case 'ember':
          p.seed = p.seed || Math.random() * 10;
          p.x += p.vx * dt + Math.sin(p.life * 12 + p.seed) * 20 * dt;
          p.y += p.vy * dt;
          p.vy -= 25 * dt; // Rising embers
          p.vx *= 0.95;
          break;
          
        case 'hit_star':
          p.rotation = (p.rotation || 0) + (p.rotSpeed || 10) * dt;
          p.size = (p.baseSize || 20) * (p.life / p.maxLife);
          break;
          
        case 'impact_ring':
          p.radius = (p.radius || 10) + (p.expandSpeed || 140) * dt;
          p.lineWidth = Math.max(0.5, (p.baseLineWidth || 3) * (p.life / p.maxLife));
          break;
          
        case 'shadow_smoke':
          p.x += (p.vx || 0) * dt;
          p.y += (p.vy || -30) * dt;
          p.radius = (p.radius || 8) + (p.expandSpeed || 25) * dt;
          p.rotation = (p.rotation || 0) + (p.rotSpeed || 2) * dt;
          break;
          
        case 'shuriken':
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rotation = (p.rotation || 0) + (p.facing > 0 ? 30 : -30) * dt;
          // Spawn subtle smoke trail
          if (Math.random() < 0.4) {
            this.addShadowSmoke(p.x, p.y, '#00E5FF', 0.2, 4);
          }
          break;
          
        case 'blade_wave':
          p.x += p.vx * dt;
          p.y += (p.vy || 0) * dt;
          // Trailing particles
          if (p.character === 'Shinobi') {
            this.addElectricSpark(p.x - p.facing * 10, p.y + (Math.random() - 0.5) * 40, '#00F0FF', 0.25);
          } else {
            this.addEmber(p.x - p.facing * 10, p.y + (Math.random() - 0.5) * 40, '#FF6D00', 0.35);
          }
          break;
          
        case 'barrier':
          p.radius = (p.baseRadius || 40) + Math.sin((1 - p.life / p.maxLife) * Math.PI) * 5;
          break;
          
        case 'slash_cut':
          // Static slash cut that fades
          break;
          
        default:
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += (p.gravity !== undefined ? p.gravity : 450) * dt;
          p.vx *= (p.drag !== undefined ? p.drag : 0.98);
          p.vy *= (p.drag !== undefined ? p.drag : 0.98);
          break;
      }
      
      return true;
    });
  }
  
  addHitParticles(x, y, color = '#ffd700', count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 150;
      this.particles.push({
        type: 'spark',
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        life: 0.3 + Math.random() * 0.4,
        maxLife: 0.7,
        color,
        size: 2 + Math.random() * 3,
        alpha: 1
      });
    }
  }
  
  addParticle(x, y, color, velocity, life, size = 3) {
    this.particles.push({
      type: 'spark',
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

  addElectricSpark(x, y, color = '#00F0FF', life = 0.3, size = 3) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 160;
    this.particles.push({
      type: 'electric_spark',
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 20,
      life,
      maxLife: life,
      color,
      size,
      alpha: 1
    });
  }

  addEmber(x, y, color = '#FF6D00', life = 0.6, size = 3) {
    const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 0.8;
    const speed = 30 + Math.random() * 80;
    this.particles.push({
      type: 'ember',
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 30,
      life,
      maxLife: life,
      color,
      size: size + Math.random() * 2,
      seed: Math.random() * 100,
      alpha: 1
    });
  }

  addShadowSmoke(x, y, color = '#00E5FF', life = 0.35, radius = 12) {
    this.particles.push({
      type: 'shadow_smoke',
      x, y,
      vx: (Math.random() - 0.5) * 30,
      vy: -15 - Math.random() * 25,
      radius,
      expandSpeed: 20,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 4,
      life,
      maxLife: life,
      color,
      alpha: 0.6
    });
  }

  spawnCharacterHitEffect(x, y, attackType, attackerColor, attackerVelocityX, attackerChar, facing = 1, attackKey = 'attack', comboStep = 1) {
    const isHeavy = attackType === 'heavy' || attackType === 'special';
    const isShinobi = attackerChar === 'Shinobi';
    
    if (isShinobi) {
      // === SHINOBI HIT EFFECT: Electric / Lightning Star + Cyan Slice ===
      // 1. Core Star Hitspark
      this.particles.push({
        type: 'hit_star',
        x, y,
        baseSize: isHeavy ? 36 : 24,
        size: isHeavy ? 36 : 24,
        rotation: Math.random() * Math.PI,
        rotSpeed: 15 * (Math.random() > 0.5 ? 1 : -1),
        points: 8,
        innerColor: '#FFFFFF',
        outerColor: '#00F0FF',
        glowColor: '#0077FE',
        life: isHeavy ? 0.22 : 0.16,
        maxLife: isHeavy ? 0.22 : 0.16,
        alpha: 1
      });

      // 2. Cyan Slash Cut Line across the hit point
      const cutAngle = (facing > 0 ? -0.4 : 0.4) + (Math.random() - 0.5) * 0.3;
      this.particles.push({
        type: 'slash_cut',
        x, y,
        length: isHeavy ? 70 : 45,
        angle: cutAngle,
        width: isHeavy ? 5 : 3,
        color: '#00F0FF',
        coreColor: '#FFFFFF',
        life: 0.18,
        maxLife: 0.18,
        alpha: 1
      });

      // 3. Electric / Lightning Sparks shooting in slice direction
      const sparkCount = isHeavy ? 28 : 16;
      for (let i = 0; i < sparkCount; i++) {
        const baseAngle = facing > 0 ? (Math.PI * 0.1) : (Math.PI * 0.9);
        const angle = baseAngle + (Math.random() - 0.5) * Math.PI * 0.7;
        const speed = isHeavy ? (120 + Math.random() * 220) : (80 + Math.random() * 140);
        this.particles.push({
          type: 'electric_spark',
          x, y,
          vx: Math.cos(angle) * speed + attackerVelocityX * 0.3,
          vy: Math.sin(angle) * speed - 30,
          life: 0.25 + Math.random() * 0.3,
          maxLife: 0.55,
          color: i % 3 === 0 ? '#FFFFFF' : (i % 2 === 0 ? '#00F0FF' : '#0077FE'),
          size: isHeavy ? (3 + Math.random() * 3) : (2 + Math.random() * 2),
          alpha: 1
        });
      }

      // 4. Expanding Cyan Impact Shockwave Ring
      this.particles.push({
        type: 'impact_ring',
        x, y,
        radius: 8,
        expandSpeed: isHeavy ? 220 : 140,
        baseLineWidth: isHeavy ? 4 : 2.5,
        color: '#00F0FF',
        life: isHeavy ? 0.28 : 0.18,
        maxLife: isHeavy ? 0.28 : 0.18,
        alpha: 1
      });

      // 5. Shadow smoke puff on heavy
      if (isHeavy) {
        this.addShadowSmoke(x, y, '#001133', 0.4, 18);
        this.addShadowSmoke(x + facing * 15, y, '#00E5FF', 0.3, 14);
      }

    } else {
      // === SAMURAI HIT EFFECT: Molten Flame Burst + Crimson Cut ===
      // 1. Fiery Star Hitspark
      this.particles.push({
        type: 'hit_star',
        x, y,
        baseSize: isHeavy ? 40 : 26,
        size: isHeavy ? 40 : 26,
        rotation: Math.random() * Math.PI,
        rotSpeed: 12 * (Math.random() > 0.5 ? 1 : -1),
        points: 6,
        innerColor: '#FFFFFF',
        outerColor: '#FFD700',
        glowColor: '#FF1744',
        life: isHeavy ? 0.25 : 0.18,
        maxLife: isHeavy ? 0.25 : 0.18,
        alpha: 1
      });

      // 2. Fiery Crimson Slash Cut Line
      const cutAngle = (facing > 0 ? 0.4 : -0.4) + (Math.random() - 0.5) * 0.3;
      this.particles.push({
        type: 'slash_cut',
        x, y,
        length: isHeavy ? 75 : 50,
        angle: cutAngle,
        width: isHeavy ? 6 : 3.5,
        color: '#FF1744',
        coreColor: '#FFF8E1',
        life: 0.2,
        maxLife: 0.2,
        alpha: 1
      });

      // 3. Floating Burning Embers & Fire Sparks
      const emberCount = isHeavy ? 30 : 18;
      for (let i = 0; i < emberCount; i++) {
        const baseAngle = facing > 0 ? (Math.PI * 0.15) : (Math.PI * 0.85);
        const angle = baseAngle + (Math.random() - 0.5) * Math.PI * 0.85;
        const speed = isHeavy ? (100 + Math.random() * 200) : (60 + Math.random() * 120);
        this.particles.push({
          type: 'ember',
          x, y,
          vx: Math.cos(angle) * speed + attackerVelocityX * 0.2,
          vy: Math.sin(angle) * speed - 50,
          life: 0.35 + Math.random() * 0.4,
          maxLife: 0.75,
          color: i % 4 === 0 ? '#FFFFFF' : (i % 3 === 0 ? '#FFD700' : (i % 2 === 0 ? '#FF6D00' : '#FF1744')),
          size: isHeavy ? (3.5 + Math.random() * 3.5) : (2 + Math.random() * 2.5),
          seed: Math.random() * 50,
          alpha: 1
        });
      }

      // 4. Expanding Fiery Gold Shockwave Ring
      this.particles.push({
        type: 'impact_ring',
        x, y,
        radius: 10,
        expandSpeed: isHeavy ? 240 : 150,
        baseLineWidth: isHeavy ? 4.5 : 3,
        color: '#FF9100',
        life: isHeavy ? 0.3 : 0.2,
        maxLife: isHeavy ? 0.3 : 0.2,
        alpha: 1
      });
    }
  }

  spawnCharacterBlockEffect(x, y, defenderColor, defenderChar, facing = 1) {
    const isShinobi = defenderChar === 'Shinobi';
    
    if (isShinobi) {
      // Shinobi: Hexagonal Ninjutsu barrier ward
      this.particles.push({
        type: 'barrier',
        x: x + (facing > 0 ? 15 : -15),
        y: y - 10,
        baseRadius: 32,
        radius: 32,
        color: '#00F0FF',
        life: 0.22,
        maxLife: 0.22,
        alpha: 0.85
      });
      
      // Deflect sparks
      for (let i = 0; i < 12; i++) {
        const angle = (facing > 0 ? Math.PI : 0) + (Math.random() - 0.5) * Math.PI * 0.8;
        const speed = 70 + Math.random() * 110;
        this.addElectricSpark(x, y - 10, '#00F0FF', 0.25);
      }
    } else {
      // Samurai: Heavy steel katana parry clash
      this.particles.push({
        type: 'hit_star',
        x: x + (facing > 0 ? 12 : -12),
        y: y - 10,
        baseSize: 22,
        size: 22,
        rotation: 0,
        rotSpeed: 20,
        points: 4,
        innerColor: '#FFFFFF',
        outerColor: '#FFD700',
        glowColor: '#FF9100',
        life: 0.16,
        maxLife: 0.16,
        alpha: 1
      });

      this.particles.push({
        type: 'impact_ring',
        x: x + (facing > 0 ? 12 : -12),
        y: y - 10,
        radius: 6,
        expandSpeed: 120,
        baseLineWidth: 2.5,
        color: '#FFD700',
        life: 0.18,
        maxLife: 0.18,
        alpha: 1
      });

      for (let i = 0; i < 14; i++) {
        const angle = (facing > 0 ? Math.PI : 0) + (Math.random() - 0.5) * Math.PI * 0.7;
        const speed = 80 + Math.random() * 120;
        this.addParticle(
          x, y - 10, i % 2 === 0 ? '#FFFFFF' : '#FFD700',
          { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed - 40 },
          0.3 + Math.random() * 0.2,
          2.5 + Math.random() * 2
        );
      }
    }
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
    
    this.scaleX = width / this.referenceWidth;
    this.scaleY = height / this.referenceHeight;
    this.viewportWidth = this.referenceWidth;
    this.viewportHeight = this.referenceHeight;
  }
  
  handleResize() {
    this.resize(window.innerWidth, window.innerHeight);
  }
  
  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
  
  render() {
    this.clear();
    
    // Apply camera transform
    this.ctx.save();
    this.ctx.translate(-this.cameraX + this.screenShake.x, -this.cameraY + this.screenShake.y);
    this.ctx.scale(this.scaleX, this.scaleY);
    
    // 1. Draw stage (rock arena, platforms, background)
    if (this.game?.stage) {
      this.game.stage.render(this.ctx, this);
    }
    
    // 2. Draw afterimages behind characters
    this.drawAfterimages();

    // 3. Draw fighters and their active weapon slash arcs
    this.drawFighter(1);
    this.drawFighter(2);
    
    // 4. Draw traveling energy projectiles (blade waves, shurikens)
    this.drawEnergyProjectiles();

    // 5. Draw particles, hitsparks, and effects with additive glow
    this.drawParticles();
    
    this.ctx.restore();
    
    // 6. Draw screen flash on top
    this.drawScreenFlash();
  }

  drawAfterimages() {
    for (const img of this.afterimages) {
      this.ctx.save();
      this.ctx.globalAlpha = img.alpha;
      this.ctx.translate(img.x, img.y);
      if (img.facing < 0) {
        this.ctx.scale(-1, 1);
      }

      // Draw tinted shadow/flame silhouette
      this.ctx.drawImage(img.frame, -img.width / 2, -img.height);
      
      // Overlay color tint
      this.ctx.globalCompositeOperation = 'source-atop';
      this.ctx.fillStyle = img.color || '#00E5FF';
      this.ctx.fillRect(-img.width / 2, -img.height, img.width, img.height);

      this.ctx.restore();
    }
  }

  drawFighter(fighterId) {
    const fighter = this.game?.['fighter' + fighterId];
    if (!fighter) return;

    // Use Shinobi / Samurai sprite loader
    if (this.shinobiLoaded[fighterId]) {
      const animState = this.fighterAnimationState[fighterId];
      const frameIndex = this.fighterAnimationFrame[fighterId];
      const frame = this.shinobiLoader.getFrame(fighterId, animState, frameIndex);
      
      if (frame) {
        const x = fighter.x;
        const y = fighter.y;
        const facing = fighter.facing || 1;
        const targetWidth = 144;
        const targetHeight = 144;
        
        const centerX = fighter.x + fighter.width / 2;
        const bottomY = fighter.y + fighter.height;
        const isShinobi = fighter.character === 'Shinobi' || fighterId === 1;

        // Capture afterimages during dash, heavy attack, or special
        if (fighter.state === 'dash' || fighter.state === 'heavyAttack' || fighter.state === 'heavyAttack2' || fighter.state === 'special') {
          this.afterimageTimer[fighterId] = (this.afterimageTimer[fighterId] || 0) - (this.game?.deltaTime || 0.016);
          if (this.afterimageTimer[fighterId] <= 0) {
            this.afterimages.push({
              frame,
              x: centerX,
              y: bottomY,
              width: targetWidth,
              height: targetHeight,
              facing,
              alpha: 0.45,
              baseAlpha: 0.45,
              life: 0.24,
              maxLife: 0.24,
              color: isShinobi ? '#00E5FF' : '#FF3D00'
            });
            this.afterimageTimer[fighterId] = 0.055;
          }
        }

        // Draw character sprite
        this.ctx.save();
        this.ctx.translate(centerX, bottomY);
        if (facing < 0) {
          this.ctx.scale(-1, 1);
        }
        this.ctx.drawImage(frame, -targetWidth / 2, -targetHeight);
        this.ctx.restore();

        // Draw character-themed active attack effects (weapon slash trails, glows, etc.)
        this.drawCharacterAttackFX(fighter, fighterId, centerX, bottomY, facing, targetWidth, targetHeight);
        return;
      }
    }

    // Fallback procedural sprite
    const charName = this.fighterSprites[fighterId];
    if (!charName || !this.characterSprites[charName]) return;
    const animState = this.fighterAnimationState[fighterId];
    const frameIndex = this.fighterAnimationFrame[fighterId];
    const frames = this.characterSprites[charName][animState];
    if (!frames || frames.length === 0) return;
    const frame = frames[frameIndex % frames.length];
    const facing = fighter.facing || 1;
    this.ctx.save();
    this.ctx.translate(fighter.x, fighter.y + fighter.height);
    if (facing < 0) {
      this.ctx.scale(-1, 1);
    }
    this.ctx.drawImage(frame, -frame.width / 2, -frame.height);
    this.ctx.restore();
  }

  drawCharacterAttackFX(fighter, fighterId, centerX, bottomY, facing, targetWidth, targetHeight) {
    if (!fighter.isAttacking && fighter.state !== 'dash') return;

    const isShinobi = fighter.character === 'Shinobi' || fighterId === 1;
    const progress = fighter.attackProgress || 0;
    const state = fighter.state;
    const ctx = this.ctx;

    // Hand/Katana origin point
    const weaponOriginX = centerX + facing * 20;
    const weaponOriginY = bottomY - 60;

    ctx.save();

    if (isShinobi) {
      // ==========================================
      // === SHINOBI ATTACK VISUAL EFFECTS ========
      // ==========================================
      if (state === 'attack') {
        // Light 1: Swift horizontal neon-cyan slash arc
        if (progress >= 0.15 && progress <= 0.65) {
          const arcProgress = (progress - 0.15) / 0.5;
          const arcRadius = 55;
          const startAngle = (facing > 0 ? -Math.PI * 0.35 : Math.PI * 0.65) + arcProgress * (facing > 0 ? 0.7 : -0.7);
          const endAngle = startAngle + (facing > 0 ? 1.2 : -1.2);
          
          this.drawSlashArc(ctx, weaponOriginX, weaponOriginY, arcRadius, startAngle, endAngle, '#FFFFFF', '#00F0FF', '#0077FE', 14, facing);
          
          // Trailing electric sparks
          if (Math.random() < 0.6) {
            this.addElectricSpark(weaponOriginX + facing * Math.cos(endAngle) * arcRadius, weaponOriginY + Math.sin(endAngle) * arcRadius, '#00F0FF', 0.2);
          }
        }
      } else if (state === 'attack2') {
        // Light 2: Upward rising diagonal azure crescent slash
        if (progress >= 0.15 && progress <= 0.65) {
          const arcProgress = (progress - 0.15) / 0.5;
          const arcRadius = 60;
          const startAngle = (facing > 0 ? Math.PI * 0.3 : Math.PI * 0.7) - arcProgress * (facing > 0 ? 1.0 : -1.0);
          const endAngle = startAngle - (facing > 0 ? 1.1 : -1.1);
          
          this.drawSlashArc(ctx, weaponOriginX, weaponOriginY + 10, arcRadius, startAngle, endAngle, '#FFFFFF', '#00E5FF', '#0077FE', 16, facing);
        }
      } else if (state === 'attack3') {
        // Light 3: Dual lightning thrust & shadow shurikens
        if (progress >= 0.15 && progress <= 0.7) {
          const arcProgress = (progress - 0.15) / 0.55;
          const arcRadius = 68;
          const startAngle = (facing > 0 ? -Math.PI * 0.4 : Math.PI * 0.6) + arcProgress * (facing > 0 ? 1.1 : -1.1);
          const endAngle = startAngle + (facing > 0 ? 1.3 : -1.3);
          
          this.drawSlashArc(ctx, weaponOriginX + facing * 15, weaponOriginY, arcRadius, startAngle, endAngle, '#FFFFFF', '#00F0FF', '#18FFFF', 18, facing);
          
          // Spawn 3 spinning shadow shurikens at peak swing
          if (progress >= 0.35 && progress <= 0.42 && !fighter._shurikenSpawned) {
            fighter._shurikenSpawned = true;
            for (let s = -1; s <= 1; s++) {
              this.particles.push({
                type: 'shuriken',
                character: 'Shinobi',
                x: weaponOriginX + facing * 35,
                y: weaponOriginY + s * 14,
                vx: facing * (340 + Math.abs(s) * 20),
                vy: s * 30,
                facing,
                life: 0.38,
                maxLife: 0.38,
                alpha: 1
              });
            }
          }
        } else {
          fighter._shurikenSpawned = false;
        }
      } else if (state === 'heavyAttack' || state === 'heavyAttack2') {
        // Heavy: Twin Shadow Cross (X-slash) + air distortion
        if (progress >= 0.2 && progress <= 0.75) {
          const arcProgress = (progress - 0.2) / 0.55;
          const radius = 72;
          
          // Slash 1 (down-right)
          this.drawSlashArc(ctx, weaponOriginX, weaponOriginY, radius, -Math.PI * 0.4, Math.PI * 0.4, '#FFFFFF', '#00F0FF', '#0077FE', 20, facing);
          // Slash 2 (up-right cross)
          this.drawSlashArc(ctx, weaponOriginX, weaponOriginY, radius, Math.PI * 0.4, -Math.PI * 0.3, '#FFFFFF', '#18FFFF', '#0077FE', 16, facing);
          
          if (Math.random() < 0.5) {
            this.addElectricSpark(weaponOriginX + facing * 40, weaponOriginY + (Math.random() - 0.5) * 40, '#00F0FF', 0.25);
          }
        }
      } else if (state === 'special') {
        // Special: "Raijin Shadow Gale" — giant electric crescent wave
        if (progress >= 0.2 && progress <= 0.8) {
          const radius = 80;
          this.drawSlashArc(ctx, weaponOriginX + facing * 10, weaponOriginY - 5, radius, -Math.PI * 0.5, Math.PI * 0.5, '#FFFFFF', '#00FFFF', '#0077FE', 24, facing);
          
          // Spawn traveling electric crescent blade wave
          if (progress >= 0.32 && progress <= 0.4 && !fighter._bladeWaveSpawned) {
            fighter._bladeWaveSpawned = true;
            this.particles.push({
              type: 'blade_wave',
              character: 'Shinobi',
              x: weaponOriginX + facing * 30,
              y: weaponOriginY - 5,
              vx: facing * 450,
              vy: 0,
              facing,
              width: 24,
              height: 90,
              color: '#00F0FF',
              coreColor: '#FFFFFF',
              life: 0.45,
              maxLife: 0.45,
              alpha: 1
            });
            this.triggerScreenFlash('#00E5FF', 90);
          }
        } else {
          fighter._bladeWaveSpawned = false;
        }
      } else if (state === 'airAttack') {
        // Air: Downward diving 45-degree cyan slash
        if (progress >= 0.15 && progress <= 0.65) {
          this.drawSlashArc(ctx, weaponOriginX, weaponOriginY + 15, 60, -Math.PI * 0.2, Math.PI * 0.6, '#FFFFFF', '#00F0FF', '#0077FE', 18, facing);
        }
      } else if (state === 'crouchAttack') {
        // Crouch: Low sweeping ground-level cyan blade
        if (progress >= 0.15 && progress <= 0.65) {
          this.drawSlashArc(ctx, weaponOriginX + facing * 10, bottomY - 20, 55, Math.PI * 0.1, Math.PI * 0.8, '#FFFFFF', '#00F0FF', '#0077FE', 14, facing);
          this.addElectricSpark(weaponOriginX + facing * 45, bottomY - 10, '#00F0FF', 0.2);
        }
      }

    } else {
      // ==========================================
      // === SAMURAI ATTACK VISUAL EFFECTS ========
      // ==========================================
      if (state === 'attack') {
        // Light 1: Fiery crimson & gold katana slash arc
        if (progress >= 0.15 && progress <= 0.65) {
          const arcProgress = (progress - 0.15) / 0.5;
          const arcRadius = 58;
          const startAngle = (facing > 0 ? -Math.PI * 0.35 : Math.PI * 0.65) + arcProgress * (facing > 0 ? 0.7 : -0.7);
          const endAngle = startAngle + (facing > 0 ? 1.2 : -1.2);
          
          this.drawSlashArc(ctx, weaponOriginX, weaponOriginY, arcRadius, startAngle, endAngle, '#FFFFFF', '#FFD700', '#FF1744', 16, facing);
          
          if (Math.random() < 0.6) {
            this.addEmber(weaponOriginX + facing * Math.cos(endAngle) * arcRadius, weaponOriginY + Math.sin(endAngle) * arcRadius, '#FF6D00', 0.3);
          }
        }
      } else if (state === 'attack2') {
        // Light 2: Heavy downward cleave with molten heat trail
        if (progress >= 0.15 && progress <= 0.65) {
          const arcProgress = (progress - 0.15) / 0.5;
          const arcRadius = 64;
          const startAngle = (facing > 0 ? -Math.PI * 0.6 : Math.PI * 0.4) + arcProgress * (facing > 0 ? 0.9 : -0.9);
          const endAngle = startAngle + (facing > 0 ? 1.3 : -1.3);
          
          this.drawSlashArc(ctx, weaponOriginX, weaponOriginY, arcRadius, startAngle, endAngle, '#FFF8E1', '#FF9100', '#D50000', 18, facing);
        }
      } else if (state === 'attack3') {
        // Light 3: Wide horizontal flame cleave and ember burst
        if (progress >= 0.15 && progress <= 0.7) {
          const arcRadius = 72;
          this.drawSlashArc(ctx, weaponOriginX + facing * 10, weaponOriginY, arcRadius, -Math.PI * 0.3, Math.PI * 0.4, '#FFFFFF', '#FFD700', '#FF1744', 22, facing);
          
          if (progress >= 0.35 && progress <= 0.42 && !fighter._emberBurstSpawned) {
            fighter._emberBurstSpawned = true;
            for (let i = 0; i < 8; i++) {
              this.addEmber(weaponOriginX + facing * 45, weaponOriginY + (Math.random() - 0.5) * 30, '#FF3D00', 0.45);
            }
          }
        } else {
          fighter._emberBurstSpawned = false;
        }
      } else if (state === 'heavyAttack' || state === 'heavyAttack2') {
        // Heavy: "Oni Cleave" — massive vertical power slash with ground eruption
        if (progress >= 0.2 && progress <= 0.75) {
          const radius = 78;
          this.drawSlashArc(ctx, weaponOriginX + facing * 12, weaponOriginY - 10, radius, -Math.PI * 0.7, Math.PI * 0.3, '#FFFFFF', '#FFD700', '#FF1744', 24, facing);
          
          if (progress > 0.45 && progress < 0.6) {
            // Ground spark blast
            this.addHitParticles(weaponOriginX + facing * 50, bottomY - 10, '#FFD700', 4);
          }
        }
      } else if (state === 'special') {
        // Special: "Dragon Flame Wave" — surging fire crescent traveling along ground
        if (progress >= 0.2 && progress <= 0.8) {
          const radius = 85;
          this.drawSlashArc(ctx, weaponOriginX + facing * 15, weaponOriginY, radius, -Math.PI * 0.6, Math.PI * 0.4, '#FFF8E1', '#FF9100', '#FF1744', 26, facing);
          
          // Spawn traveling fire crescent blade wave
          if (progress >= 0.32 && progress <= 0.4 && !fighter._bladeWaveSpawned) {
            fighter._bladeWaveSpawned = true;
            this.particles.push({
              type: 'blade_wave',
              character: 'Samurai',
              x: weaponOriginX + facing * 35,
              y: weaponOriginY + 10,
              vx: facing * 420,
              vy: 0,
              facing,
              width: 28,
              height: 95,
              color: '#FF3D00',
              coreColor: '#FFD700',
              life: 0.48,
              maxLife: 0.48,
              alpha: 1
            });
            this.triggerScreenFlash('#FF3D00', 90);
          }
        } else {
          fighter._bladeWaveSpawned = false;
        }
      } else if (state === 'airAttack') {
        // Air: 360-degree flaming katana wheel
        if (progress >= 0.15 && progress <= 0.7) {
          const wheelProgress = (progress - 0.15) / 0.55;
          const startA = wheelProgress * Math.PI * 2 * facing;
          this.drawSlashArc(ctx, centerX, bottomY - 70, 65, startA, startA + Math.PI * 1.4 * facing, '#FFF8E1', '#FFD700', '#FF1744', 18, facing);
        }
      } else if (state === 'crouchAttack') {
        // Crouch: Low drawing katana sweep with molten sparks
        if (progress >= 0.15 && progress <= 0.65) {
          this.drawSlashArc(ctx, weaponOriginX + facing * 10, bottomY - 18, 60, Math.PI * 0.1, Math.PI * 0.75, '#FFF8E1', '#FF9100', '#FF1744', 16, facing);
          this.addEmber(weaponOriginX + facing * 50, bottomY - 8, '#FFD700', 0.25);
        }
      }
    }

    ctx.restore();
  }

  // Draw smooth, glowing katana slash arc with core and gradient glow
  drawSlashArc(ctx, cx, cy, radius, startAngle, endAngle, coreColor, midColor, outerColor, width, facing) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    
    // Outer glow
    ctx.strokeStyle = outerColor;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle, facing < 0);
    ctx.stroke();
    
    // Mid intense color
    ctx.strokeStyle = midColor;
    ctx.lineWidth = width * 0.6;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle, facing < 0);
    ctx.stroke();
    
    // Inner white core
    ctx.strokeStyle = coreColor;
    ctx.lineWidth = width * 0.25;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle, facing < 0);
    ctx.stroke();
    
    ctx.restore();
  }

  drawEnergyProjectiles() {
    for (const p of this.particles) {
      if (p.type === 'blade_wave') {
        this.drawBladeWave(p);
      } else if (p.type === 'shuriken') {
        this.drawShuriken(p);
      }
    }
  }

  drawBladeWave(p) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = p.alpha;
    ctx.translate(p.x, p.y);
    if (p.facing < 0) {
      ctx.scale(-1, 1);
    }

    const isShinobi = p.character === 'Shinobi';
    const h = p.height || 90;
    const w = p.width || 25;

    // Glowing crescent path
    ctx.beginPath();
    ctx.moveTo(w, 0);
    ctx.quadraticCurveTo(-w * 0.5, -h * 0.5, -w, -h * 0.5);
    ctx.quadraticCurveTo(0, 0, -w, h * 0.5);
    ctx.quadraticCurveTo(-w * 0.5, h * 0.5, w, 0);
    ctx.closePath();

    // Fill with gradient
    const grad = ctx.createLinearGradient(-w, 0, w, 0);
    if (isShinobi) {
      grad.addColorStop(0, 'rgba(0, 119, 254, 0)');
      grad.addColorStop(0.5, '#00F0FF');
      grad.addColorStop(1, '#FFFFFF');
    } else {
      grad.addColorStop(0, 'rgba(213, 0, 0, 0)');
      grad.addColorStop(0.5, '#FF6D00');
      grad.addColorStop(1, '#FFF8E1');
    }
    ctx.fillStyle = grad;
    ctx.fill();

    // Outer glow stroke
    ctx.strokeStyle = isShinobi ? '#00FFFF' : '#FFD700';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }

  drawShuriken(p) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = p.alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation || 0);

    const size = 12;
    // 4-point ninja star
    ctx.fillStyle = '#00F0FF';
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const xTip = Math.cos(angle) * size;
      const yTip = Math.sin(angle) * size;
      const xInner = Math.cos(angle + Math.PI / 4) * (size * 0.35);
      const yInner = Math.sin(angle + Math.PI / 4) * (size * 0.35);
      if (i === 0) ctx.moveTo(xTip, yTip);
      else ctx.lineTo(xTip, yTip);
      ctx.lineTo(xInner, yInner);
    }
    ctx.closePath();
    ctx.fill();

    // Center core
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawParticles() {
    const ctx = this.ctx;
    
    for (const p of this.particles) {
      // Blade waves and shurikens are rendered in drawEnergyProjectiles
      if (p.type === 'blade_wave' || p.type === 'shuriken') continue;

      ctx.save();
      ctx.globalAlpha = p.alpha;

      if (p.type === 'hit_star') {
        // Multi-point hitspark star
        ctx.globalCompositeOperation = 'lighter';
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        
        const pts = p.points || 6;
        const outerR = p.size || 20;
        const innerR = outerR * 0.25;
        
        ctx.beginPath();
        for (let i = 0; i < pts * 2; i++) {
          const r = i % 2 === 0 ? outerR : innerR;
          const a = (i * Math.PI) / pts;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        
        ctx.fillStyle = p.outerColor || '#FFD700';
        ctx.shadowColor = p.glowColor || '#FF1744';
        ctx.shadowBlur = 12;
        ctx.fill();
        
        // Inner core
        ctx.fillStyle = p.innerColor || '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, innerR, 0, Math.PI * 2);
        ctx.fill();

      } else if (p.type === 'slash_cut') {
        // Slash cut mark
        ctx.globalCompositeOperation = 'lighter';
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle || 0);
        
        const halfLen = (p.length || 50) / 2;
        ctx.strokeStyle = p.color || '#00F0FF';
        ctx.lineWidth = p.width || 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-halfLen, 0);
        ctx.lineTo(halfLen, 0);
        ctx.stroke();

        ctx.strokeStyle = p.coreColor || '#FFFFFF';
        ctx.lineWidth = Math.max(1, (p.width || 4) * 0.35);
        ctx.beginPath();
        ctx.moveTo(-halfLen * 0.8, 0);
        ctx.lineTo(halfLen * 0.8, 0);
        ctx.stroke();

      } else if (p.type === 'impact_ring') {
        // Expanding shockwave ring
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = p.color || '#FFFFFF';
        ctx.lineWidth = p.lineWidth || 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius || 10, 0, Math.PI * 2);
        ctx.stroke();

      } else if (p.type === 'shadow_smoke') {
        // Soft dark smoke cloud
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.radius || 12);
        grad.addColorStop(0, p.color || 'rgba(0, 229, 255, 0.4)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius || 12, 0, Math.PI * 2);
        ctx.fill();

      } else if (p.type === 'barrier') {
        // Hexagonal energy shield
        ctx.globalCompositeOperation = 'lighter';
        ctx.translate(p.x, p.y);
        const r = p.radius || 30;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          const hx = Math.cos(a) * r;
          const hy = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 240, 255, 0.25)';
        ctx.fill();
        ctx.strokeStyle = p.color || '#00F0FF';
        ctx.lineWidth = 3;
        ctx.stroke();

      } else if (p.type === 'electric_spark') {
        // Bright electric spark
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = p.color || '#00F0FF';
        ctx.shadowColor = p.color || '#00F0FF';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size || 2.5, 0, Math.PI * 2);
        ctx.fill();

      } else if (p.type === 'ember') {
        // Fiery glowing ember
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = p.color || '#FF6D00';
        ctx.shadowColor = '#FF1744';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size || 3, 0, Math.PI * 2);
        ctx.fill();

      } else {
        // Standard particle
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size || 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }
  
  drawScreenFlash() {
    if (this.screenFlash.active) {
      const dt = 1/60;
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