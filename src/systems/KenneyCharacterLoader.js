// Kenney Character Sprite Loader
export class KenneyCharacterLoader {
  constructor() {
    this.sprites = {};
    this.loadedCharacters = new Set();
  }

  // Map game animation states to Kenney pose files
  static ANIMATION_MAP = {
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

  // Scale factor: Kenney 80×110 → Game 64×128
  static SCALE = {
    width: 64 / 80,
    height: 128 / 110
  };

  async loadCharacter(characterName, characterType) {
    const key = `${characterName}_${characterType}`;
    if (this.loadedCharacters.has(key)) {
      return this.sprites[key];
    }

    const sprites = {};
    const basePath = `/assets/kenney-platformer/PNG/${characterType}/Poses`;

    for (const [gameState, poseRef] of Object.entries(KenneyCharacterLoader.ANIMATION_MAP)) {
      const poseFiles = Array.isArray(poseRef) ? poseRef : [poseRef];
      const frames = [];

      for (const poseFile of poseFiles) {
        const fileName = `${characterType.toLowerCase()}_${poseFile}.png`;
        const imagePath = `${basePath}/${fileName}`;

        try {
          const img = await this.loadImage(imagePath);
          frames.push(img);
        } catch (err) {
          console.error(`Failed to load sprite: ${imagePath}`, err);
          // Fallback: create placeholder
          frames.push(this.createPlaceholder());
        }
      }

      sprites[gameState] = frames;
    }

    this.sprites[key] = sprites;
    this.loadedCharacters.add(key);
    return sprites;
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

  // Draw sprite at target size with flipping support
  drawSprite(ctx, sprite, x, y, targetWidth, targetHeight, flipped = false) {
    if (!sprite) return;

    // Save context state
    ctx.save();

    // Apply flipping if needed
    if (flipped) {
      ctx.translate(x + targetWidth, y);
      ctx.scale(-1, 1);
      ctx.drawImage(sprite, 0, 0, targetWidth, targetHeight);
    } else {
      ctx.drawImage(sprite, x, y, targetWidth, targetHeight);
    }

    ctx.restore();
  }

  // Get sprite for current game state and frame
  getSprite(spriteData, animState, frameIndex) {
    if (!spriteData || !spriteData[animState]) {
      return null;
    }

    const frames = spriteData[animState];
    const frame = frameIndex % frames.length;
    return frames[frame];
  }
}
