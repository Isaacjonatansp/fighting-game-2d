// CraftPix Explosion Sprite Loader
export class ExplosionLoader {
  constructor() {
    this.explosions = {};
    this.loadedExplosions = new Set();
  }

  // Map explosion types to folders (use simple 10-frame types)
  static EXPLOSION_TYPES = {
    basic: 'Explosion_1',      // 10 frames
    burst: 'Explosion_2',      // 10 frames
    cloud: 'Explosion_3',      // 10 frames
    ring: 'Explosion_5',       // 10 frames
    spark: 'Explosion_6',      // 10 frames
    smoke: 'Explosion_8',      // 10 frames
    pop: 'Explosion_9',        // 10 frames
    mega: 'Explosion_10'       // 10 frames
  };

  async loadExplosion(explosionType = 'basic') {
    if (this.loadedExplosions.has(explosionType)) {
      return this.explosions[explosionType];
    }

    const folder = ExplosionLoader.EXPLOSION_TYPES[explosionType] || 'Explosion_1';
    const basePath = `/assets/craftpix-net-840730-free-animated-explosion-sprite-pack/PNG/${folder}`;
    const frames = [];

    // Load 10 frames per explosion type
    for (let i = 1; i <= 10; i++) {
      const fileName = `Explosion_${i}.png`;
      const imagePath = `${basePath}/${fileName}`;

      try {
        const img = await this.loadImage(imagePath);
        frames.push(img);
      } catch (err) {
        console.warn(`Failed to load explosion frame: ${imagePath}`, err);
      }
    }

    this.explosions[explosionType] = frames;
    this.loadedExplosions.add(explosionType);
    console.log(`Loaded ${explosionType}: ${frames.length} frames`);
    return frames;
  }

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }

  // Get frame for animation
  getFrame(explosionType, frameIndex) {
    const frames = this.explosions[explosionType];
    if (!frames || frames.length === 0) return null;
    return frames[frameIndex % frames.length];
  }

  // Draw explosion animation
  drawExplosion(ctx, explosionType, frameIndex, x, y, scale = 1.0) {
    const frame = this.getFrame(explosionType, frameIndex);
    if (!frame) return;

    const w = frame.width * scale;
    const h = frame.height * scale;
    ctx.drawImage(frame, x - w / 2, y - h / 2, w, h);
  }
}