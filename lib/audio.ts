/**
 * Audio utility for Grow Your Habits
 * Provides Zen sounds for watering, success, and background atmosphere.
 */

const AUDIO_URLS = {
  watering: 'https://assets.mixkit.co/active_storage/sfx/2281/2281-preview.mp3',
  success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  zenBgm: 'https://cdn.pixabay.com/audio/2022/05/27/audio_180873748b.mp3', // Gentle Nature
};

export const playWatering = () => {
  const audio = new Audio(AUDIO_URLS.watering);
  audio.volume = 0.4;
  audio.play().catch(e => console.log('Audio play blocked:', e));
};

export const playSuccess = () => {
  const audio = new Audio(AUDIO_URLS.success);
  audio.volume = 0.5;
  audio.play().catch(e => console.log('Audio play blocked:', e));
};

// Background Music Management (Singleton approach)
let bgmInstance: HTMLAudioElement | null = null;

export const toggleZenBgm = (isPlaying: boolean) => {
  if (typeof window === 'undefined') return;

  if (!bgmInstance) {
    bgmInstance = new Audio(AUDIO_URLS.zenBgm);
    bgmInstance.loop = true;
    bgmInstance.volume = 0.15; // Mellow level
  }

  if (isPlaying) {
    bgmInstance.play().catch(e => console.log('BGM play blocked:', e));
  } else {
    bgmInstance.pause();
  }
};
