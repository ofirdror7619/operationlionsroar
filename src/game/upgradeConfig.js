export const WEAPON_MAG_UPGRADE_REGISTRY_KEYS = {
  m203: "weaponMagUpgradeLevelM203",
  tavor: "weaponMagUpgradeLevelTavor",
  mag: "weaponMagUpgradeLevelMag58"
};

export const WEAPON_BASE_AMMO_CAPACITY = {
  m203: 100,
  tavor: 100,
  mag: 100
};

export const WEAPON_MAG_UPGRADE_STEP = 100;
export const WEAPON_MAG_UPGRADE_COSTS = {
  m203: [2200],
  tavor: [2600],
  mag: [3000]
};

export const GRENADE_RADIUS_UPGRADE_REGISTRY_KEY = "grenadeRadiusUpgradeLevel";
export const GRENADE_BASE_RADIUS = 170;
export const GRENADE_RADIUS_UPGRADE_STEP = 45;
export const GRENADE_RADIUS_UPGRADE_COSTS = [1800, 2800];

export function getWeaponMagazineUpgradeLevel(registry, weaponId) {
  const key = WEAPON_MAG_UPGRADE_REGISTRY_KEYS[weaponId];
  const raw = Number(key ? registry.get(key) : 0);
  if (!Number.isFinite(raw)) {
    return 0;
  }

  return Math.max(0, Math.floor(raw));
}

export function getWeaponMagazineUpgradeCost(weaponId, level) {
  const costs = WEAPON_MAG_UPGRADE_COSTS[weaponId] ?? [];
  const normalizedLevel = Math.max(0, Math.floor(Number(level) || 0));
  return costs[normalizedLevel] ?? null;
}

export function getWeaponMaxAmmoCapacity(registry, weaponId) {
  const baseCapacity = WEAPON_BASE_AMMO_CAPACITY[weaponId] ?? 100;
  const costs = WEAPON_MAG_UPGRADE_COSTS[weaponId] ?? [];
  const level = getWeaponMagazineUpgradeLevel(registry, weaponId);
  const clampedLevel = Math.min(level, costs.length);
  return baseCapacity + clampedLevel * WEAPON_MAG_UPGRADE_STEP;
}

export function getWeaponMagazineMaxLevel(weaponId) {
  const costs = WEAPON_MAG_UPGRADE_COSTS[weaponId] ?? [];
  return costs.length;
}

export function getGrenadeRadiusUpgradeLevel(registry) {
  const raw = Number(registry.get(GRENADE_RADIUS_UPGRADE_REGISTRY_KEY) ?? 0);
  if (!Number.isFinite(raw)) {
    return 0;
  }

  return Math.max(0, Math.floor(raw));
}

export function getGrenadeRadiusUpgradeCost(level) {
  const normalizedLevel = Math.max(0, Math.floor(Number(level) || 0));
  return GRENADE_RADIUS_UPGRADE_COSTS[normalizedLevel] ?? null;
}

export function getGrenadeBlastRadius(registry) {
  const level = getGrenadeRadiusUpgradeLevel(registry);
  const clampedLevel = Math.min(level, GRENADE_RADIUS_UPGRADE_COSTS.length);
  return GRENADE_BASE_RADIUS + clampedLevel * GRENADE_RADIUS_UPGRADE_STEP;
}

export function getGrenadeRadiusMaxLevel() {
  return GRENADE_RADIUS_UPGRADE_COSTS.length;
}
