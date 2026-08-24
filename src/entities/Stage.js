// Stage entity - handles 3D arena
export class Stage {
  constructor(config) {
    this.config = config;
    this.groundY = config.groundY;
    this.renderer = null;
  }
  
  setRenderer(renderer) {
    this.renderer = renderer;
  }
  
  render(ctx, renderer) {
    // Layered 2.5D arena floor
    ctx.save();
    const floorGradient = ctx.createLinearGradient(0, this.groundY, 0, this.config.height);
    floorGradient.addColorStop(0, '#5B1820');
    floorGradient.addColorStop(1, '#1A0307');
    ctx.fillStyle = floorGradient;
    ctx.fillRect(0, this.groundY, this.config.width, this.config.height - this.groundY);
    
    // Draw floor line
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, this.groundY);
    ctx.lineTo(this.config.width, this.groundY);
    ctx.stroke();

    // Perspective grid gives the arena a blocky 3D depth cue.
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.22)';
    ctx.lineWidth = 2;
    for (let index = 1; index <= 7; index++) {
      const depth = index / 7;
      const y = this.groundY + Math.pow(depth, 1.7) * (this.config.height - this.groundY);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.config.width, y);
      ctx.stroke();
    }
    for (let index = -6; index <= 6; index++) {
      ctx.beginPath();
      ctx.moveTo(this.config.width / 2 + index * 48, this.groundY);
      ctx.lineTo(this.config.width / 2 + index * 150, this.config.height);
      ctx.stroke();
    }
    
    // Draw some background elements
    ctx.fillStyle = '#360A11';
    ctx.fillRect(100, this.groundY - 200, 200, 200);
    ctx.fillRect(this.config.width - 300, this.groundY - 300, 250, 300);
    this.drawPlatform(ctx, 270, this.groundY - 120, 160, 18, '#8E44AD');
    this.drawPlatform(ctx, this.config.width - 430, this.groundY - 180, 180, 18, '#2980B9');
    
    // Add some pixel art decorative elements
    if (renderer && renderer.drawPixelRect) {
      // Torches on sides
      this.drawTorch(ctx, 50, this.groundY - 100, renderer);
      this.drawTorch(ctx, this.config.width - 50, this.groundY - 100, renderer);
      
      // Pillars
      this.drawPillar(ctx, 150, this.groundY - 250, renderer);
      this.drawPillar(ctx, this.config.width - 150, this.groundY - 250, renderer);
    }
    
    ctx.restore();
  }

  drawPlatform(ctx, x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.24)';
    ctx.fillRect(x, y, width, 4);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x + 10, y + height, width - 20, 10);
  }
  
  drawTorch(ctx, x, y, renderer) {
    // Torch base
    renderer.drawPixelRect(x - 4, y, 8, 40, '#5D2E1E', '#3D1E10', '#8B4513', 2);
    // Flame
    const flicker = Math.sin(Date.now() * 0.01) * 3;
    renderer.drawPixelRect(x - 6 + flicker, y - 20, 12, 20, '#E74C3C', '#C0392B', '#F39C12', 2);
    renderer.drawPixelRect(x - 4 + flicker, y - 30, 8, 15, '#F39C12', '#E74C3C', '#F7DC6F', 2);
    renderer.drawPixelRect(x - 2 + flicker, y - 38, 4, 10, '#F7DC6F', '#F39C12', '#FFFFFF', 2);
  }
  
  drawPillar(ctx, x, y, renderer) {
    // Pillar base
    renderer.drawPixelRect(x - 15, y + 150, 30, 100, '#3D1E10', '#1A0307', '#5D2E1E', 2);
    // Pillar shaft
    renderer.drawPixelRect(x - 12, y, 24, 150, '#4A235A', '#2D1437', '#5D2E1E', 2);
    // Pillar top
    renderer.drawPixelRect(x - 18, y - 10, 36, 10, '#5D2E1E', '#3D1E10', '#8B4513', 2);
  }
}