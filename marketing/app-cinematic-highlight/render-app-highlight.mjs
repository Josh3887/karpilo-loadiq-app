import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import sharp from "sharp";

const repoRoot = resolve(new URL("../..", import.meta.url).pathname);
const ffmpeg =
  process.env.FFMPEG_BIN ||
  "/private/tmp/loadiq-video-tools/node_modules/ffmpeg-static/ffmpeg";

const width = 720;
const height = 1280;
const fps = 30;
const outDir = resolve(repoRoot, "marketing/app-cinematic-highlight");
const sceneDir = resolve(outDir, "scenes");
const outputPath = resolve(outDir, "karpilo-loadiq-app-cinematic-highlight.mp4");
const posterPath = resolve(outDir, "karpilo-loadiq-app-cinematic-highlight-poster.png");
const audioPath = resolve(outDir, "loadiq-slow-cinematic-score.wav");

if (!existsSync(ffmpeg)) {
  throw new Error(`ffmpeg binary not found at ${ffmpeg}`);
}

if (!existsSync(audioPath)) {
  throw new Error(`Audio missing at ${audioPath}. Run compose-slow-loadiq-score.mjs first.`);
}

mkdirSync(sceneDir, { recursive: true });

const colors = {
  bg: "#020711",
  panel: "#07111D",
  panel2: "#0B1724",
  line: "#1C3449",
  blue: "#35C8FF",
  green: "#39F58A",
  red: "#FF355B",
  amber: "#FFB84A",
  purple: "#AF73FF",
  white: "#EAF8FF",
  muted: "#91A8BA",
};

const scenes = [
  {
    seconds: 6,
    eyebrow: "KARPILO LOADIQ",
    title: "See the load before you run it.",
    subtitle: "A profitability calculator built for the real cost of the mile.",
    accent: colors.blue,
    kind: "dashboard",
  },
  {
    seconds: 6,
    eyebrow: "ANALYZE LOAD",
    title: "Inputs shape the estimate.",
    subtitle: "Inputs stay practical. Outputs stay estimate-focused.",
    accent: colors.green,
    kind: "calculator",
  },
  {
    seconds: 6,
    eyebrow: "TRUE RPM",
    title: "Deadhead changes the story.",
    subtitle: "Loaded miles can look good until unpaid miles dilute the route.",
    accent: colors.red,
    kind: "route",
  },
  {
    seconds: 6,
    eyebrow: "FUEL + FSC",
    title: "Fuel pressure belongs in the decision.",
    subtitle: "FSC recovery, MPG, and price per gallon shape the estimate.",
    accent: colors.amber,
    kind: "fuel",
  },
  {
    seconds: 6,
    eyebrow: "POST-TRIP ACTUALS",
    title: "Compare estimate to trip.",
    subtitle: "Fuel, DEF, tolls, parking, repairs, and other trip costs stay organized.",
    accent: colors.purple,
    kind: "actuals",
  },
  {
    seconds: 6,
    eyebrow: "SAVED LOADS",
    title: "Build operating memory over time.",
    subtitle: "Snapshots help you review lanes, costs, and repeated decisions.",
    accent: colors.blue,
    kind: "history",
  },
  {
    seconds: 6,
    eyebrow: "ATLAS GUIDANCE",
    title: "Context without control.",
    subtitle: "Educational insight explains the numbers. You stay the operator.",
    accent: colors.green,
    kind: "atlas",
  },
  {
    seconds: 4,
    eyebrow: "KARPILO ENDEAVOR TECHNOLOGIES",
    title: "Karpilo LoadIQ",
    subtitle: "Transportation profitability estimation for operators.",
    accent: colors.blue,
    kind: "final",
  },
];

function xml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function text(value, x, y, size, fill = colors.white, anchor = "start", weight = 800, attrs = "") {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" ${attrs}>${xml(
    value
  )}</text>`;
}

function rect(x, y, w, h, fill, attrs = "") {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${fill}" ${attrs}/>`;
}

function line(x1, y1, x2, y2, stroke, attrs = "") {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" ${attrs}/>`;
}

function metric(label, value, x, y, accent, note = "") {
  return `
    ${rect(x, y, 182, 118, colors.panel2, `stroke="${colors.line}" stroke-width="1"`)}
    ${text(label, x + 18, y + 34, 14, colors.muted, "start", 800, 'letter-spacing="2"')}
    ${text(value, x + 18, y + 76, 32, accent, "start", 900)}
    ${note ? text(note, x + 18, y + 101, 12, colors.muted, "start", 700) : ""}
  `;
}

