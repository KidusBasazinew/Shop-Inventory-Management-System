import * as Haptics from "expo-haptics";
import { createAudioPlayer } from "expo-audio";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SOUND_KEY = "settings:soundEffectsEnabled";
const HAPTICS_KEY = "settings:hapticsEnabled";

let soundEnabled = true;
let hapticsEnabled = true;
let players = null;

// Drop your own short sound files here — silently no-ops until you do,
// so nothing crashes in the meantime.
function loadPlayers() {
  if (players) return players;
  try {
    players = {
      success: createAudioPlayer(require("../assets/sounds/success.mp3")),
      tap: createAudioPlayer(require("../assets/sounds/tap.mp3")),
      error: createAudioPlayer(require("../assets/sounds/error.mp3")),
    };
  } catch (e) {
    players = null; // sound files not added yet — fine, haptics still work
  }
  return players;
}

export async function initFeedbackSettings() {
  const [storedSound, storedHaptics] = await Promise.all([
    AsyncStorage.getItem(SOUND_KEY),
    AsyncStorage.getItem(HAPTICS_KEY),
  ]);
  soundEnabled = storedSound !== "false";
  hapticsEnabled = storedHaptics !== "false";
}

export async function setSoundEnabled(value) {
  soundEnabled = value;
  await AsyncStorage.setItem(SOUND_KEY, String(value));
}

export async function setHapticsEnabled(value) {
  hapticsEnabled = value;
  await AsyncStorage.setItem(HAPTICS_KEY, String(value));
}

export function isSoundEnabled() {
  return soundEnabled;
}

export function isHapticsEnabled() {
  return hapticsEnabled;
}

function playSound(name) {
  if (!soundEnabled) return;
  const p = loadPlayers();
  if (!p?.[name]) return;
  try {
    p[name].seekTo(0);
    p[name].play();
  } catch (e) {
    // best-effort — never let a sound glitch break the action it's celebrating
  }
}

export function playSuccess() {
  playSound("success");
  if (hapticsEnabled)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function playError() {
  playSound("error");
  if (hapticsEnabled)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

export function playTap() {
  playSound("tap");
  if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}
