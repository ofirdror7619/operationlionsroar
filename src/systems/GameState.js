export class GameState {
  constructor() {
    this.maxHp = 100;
    this.score = 0;
    this.maxAmmo = 100;
    this.ammo = this.maxAmmo;
    this.grenades = 3;
    this.hp = this.maxHp;
  }

  addScore(value) {
    this.score += value;
  }

  consumeAmmo() {
    if (this.ammo <= 0) {
      return false;
    }

    this.ammo -= 1;
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

  applyDamage(value) {
    this.hp = Math.max(0, this.hp - value);
  }

  heal(value) {
    this.hp = Math.min(this.maxHp, this.hp + value);
  }
}
