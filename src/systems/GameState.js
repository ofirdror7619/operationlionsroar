export class GameState {
  constructor() {
    this.maxHp = 100;
    this.maxLives = 3;
    this.score = 0;
    this.maxAmmo = 100;
    this.ammo = this.maxAmmo;
    this.grenades = 0;
    this.hp = this.maxHp;
    this.lives = this.maxLives;
  }

  addScore(value) {
    this.score += value;
  }

  consumeAmmo(amount = 1) {
    const requestedAmount = Math.max(1, Math.floor(amount));
    if (this.ammo < requestedAmount) {
      return false;
    }

    this.ammo -= requestedAmount;
    return true;
  }

  refillAmmo(amount = this.maxAmmo) {
    this.ammo = amount;
  }

  addAmmo(value) {
    this.ammo = Math.min(this.maxAmmo, this.ammo + value);
  }

  consumeGrenade() {
    if (this.grenades <= 0) {
      return false;
    }

    this.grenades -= 1;
    return true;
  }

  addGrenades(value = 1) {
    this.grenades = Math.max(0, this.grenades + value);
  }

  addLife(value = 1) {
    this.lives = Math.max(0, this.lives + value);
  }

  applyDamage(value) {
    this.hp = Math.max(0, this.hp - value);
  }

  heal(value) {
    this.hp = Math.min(this.maxHp, this.hp + value);
  }

  loseLife() {
    if (this.lives <= 0) {
      return false;
    }

    this.lives -= 1;
    return this.lives > 0;
  }
}
