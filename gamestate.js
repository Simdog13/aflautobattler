// gamestate.js

export const GameState = {
  // Meta-state
  tick: 0,
  speed: 500,
  interval: null,

  // Game phases
  phase: 'play', // 'play', 'resetPlay', 'kickoutPlay', 'quarterBreak', 'paused'

  // Scoreboard
  score: {
    home: { goals: 0, behinds: 0 },
    away: { goals: 0, behinds: 0 }
  },

  // Match timing (optional expansion)
  quarter: 1,
  timeLeft: 20 * 60, // in seconds for Q1 (20:00)

  // Utilities
  getScoreString(side) {
    const s = this.score[side];
    const total = s.goals * 6 + s.behinds;
    return `${s.goals}.${s.behinds} (${total})`;
  },

  reset() {
    this.tick = 0;
    this.phase = 'play';
    this.interval = null;
    this.score = {
      home: { goals: 0, behinds: 0 },
      away: { goals: 0, behinds: 0 }
    };
    this.quarter = 1;
    this.timeLeft = 20 * 60;
  },

  advanceQuarter() {
    this.quarter++;
    this.phase = 'quarterBreak';
    this.timeLeft = 20 * 60;
  },

  updateTimer() {
    if (this.phase === 'play' && this.timeLeft > 0) {
      this.timeLeft--;
    } else if (this.timeLeft <= 0) {
      this.advanceQuarter();
    }
  },

  togglePause() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      this.phase = 'paused';
    } else {
      this.phase = 'play';
      this.interval = setInterval(this.tickHandler, this.speed);
    }
  },

  tickHandler: null // You can bind this in game.js to avoid circular imports
};