function screenFrame(scene, content) {
  return `
    <g filter="url(#shadow)">
      <rect x="54" y="252" width="612" height="756" rx="34" fill="#06101B" stroke="${scene.accent}" stroke-opacity="0.28" stroke-width="1.4"/>
      <rect x="78" y="282" width="564" height="58" rx="18" fill="#091725"/>
      ${text("Karpilo LoadIQ", 104, 320, 19, colors.white, "start", 900)}
      ${text(scene.eyebrow, 616, 319, 12, scene.accent, "end", 900, 'letter-spacing="2"')}
      ${content}
    </g>
  `;
}

function dashboard(scene) {
  return screenFrame(
    scene,
    `
    ${metric("EST. NET", "$611", 96, 378, colors.green, "operator estimate")}
    ${metric("TRUE RPM", "$2.14", 286, 378, colors.blue, "all miles")}
    ${metric("RISK", "WATCH", 476, 378, colors.amber, "fuel + time")}
    ${rect(96, 536, 528, 210, "#081624", `stroke="${colors.line}" stroke-width="1"`)}
    ${text("Estimated Analysis", 122, 586, 24, colors.white, "start", 900)}
    ${text("Revenue, cost, and route pressure appear before acceptance.", 122, 632, 16, colors.muted)}
    ${line(122, 682, 586, 682, scene.accent, 'stroke-width="4" stroke-opacity="0.44"')}
    ${line(122, 720, 472, 720, colors.green, 'stroke-width="4" stroke-opacity="0.42"')}
    ${rect(96, 784, 252, 154, "#091725", `stroke="${colors.line}" stroke-width="1"`)}
    ${rect(372, 784, 252, 154, "#091725", `stroke="${colors.line}" stroke-width="1"`)}
    ${text("Calculator Authority", 120, 834, 20)}
    ${text("Atlas Insight", 396, 834, 20)}
    ${text("The math stays deterministic.", 120, 874, 15, colors.muted)}
    ${text("The context stays educational.", 396, 874, 15, colors.muted)}
    `
  );
}

function calculator(scene) {
  const fields = [
    ["Gross Revenue", "$2,350"],
    ["Loaded Miles", "812"],
    ["Deadhead Miles", "147"],
    ["Fuel Cost", "$522"],
    ["Accessorials", "$185"],
    ["Days Committed", "3"],
  ];
  return screenFrame(
    scene,
    `
    ${fields
      .map((field, index) => {
        const x = 96 + (index % 2) * 274;
        const y = 380 + Math.floor(index / 2) * 116;
        return `${rect(x, y, 252, 82, "#091725", `stroke="${index === 0 ? scene.accent : colors.line}" stroke-width="1"`)}
        ${text(field[0], x + 18, y + 30, 14, colors.muted)}
        ${text(field[1], x + 18, y + 62, 25, colors.white, "start", 900)}`;
      })
      .join("\n")}
    ${rect(96, 758, 528, 138, "#081624", `stroke="${scene.accent}" stroke-opacity="0.34" stroke-width="1"`)}
    ${text("Analyze Load", 122, 814, 30, scene.accent, "start", 900)}
    ${text("Run the estimate. Review the pressure. Keep the decision yours.", 122, 858, 17, colors.muted)}
    `
  );
}

function route(scene) {
  return screenFrame(
    scene,
    `
    <path d="M128 822 C206 702 300 742 366 610 C424 494 532 512 588 414" fill="none" stroke="${scene.accent}" stroke-width="12" stroke-linecap="round" stroke-dasharray="38 28" opacity="0.58"/>
    <path d="M128 822 C206 702 300 742 366 610 C424 494 532 512 588 414" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-dasharray="12 14" opacity="0.5"/>
    <circle cx="128" cy="822" r="15" fill="${colors.red}"/>
    <circle cx="588" cy="414" r="15" fill="${colors.green}"/>
    ${metric("LOADED", "812 mi", 96, 378, colors.green)}
    ${metric("DEADHEAD", "147 mi", 286, 378, colors.red)}
    ${metric("TOTAL", "959 mi", 476, 378, colors.blue)}
    ${rect(96, 890, 528, 70, "#091725", `stroke="${colors.red}" stroke-opacity="0.4"`)}
    ${text("True RPM includes the unpaid miles too.", 122, 933, 21, colors.white, "start", 900)}
    `
  );
}

function fuel(scene) {
  return screenFrame(
    scene,
    `
    ${metric("FUEL", "$522", 96, 380, colors.amber)}
    ${metric("MPG", "6.5", 286, 380, colors.blue)}
    ${metric("FSC", "$310", 476, 380, colors.green)}
    ${rect(100, 548, 520, 270, "#081624", `stroke="${colors.line}" stroke-width="1"`)}
    ${text("Fuel Pressure", 128, 604, 27, colors.white, "start", 900)}
    ${text("MPG, fuel price, and FSC shape the estimate.", 128, 648, 18, colors.muted)}
    ${line(128, 716, 570, 716, colors.amber, 'stroke-width="9" stroke-opacity="0.6"')}
    ${line(128, 756, 458, 756, colors.green, 'stroke-width="9" stroke-opacity="0.55"')}
    ${text("Cost exposure", 128, 704, 14, colors.muted)}
    ${text("Recovery signal", 128, 744, 14, colors.muted)}
    ${rect(100, 850, 520, 88, "#091725", `stroke="${scene.accent}" stroke-opacity="0.34"`)}
    ${text("FSC can help recovery. It does not erase inefficient miles.", 128, 904, 18, colors.white)}
    `
  );
}

