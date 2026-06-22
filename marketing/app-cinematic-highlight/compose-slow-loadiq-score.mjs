import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const repoRoot = resolve(new URL("../..", import.meta.url).pathname);
const outputPath = resolve(
  repoRoot,
  "marketing/app-cinematic-highlight/loadiq-slow-cinematic-score.wav"
);

const sampleRate = 44100;
const duration = 46;
const channels = 2;
const sampleCount = sampleRate * duration;
const buffer = Buffer.alloc(44 + sampleCount * channels * 2);

mkdirSync(dirname(outputPath), { recursive: true });

function writeAscii(offset, value) {
  buffer.write(value, offset, value.length, "ascii");
}

function writeHeader() {
  writeAscii(0, "RIFF");
  buffer.writeUInt32LE(36 + sampleCount * channels * 2, 4);
  writeAscii(8, "WAVE");
  writeAscii(12, "fmt ");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * 2, 28);
  buffer.writeUInt16LE(channels * 2, 32);
  buffer.writeUInt16LE(16, 34);
  writeAscii(36, "data");
  buffer.writeUInt32LE(sampleCount * channels * 2, 40);
}

function clamp(value, min = -1, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function midi(note) {
  return 440 * 2 ** ((note - 69) / 12);
}

function env(t, start, attack, release, length = duration) {
  if (t < start || t > start + length) return 0;
  const local = t - start;
  const end = length - local;
  return Math.min(1, local / attack, end / release);
}

function pulse(t, bpm, phase = 0) {
  const beat = ((t * bpm) / 60 + phase) % 1;
  return Math.exp(-beat * 8);
}

function softSine(freq, t) {
  return Math.sin(2 * Math.PI * freq * t);
}

function triangle(freq, t) {
  return (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * freq * t));
}

function noise(seed) {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

function score(t, channel) {
  const pan = channel === 0 ? -0.18 : 0.18;
  const build = Math.min(1, t / 32);
  const fade = Math.min(1, (duration - t) / 3.5);
  const master = fade * (0.72 + build * 0.28);

  const roots = [38, 34, 41, 36, 43, 39, 45, 41];
  const phrase = Math.floor(t / 5.75) % roots.length;
  const root = roots[phrase];
  const local = t % 5.75;

  const low = softSine(midi(root - 24), t) * 0.26;
  const subPulse = softSine(midi(root - 12), t) * pulse(t, 74, 0.02) * 0.18;

  const chord =
    softSine(midi(root), t + pan * 0.01) * 0.16 +
    softSine(midi(root + 7), t + pan * 0.016) * 0.12 +
    softSine(midi(root + 12), t + pan * 0.012) * 0.1 +
    softSine(midi(root + 19), t + pan * 0.02) * 0.07;

  const pad =
    chord *
    (0.56 + Math.sin(t * 0.42 + channel) * 0.12) *
    env(t, 0, 4, 5);

  const bellNotes = [root + 24, root + 31, root + 36, root + 43];
  const bellIndex = Math.floor((local / 5.75) * bellNotes.length);
  const bellStart = phrase * 5.75 + bellIndex * 1.43 + 0.18;
  const bellEnv = env(t, bellStart, 0.02, 1.6, 1.9);
  const bell =
    (softSine(midi(bellNotes[bellIndex] || root + 24), t) * 0.16 +
      softSine(midi((bellNotes[bellIndex] || root + 24) + 12), t) * 0.04) *
    bellEnv *
    (channel === 0 ? 0.88 : 1.08);

  const kick = Math.sin(2 * Math.PI * (48 + 70 * Math.exp(-(t % 1.62) * 6)) * t) * pulse(t, 74) * 0.34;
  const deepHit =
    Math.sin(2 * Math.PI * 42 * t) *
    (env(t, 10.8, 0.04, 1.4, 2) + env(t, 23, 0.04, 1.8, 2.3) + env(t, 36.2, 0.04, 2.4, 2.8)) *
    0.5;

  const turbine =
    triangle(34 + Math.sin(t * 0.18) * 4, t) *
    (0.04 + build * 0.04) *
    (0.5 + Math.sin(t * 0.9 + channel) * 0.22);

  const air =
    noise(Math.floor(t * 900) + channel * 1000) *
    0.018 *
    (0.5 + Math.sin(t * 0.31) * 0.2);

  const shimmer =
    softSine(2200 + Math.sin(t * 0.6) * 240, t) *
    pulse(t, 148, channel ? 0.5 : 0.0) *
    0.022 *
    build;

  return clamp((low + subPulse + pad + bell + kick + deepHit + turbine + air + shimmer) * master * 0.76);
}

writeHeader();

for (let i = 0; i < sampleCount; i += 1) {
  const t = i / sampleRate;
  for (let channel = 0; channel < channels; channel += 1) {
    const sample = Math.round(score(t, channel) * 32767);
    buffer.writeInt16LE(sample, 44 + (i * channels + channel) * 2);
  }
}

writeFileSync(outputPath, buffer);
console.log(`Wrote ${outputPath}`);
