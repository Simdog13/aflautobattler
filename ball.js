// ball.js

export const Ball = {
  index: null,
  carrier: null,
  state: 'live', // 'live', 'dead', 'airborne'
  projectile: null, // { x, y, vx, vy, duration, remaining }

  reset(cols, rows) {
    const midX = Math.floor(cols / 2);
    const midY = Math.floor(rows / 2);
    this.index = midY * cols + midX;
    this.carrier = null;
    this.state = 'live';
    this.projectile = null;
  },

  pickUp(unit) {
    if (this.state !== 'live') return;
    this.carrier = unit;
    this.index = null;
    this.projectile = null;
  },

  drop(cols) {
    if (this.carrier) {
      const dropIndex = this.carrier.y * cols + this.carrier.x;
      this.index = dropIndex;
      this.carrier = null;
    }
  },

  kickTo(targetX, targetY, duration = 5) {
    if (!this.carrier) return;
    const startX = this.carrier.x;
    const startY = this.carrier.y;
    const dx = targetX - startX;
    const dy = targetY - startY;
    const vx = dx / duration;
    const vy = dy / duration;

    this.projectile = {
      x: startX,
      y: startY,
      vx,
      vy,
      duration,
      remaining: duration
    };

    this.carrier = null;
    this.state = 'airborne';
  },

  update(grid, cols) {
    if (this.carrier || this.state === 'dead') return;

    if (this.state === 'airborne' && this.projectile) {
      const p = this.projectile;
      p.x += p.vx;
      p.y += p.vy;
      p.remaining--;

      if (p.remaining <= 0) {
        const finalX = Math.round(p.x);
        const finalY = Math.round(p.y);
        this.index = finalY * cols + finalX;
        this.projectile = null;
        this.state = 'live';
      }

      return;
    }

    // Attempt pickup if ball is on ground
    const ballX = this.index % cols;
    const ballY = Math.floor(this.index / cols);
    const unit = grid[ballY * cols + ballX]?.occupant;

    if (unit) {
      this.pickUp(unit);
    }
  }
};
