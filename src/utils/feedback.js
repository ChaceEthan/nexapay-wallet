/**
 * Triggers a subtle haptic vibration and a short synthetic "click" sound.
 */
export const playFeedback = () => {
  // Check preference from localStorage
  let enabled = true;
  let volume = 0.5;
  let preset = "modern";
  try {
    enabled = JSON.parse(localStorage.getItem("nexa_feedback_enabled") ?? "true");
    volume = JSON.parse(localStorage.getItem("nexa_feedback_volume") ?? "0.5");
    preset = JSON.parse(localStorage.getItem("nexa_feedback_preset") ?? '"modern"');
    if (!enabled) return;
  } catch (e) { }

  // 1. Haptic Feedback (Supported on Android and some mobile browsers)
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(10); // Short 10ms tap
  }

  // 2. Synthetic Audio Feedback (Web Audio API)
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Preset Sound Profiles
    let frequency = 880;
    let type = "sine";
    let duration = 0.1;

    switch (preset) {
      case "retro":
        type = "square";
        frequency = 440;
        duration = 0.15;
        break;
      case "soft":
        type = "triangle";
        frequency = 523.25;
        duration = 0.2;
        break;
      default: // modern
        type = "sine";
        frequency = 880;
        duration = 0.1;
    }

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume * 0.05, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume * 0.01), ctx.currentTime + duration);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Silently fail if audio is blocked or unsupported
  }
};