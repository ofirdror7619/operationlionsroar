const AUDIO_SETTINGS_STORAGE_KEY = "operation-lions-roar-audio-settings-v1";
const AUDIO_REGISTRY_KEYS = {
  initialized: "audioSettingsInitialized",
  enabled: "audioEnabled",
  musicVolume: "audioMusicVolume",
  sfxVolume: "audioSfxVolume"
};
const DEFAULT_AUDIO_SETTINGS = {
  enabled: true,
  musicVolume: 1,
  sfxVolume: 1
};

const clamp01 = (value, fallback = 1) => {
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) {
    return fallback;
  }

  return Math.min(1, Math.max(0, normalized));
};

const canUseStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

function readStoredAudioSettings() {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(AUDIO_SETTINGS_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue);
    return {
      enabled: typeof parsed?.enabled === "boolean" ? parsed.enabled : DEFAULT_AUDIO_SETTINGS.enabled,
      musicVolume: clamp01(parsed?.musicVolume, DEFAULT_AUDIO_SETTINGS.musicVolume),
      sfxVolume: clamp01(parsed?.sfxVolume, DEFAULT_AUDIO_SETTINGS.sfxVolume)
    };
  } catch {
    return null;
  }
}

function writeStoredAudioSettings(settings) {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(AUDIO_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage failures and continue with runtime registry state.
  }
}

export function ensureAudioSettings(registry) {
  if (!registry || registry.get(AUDIO_REGISTRY_KEYS.initialized)) {
    return getAudioSettings(registry);
  }

  const storedSettings = readStoredAudioSettings();
  const nextSettings = storedSettings ?? DEFAULT_AUDIO_SETTINGS;

  registry.set(AUDIO_REGISTRY_KEYS.enabled, nextSettings.enabled);
  registry.set(AUDIO_REGISTRY_KEYS.musicVolume, nextSettings.musicVolume);
  registry.set(AUDIO_REGISTRY_KEYS.sfxVolume, nextSettings.sfxVolume);
  registry.set(AUDIO_REGISTRY_KEYS.initialized, true);
  return nextSettings;
}

export function getAudioSettings(registry) {
  const enabledValue = registry?.get(AUDIO_REGISTRY_KEYS.enabled);
  const musicVolumeValue = registry?.get(AUDIO_REGISTRY_KEYS.musicVolume);
  const sfxVolumeValue = registry?.get(AUDIO_REGISTRY_KEYS.sfxVolume);
  return {
    enabled: typeof enabledValue === "boolean" ? enabledValue : DEFAULT_AUDIO_SETTINGS.enabled,
    musicVolume: clamp01(musicVolumeValue, DEFAULT_AUDIO_SETTINGS.musicVolume),
    sfxVolume: clamp01(sfxVolumeValue, DEFAULT_AUDIO_SETTINGS.sfxVolume)
  };
}

export function updateAudioSettings(registry, updates = {}) {
  ensureAudioSettings(registry);
  const previous = getAudioSettings(registry);
  const nextSettings = {
    enabled: typeof updates.enabled === "boolean" ? updates.enabled : previous.enabled,
    musicVolume: clamp01(
      Object.prototype.hasOwnProperty.call(updates, "musicVolume") ? updates.musicVolume : previous.musicVolume,
      previous.musicVolume
    ),
    sfxVolume: clamp01(
      Object.prototype.hasOwnProperty.call(updates, "sfxVolume") ? updates.sfxVolume : previous.sfxVolume,
      previous.sfxVolume
    )
  };

  registry.set(AUDIO_REGISTRY_KEYS.enabled, nextSettings.enabled);
  registry.set(AUDIO_REGISTRY_KEYS.musicVolume, nextSettings.musicVolume);
  registry.set(AUDIO_REGISTRY_KEYS.sfxVolume, nextSettings.sfxVolume);
  writeStoredAudioSettings(nextSettings);
  return nextSettings;
}

export function getMusicOutputVolume(registry, baseVolume = 1) {
  ensureAudioSettings(registry);
  const settings = getAudioSettings(registry);
  return settings.enabled ? baseVolume * settings.musicVolume : 0;
}

export function getSfxOutputVolume(registry, baseVolume = 1) {
  ensureAudioSettings(registry);
  const settings = getAudioSettings(registry);
  return settings.enabled ? baseVolume * settings.sfxVolume : 0;
}

export function applyMasterMute(scene) {
  if (!scene?.sound || !scene?.registry) {
    return;
  }

  ensureAudioSettings(scene.registry);
  const settings = getAudioSettings(scene.registry);
  scene.sound.mute = !settings.enabled;
}