function actuals(scene) {
  const rows = [
    ["Diesel", "$522"],
    ["DEF", "$42"],
    ["Tolls", "$75"],
    ["Parking", "$28"],
    ["Repairs", "$96"],
  ];
  return screenFrame(
    scene,
    `
    ${text("Post-Trip Actuals", 96, 410, 31, colors.white, "start", 900)}
    ${rows
      .map(
        (row, index) => `
        ${rect(96, 458 + index * 78, 528, 58, "#091725", `stroke="${colors.line}" stroke-width="1"`)}
        ${text(row[0], 122, 494 + index * 78, 19, colors.white, "start", 800)}
        ${text(row[1], 594, 494 + index * 78, 19, index === 0 ? scene.accent : colors.muted, "end", 900)}
      `
      )
      .join("\n")}
    ${rect(96, 874, 528, 80, "#081624", `stroke="${scene.accent}" stroke-opacity="0.38"`)}
    ${text("Estimate vs actual stays visible after the trip.", 122, 924, 20, colors.white, "start", 900)}
    `
  );
}

function history(scene) {
  const rows = [
    ["AUTO-5", "Dallas -> Kansas City", "$2.14 true RPM"],
    ["AUTO-6", "Tulsa -> Denver", "$1.92 true RPM"],
    ["AUTO-7", "Memphis -> Omaha", "$2.31 true RPM"],
  ];
  return screenFrame(
    scene,
    `
    ${text("Saved Load History", 96, 410, 31, colors.white, "start", 900)}
    ${rows
      .map(
        (row, index) => `
        ${rect(96, 472 + index * 118, 528, 88, "#091725", `stroke="${index === 0 ? scene.accent : colors.line}" stroke-width="1"`)}
        ${text(row[0], 122, 506 + index * 118, 16, scene.accent, "start", 900, 'letter-spacing="2"')}
        ${text(row[1], 122, 536 + index * 118, 19, colors.white, "start", 800)}
        ${text(row[2], 594, 536 + index * 118, 17, colors.muted, "end", 800)}
      `
      )
      .join("\n")}
    ${rect(96, 850, 528, 86, "#081624", `stroke="${colors.line}" stroke-width="1"`)}
    ${text("Patterns become easier to see when the work is remembered.", 122, 902, 18, colors.white, "start", 900)}
    `
  );
}

function atlas(scene) {
  return screenFrame(
    scene,
    `
    ${rect(96, 382, 528, 146, "#081624", `stroke="${scene.accent}" stroke-opacity="0.42"`)}
    ${text("Atlas Guidance", 122, 438, 31, scene.accent, "start", 900)}
    ${text("Educational interpretation for fields, outputs, and route context.", 122, 482, 18, colors.muted)}
    ${rect(96, 568, 252, 158, "#091725", `stroke="${colors.blue}" stroke-opacity="0.35"`)}
    ${rect(372, 568, 252, 158, "#091725", `stroke="${colors.green}" stroke-opacity="0.35"`)}
    ${rect(96, 752, 252, 158, "#091725", `stroke="${colors.red}" stroke-opacity="0.35"`)}
    ${rect(372, 752, 252, 158, "#091725", `stroke="${colors.purple}" stroke-opacity="0.35"`)}
    ${text("Educational", 122, 626, 22, colors.blue, "start", 900)}
    ${text("Freight", 398, 626, 22, colors.green, "start", 900)}
    ${text("Route", 122, 810, 22, colors.red, "start", 900)}
    ${text("Core", 398, 810, 22, colors.purple, "start", 900)}
    ${text("Explain the workflow.", 122, 666, 15, colors.muted)}
    ${text("Interpret the estimate.", 398, 666, 15, colors.muted)}
    ${text("Frame movement pressure.", 122, 850, 15, colors.muted)}
    ${text("Passive registry layer.", 398, 850, 15, colors.muted)}
    `
  );
}

