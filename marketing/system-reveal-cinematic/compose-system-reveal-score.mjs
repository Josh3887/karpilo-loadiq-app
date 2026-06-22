import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const repoRoot = resolve(new URL("../..", import.meta.url).pathname);
const outputPath = resolve(
  repoRoot,
  "marketing/system-reveal-cinematic/karpilo-system-reveal-score.wav"
);

const sampleRate = 44100;
const channels = 2;
const duration = 48;
const totalSamples = sampleRate * duration;
const buffer = Buffer.alloc(44 + totalSamples * channels * 2);

mkdirSync(dirname(outputPath), { recursive: true });

function writeAscii(offset, value) {
  buffer.write(value, offset, value.length, "ascii");
}

function writeHeader() {
  writeAscii(0, "RIFF");
  buffer.writeUInt32LE(36 + totalSamples * channels * 2, 4);
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
  buffer.writeUInt32LE(totalSamples * channels * 2, 40);
}

function clamp(value, min = -1, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function midi(note) {
  return 440 * 2 ** ((note - 69) / 12);
}

function sine(freq, t) {
  return Math.sin(2 * Math.PI * freq * t);
}

function saw(freq, t) {
  return 2 * ((t * freq) % 1) - 1;
}

function smoothNoise(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

function envelope(t, start, attack, release, length) {
  if (t < start || t > start + length) return 0;
  const local = t - start;
  const remaining = length - local;
  return Math.min(1, local / attack, remaining / release);
}

function pulse(t, bpm, phase = 0, decay = 9) {
  const beat = ((t * bpm) / 60 + phase) % 1;
  return Math.exp(-beat * decay);
}

function score(t, channel) {
  const left = channel === 0;
  const stereo = left ? -0.011 : 0.013;
  const globalIn = Math.min(1, t / 5.5);
  const globalOut = Math.min(1, (duration - t) / 4);
  const arc = Math.min(1, Math.max(0, (t - 8) / 30));
  const master = globalIn * globalOut * (0.62 + arc * 0.32);

  const roots = [33, 33, 36, 31, 38, 34, 41, 36];
  const section = Math.floor(t / 6) % roots.length;
  const root = roots[section];

  const sub =
    sine(midi(root - 24), t) * 0.26 +
    sine(midi(root - 12), t + stereo) * 0.18 * (0.6 + pulse(t, 70, 0.03, 7) * 0.8);

  const pad =
    (sine(midi(root), t + stereo) * 0.13 +
      sine(midi(root + 7), t + stereo * 1.8) * 0.1 +
      sine(midi(root + 12), t + stereo * 1.3) * 0.1 +
      sine(midi(root + 19), t + stereo * 1.5) * 0.065) *
    (0.74 + Math.sin(t * 0.32 + channel) * 0.18);

  const turbine =
    (saw(27 + Math.sin(t * 0.11) * 3, t) * 0.035 +
      sine(82 + Math.sin(t * 0.21) * 7, t) * 0.03) *
    (0.6 + arc * 0.7);

  const bassHit =
    sine(43 + Math.exp(-((t * 70) % 60) / 20) * 28, t) *
    pulse(t, 70, 0, 8) *
    (t > 9 ? 0.28 : 0.06);

  const impacts =
    sine(36, t) *
    (envelope(t, 7.8, 0.04, 1.7, 2.1) +
      envelope(t, 17.8, 0.04, 1.9, 2.4) +
      envelope(t, 30, 0.04, 2.2, 2.6) +
      envelope(t, 40.4, 0.04, 3.0, 3.2)) *
    0.56;

  const highSignal =
    (sine(1500 + Math.sin(t * 0.7) * 220, t) * pulse(t, 140, left ? 0.08 : 0.58, 18) * 0.025 +
      sine(2300, t) * envelope(t, 4.4, 0.02, 0.8, 1.1) * 0.05 +
      sine(1900, t) * envelope(t, 23.4, 0.02, 1.2, 1.4) * 0.04);

  const legacyTheme =
    (sine(midi(root + 24), t + stereo) * 0.11 +
      sine(midi(root + 31), t + stereo * 1.4) * 0.08) *
    envelope(t, 34, 3.2, 4.8, 11);

  const air =
    smoothNoise(Math.floor(t * 820) + channel * 900) *
    0.016 *
    (0.75 + Math.sin(t * 0.19) * 0.24);

  return clamp(
    (sub + pad + turbine + bassHit + impacts + highSignal + legacyTheme + air) *
      master *
      0.68
  );
}

writeHeader();

for (let i = 0; i < totalSamples; i += 1) {
  const t = i / sampleRate;
  for (let channel = 0; channel < channels; channel += 1) {
    const sample = Math.round(score(t, channel) * 32767);
    buffer.writeInt16LE(sample, 44 + (i * channels + channel) * 2);
  }
}

writeFileSync(outputPath, buffer);
console.log(`Wrote ${outputPath}`);
