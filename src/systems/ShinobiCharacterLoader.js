// Shinobi Character Loader - Loads CraftPix Shinobi pixel art sprites
export class ShinobiCharacterLoader {
  constructor(renderer) {
    this.renderer = renderer;
    this.basePath = '/assets/shinobi-sprites';
    this.loaded = { 1: false, 2: false };
    this.sprites = { 1: {}, 2: {} };
    
    // Shinobi animation mapping - maps game states to actual sprite sheet files
    // Using Shinobi for P1, Samurai for P2 (different visual styles)
    this.characterVariants = {
      1: 'Shinobi',    // Player 1 - Shinobi
      2: 'Samurai'     // Player 2 - Samurai
    };
    
    // Frame dimensions (all CraftPix sprites are 128x128)
    this.frameWidth = 128;
    this.frameHeight = 128;
    
    // Actual frame counts from the sprite sheets
    this.frameCounts = {
      Idle: 6,
      Walk: 8,
      Run: 8,
      Jump: 12,
      Attack_1: 5,
      Attack_2: 3,
      Attack_3: 4,
      Shield: 4,
      Hurt: 2,
      Dead: 4
    };
    
    // Map game states to sprite sheet names
    this.animationMap = {
      idle: 'Idle',
      walk: 'Walk',
      run: 'Run',
      jump: 'Jump',
      fall: 'Jump',  // Use Jump frames for fall
      attack: 'Attack_1',
      heavyAttack: 'Attack_2',
      special: 'Attack_3',
      airAttack: 'Attack_1',  // Use Attack_1 for air attack
      crouchAttack: 'Attack_1',
      block: 'Shield',
      hit: 'Hurt',
      dash: 'Run',  // Use Run frames for dash
      die: 'Dead',
      crouch: 'Idle'  // Use first Idle frame for crouch
    };
  }
  
  async loadAll() {
    await Promise.all([
      this.loadCharacter(1),
      this.loadCharacter(2)
    ]);
    console.log('All Shinobi characters loaded');
  }
  
  async loadCharacter(fighterId) {
    const variant = this.characterVariants[fighterId];
    const sprites = {};
    
    for (const [gameState, spriteAnim] of Object.entries(this.animationMap)) {
      const frameCount = this.frameCounts[spriteAnim] || 1;
      const frames = [];
      
      // Try to load sprite sheet first, then individual frames
      const sheetLoaded = await this.loadSpriteSheet(fighterId, variant, spriteAnim, frameCount, frames);
      
      if (!sheetLoaded) {
        // Fallback: load individual frame files
        await this.loadIndividualFrames(fighterId, variant, spriteAnim, frameCount, frames);
      }
      
      // If still no frames, create placeholder
      if (frames.length === 0) {
        frames.push(this.createPlaceholderFrame());
      }
      
      sprites[gameState] = frames;
    }
    
    this.sprites[fighterId] = sprites;
    this.loaded[fighterId] = true;
    console.log(`Shinobi ${variant} loaded for fighter ${fighterId}`);
  }
  
  async loadSpriteSheet(fighterId, variant, animName, fallbackFrameCount, frames) {
    // Try to load as a horizontal sprite sheet
    const sheetPath = `${this.basePath}/${variant}/${animName}.png`;
    
    try {
      const sheetImg = await this.loadImage(sheetPath);
      // Dynamically calculate frame count from sheet width (all frames are 128px wide)
      const count = sheetImg.width > 0 ? Math.max(1, Math.floor(sheetImg.width / this.frameWidth)) : fallbackFrameCount;
      
      // Slice the sprite sheet into individual frames
      for (let i = 0; i < count; i++) {
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = this.frameWidth;
        frameCanvas.height = this.frameHeight;
        const ctx = frameCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        
        // Draw the specific frame from the sheet
        ctx.drawImage(
          sheetImg,
          i * this.frameWidth, 0,  // source x, y
          this.frameWidth, this.frameHeight,  // source width, height
          0, 0,  // dest x, y
          this.frameWidth, this.frameHeight  // dest width, height
        );
        
        frames.push(frameCanvas);
      }
      
      return true;
    } catch (err) {
      // Sprite sheet not found, will try individual frames
      return false;
    }
  }
  
  async loadIndividualFrames(fighterId, variant, animName, frameCount, frames) {
    for (let i = 0; i < frameCount; i++) {
      // Try multiple naming conventions
      const possibleNames = [
        `${animName}_${i}.png`,
        `${animName}${i}.png`,
        `${animName}_${String(i).padStart(2, '0')}.png`,
        `${variant}_${animName}_${i}.png`
      ];
      
      let loaded = false;
      for (const fileName of possibleNames) {
        const framePath = `${this.basePath}/${variant}/${fileName}`;
        try {
          const img = await this.loadImage(framePath);
          frames.push(img);
          loaded = true;
          break;
        } catch (e) {
          // Try next naming convention
        }
      }
      
      if (!loaded) {
        // Create placeholder for missing frame
        frames.push(this.createPlaceholderFrame());
      }
    }
  }
  
  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load: ${src}`));
      img.src = src;
    });
  }
  
  createPlaceholderFrame() {
    const canvas = document.createElement('canvas');
    canvas.width = this.frameWidth;
    canvas.height = this.frameHeight;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    
    // Draw a simple shinobi placeholder
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(0, 0, this.frameWidth, this.frameHeight);
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SHINOBI', this.frameWidth/2, this.frameHeight/2);
    
    return canvas;
  }
  
  getSprites(fighterId) {
    return this.sprites[fighterId] || {};
  }
  
  isLoaded(fighterId) {
    return this.loaded[fighterId];
  }
  
  // Get frame for current animation state
  getFrame(fighterId, gameState, frameIndex) {
    const sprites = this.sprites[fighterId];
    if (!sprites || !sprites[gameState]) return null;
    
    const frames = sprites[gameState];
    return frames[frameIndex % frames.length];
  }
  
  getFrameCount(fighterId, gameState) {
    const sprites = this.sprites[fighterId];
    if (!sprites || !sprites[gameState]) return 1;
    return sprites[gameState].length;
  }
}