function final(scene) {
  return `
    <g filter="url(#shadow)">
      <rect x="54" y="262" width="612" height="720" rx="34" fill="#06101B" stroke="${scene.accent}" stroke-opacity="0.3"/>
      ${text("KARPILO ENDEAVOR TECHNOLOGIES", 360, 382, 20, scene.accent, "middle", 900, 'letter-spacing="5"')}
      ${text("Karpilo LoadIQ", 360, 528, 58, colors.white, "middle", 900)}
      ${text("Transportation profitability estimation", 360, 594, 24, colors.muted, "middle", 700)}
      ${text("for operators.", 360, 630, 24, colors.muted, "middle", 700)}
      <path d="M132 754 C234 684 322 828 430 710 C506 628 568 676 608 592" fill="none" stroke="${scene.accent}" stroke-width="9" stroke-linecap="round" opacity="0.6"/>
      ${text("Know the estimate.", 360, 858, 31, colors.white, "middle", 900)}
      ${text("Keep the decision yours.", 360, 904, 28, colors.muted, "middle", 800)}
    </g>
  `;
}

function sceneContent(scene) {
  switch (scene.kind) {
    case "dashboard":
      return dashboard(scene);
    case "calculator":
      return calculator(scene);
    case "route":
      return route(scene);
    case "fuel":
      return fuel(scene);
    case "actuals":
      return actuals(scene);
    case "history":
      return history(scene);
    case "atlas":
      return atlas(scene);
    case "final":
      return final(scene);
    default:
      return dashboard(scene);
  }
}

function sceneSvg(scene, index) {
  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="50%" cy="28%" r="82%">
      <stop offset="0%" stop-color="${scene.accent}" stop-opacity="0.18"/>
      <stop offset="52%" stop-color="#06101B" stop-opacity="0.34"/>
      <stop offset="100%" stop-color="#020711" stop-opacity="1"/>
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="28" stdDeviation="28" flood-color="#000000" flood-opacity="0.48"/>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="${colors.bg}"/>
  <rect width="${width}" height="${height}" fill="url(#glow)"/>
  <g opacity="0.1">
    ${Array.from({ length: 9 }, (_, i) => line(i * 90, 0, i * 90, height, scene.accent)).join("\n")}
    ${Array.from({ length: 16 }, (_, i) => line(0, i * 90, width, i * 90, scene.accent)).join("\n")}
  </g>
  ${text(scene.eyebrow, 54, 128, 17, scene.accent, "start", 900, 'letter-spacing="4"')}
  ${text(scene.title, 54, 184, scene.title.length > 40 ? 30 : 36, colors.white, "start", 900)}
  ${text(scene.subtitle, 54, 224, 18, colors.muted, "start", 700)}
  ${sceneContent(scene)}
  <rect x="54" y="1094" width="612" height="5" rx="2" fill="#132438"/>
  <rect x="54" y="1094" width="${Math.round(612 * ((index + 1) / scenes.length))}" height="5" rx="2" fill="${scene.accent}"/>
</svg>`;
}

async function renderSceneImages() {
  const paths = [];
  for (let i = 0; i < scenes.length; i += 1) {
    const scenePath = resolve(sceneDir, `scene-${String(i + 1).padStart(2, "0")}.png`);
    await sharp(Buffer.from(sceneSvg(scenes[i], i))).png().toFile(scenePath);
    paths.push(scenePath);
  }
  await sharp(paths[0]).toFile(posterPath);
  return paths;
}

function segmentFilter(index, seconds) {
  const frames = seconds * fps;
  const zoom = index % 2 === 0 ? "1+0.018*on/duration" : "1.018-0.012*on/duration";
  return `[${index}:v]zoompan=d=${frames}:s=${width}x${height}:fps=${fps}:z='${zoom}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',fade=t=in:st=0:d=0.18,fade=t=out:st=${
    seconds - 0.2
  }:d=0.2,setpts=PTS-STARTPTS[v${index}]`;
}

async function renderVideo(paths) {
  const args = ["-y"];
  for (const path of paths) {
    args.push("-i", path);
  }
  args.push("-i", audioPath);

  const segmentFilters = scenes.map((scene, index) => segmentFilter(index, scene.seconds));
  const concatInputs = scenes.map((_, index) => `[v${index}]`).join("");
  const filterComplex = `${segmentFilters.join(";")};${concatInputs}concat=n=${scenes.length}:v=1:a=0,format=yuv420p[v]`;

  args.push(
    "-filter_complex",
    filterComplex,
    "-map",
    "[v]",
    "-map",
    `${paths.length}:a`,
    "-shortest",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "224k",
    "-movflags",
    "+faststart",
    outputPath
  );

  const ff = spawn(ffmpeg, args, {
    cwd: repoRoot,
    stdio: ["ignore", "inherit", "inherit"],
  });

  const [code] = await once(ff, "close");
  if (code !== 0) {
    throw new Error(`ffmpeg exited with code ${code}`);
  }
}

const paths = await renderSceneImages();
await renderVideo(paths);
console.log(`Wrote ${outputPath}`);
