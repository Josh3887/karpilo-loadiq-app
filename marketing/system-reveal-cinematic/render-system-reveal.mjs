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

const outDir = resolve(repoRoot, "marketing/system-reveal-cinematic");
const sceneDir = resolve(outDir, "scene-plates");
const outputPath = resolve(outDir, "karpilo-loadiq-fleetos-atlas-system-reveal.mp4");
const posterPath = resolve(outDir, "karpilo-system-reveal-poster.png");
const audioPath = resolve(outDir, "karpilo-system-reveal-score.wav");

const assets = {
  coreBackdrop: resolve(repoRoot, "public/branding/atlas/backdrops/karpilo-atlas-core-backdrop-vertical-v1.png"),
  freightBackdrop: resolve(repoRoot, "public/branding/atlas/backdrops/karpilo-atlas-freight-backdrop-vertical-v1.png"),
  routeBackdrop: resolve(repoRoot, "public/branding/atlas/backdrops/karpilo-atlas-route-backdrop-vertical-v1.png"),
  educationBackdrop: resolve(repoRoot, "public/branding/atlas/backdrops/karpilo-atlas-educational-backdrop-vertical-v1.png"),
  coreDashboard: resolve(repoRoot, "public/branding/atlas/core/karpilo-atlas-core-dashboard-v1.png"),
  freightDashboard: resolve(repoRoot, "public/branding/atlas/freight/karpilo-atlas-freight-dashboard-v1.png"),
  routeDashboard: resolve(repoRoot, "public/branding/atlas/route/karpilo-atlas-route-dashboard-v1.png"),
  educationDashboard: resolve(repoRoot, "public/branding/atlas/educational/karpilo-atlas-educational-dashboard-v1.png"),
  endeavorLogo: resolve(repoRoot, "public/brand/karpiloendeavortech.jpeg"),
  loadiqIcon: resolve(repoRoot, "public/brand/loadiq-app-icon.png"),
  coreEmblem: resolve(repoRoot, "public/branding/atlas/core/karpilo-atlas-core-emblem.png"),
  freightEmblem: resolve(repoRoot, "public/branding/atlas/freight/karpilo-atlas-freight-emblem.png"),
  routeEmblem: resolve(repoRoot, "public/branding/atlas/route/karpilo-atlas-route-emblem.png"),
  educationEmblem: resolve(repoRoot, "public/branding/atlas/educational/karpilo-atlas-educational-emblem.png"),
};

if (!existsSync(ffmpeg)) {
  throw new Error(`ffmpeg binary not found at ${ffmpeg}`);
}

if (!existsSync(audioPath)) {
  throw new Error(`Audio missing at ${audioPath}. Run compose-system-reveal-score.mjs first.`);
}

for (const [name, path] of Object.entries(assets)) {
  if (!existsSync(path)) {
    throw new Error(`Atlas asset missing: ${name} at ${path}`);
  }
}

mkdirSync(sceneDir, { recursive: true });

const colors = {
  bg: "#020711",
  panel: "#07111D",
  glass: "#091725",
  blue: "#35C8FF",
  red: "#FF355B",
  green: "#39F58A",
  purple: "#AF73FF",
  amber: "#FFB84A",
  white: "#EAF8FF",
  muted: "#91A8BA",
  steel: "#D9E6F2",
};

const shots = [
  {
    seconds: 6,
    mode: "darkness",
    accent: colors.blue,
    backdrop: assets.coreBackdrop,
    emblem: assets.coreEmblem,
    micro: ["Next.js App Router", "Supabase RLS", "saved_loads.result_snapshot", "calculator-engine.ts"],
    title: ["THE SYSTEM", "WAKES"],
    subtitle: "Telemetry systems online",
  },
  {
    seconds: 6,
    mode: "activation",
    accent: colors.blue,
    backdrop: assets.coreBackdrop,
    dashboard: assets.coreDashboard,
    title: ["LOADIQ", "RUNTIME"],
    subtitle: "AppShell. Command rail. Calculator authority.",
    micro: ["src/app/(dashboard)/dashboard/layout.tsx", "AtlasEducationalContextRail", "results-panel.tsx"],
  },
  {
    seconds: 6,
    mode: "route",
    accent: colors.red,
    backdrop: assets.routeBackdrop,
    dashboard: assets.routeDashboard,
    emblem: assets.routeEmblem,
    title: ["ROUTE", "SYNCHRONIZATION"],
    subtitle: "Deadhead exposure. Corridor pressure. Movement context.",
    micro: ["route-intelligence.ts", "saved_load_stops", "deadheadStart -> deadheadEnd"],
  },
  {
    seconds: 6,
    mode: "freight",
    accent: colors.green,
    backdrop: assets.freightBackdrop,
    dashboard: assets.freightDashboard,
    emblem: assets.freightEmblem,
    title: ["FREIGHT", "INTELLIGENCE"],
    subtitle: "Margin pressure. Fuel exposure. True RPM.",
    micro: ["trueRpm = grossRevenue / totalTripMiles", "FSC-protected pay basis", "postTripActualExpenses.amount"],
  },
  {
    seconds: 6,
    mode: "education",
    accent: colors.blue,
    backdrop: assets.educationBackdrop,
    dashboard: assets.educationDashboard,
    emblem: assets.educationEmblem,
    title: ["ATLAS", "GUIDANCE"],
    subtitle: "Educational context embedded into the workflow.",
    micro: ["data-atlas-edu", "LearnMore registry", "no formula mutation"],
  },
  {
    seconds: 6,
    mode: "fleetos",
    accent: colors.purple,
    backdrop: assets.coreBackdrop,
    dashboard: assets.coreDashboard,
    title: ["FLEETOS", "STRUCTURE"],
    subtitle: "Future fleet-capable architecture. Current access isolated.",
    micro: ["subscription_tier = pro // reserved", "fleet_enabled = false", "fleetos_pro_access = false"],
  },
  {
    seconds: 7,
    mode: "nation",
    accent: colors.green,
    backdrop: assets.freightBackdrop,
    title: ["FREIGHT IS", "BECOMING TELEMETRY"],
    subtitle: "Every route, cost, delay, and assumption leaves a signal.",
    micro: ["event ledgers", "route model version", "operator profitability logic"],
  },
  {
    seconds: 5,
    mode: "final",
    accent: colors.blue,
    backdrop: assets.coreBackdrop,
    endeavorLogo: assets.endeavorLogo,
    identityIcons: [assets.loadiqIcon, assets.coreEmblem, assets.freightEmblem, assets.routeEmblem, assets.educationEmblem],
    title: ["KARPILO", "SYSTEMS"],
    subtitle: "We build the paths we don't yet understand.",
    micro: ["Karpilo LoadIQ", "Karpilo FleetOS", "Karpilo Atlas (K-ATLS)"],
  },
];

function xml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function text(value, x, y, size, fill = colors.white, anchor = "start", weight = 900, attrs = "") {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" ${attrs}>${xml(
    value
  )}</text>`;
}

function rect(x, y, w, h, fill, attrs = "") {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${fill}" ${attrs}/>`;
}

function line(x1, y1, x2, y2, stroke, attrs = "") {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" ${attrs}/>`;
}

function safeTitle(lines, accent) {
  if (lines.length === 1) {
    return text(lines[0], 360, 588, 58, colors.white, "middle", 900);
  }

  const size = lines.some((entry) => entry.length > 14) ? 46 : 58;
  return lines
    .map((entry, index) =>
      text(entry, 360, 544 + index * (size + 10), size, index === 1 ? accent : colors.white, "middle", 900)
    )
    .join("\n");
}

function microRows(shot, y = 180) {
  return shot.micro
    .slice(0, 4)
    .map((entry, index) =>
      text(
        entry,
        64,
        y + index * 31,
        15,
        index === 1 ? shot.accent : colors.muted,
        "start",
        800,
        'letter-spacing="1" opacity="0.78"'
      )
    )
    .join("\n");
}

function hudFrame(shot) {
  const leftLabel = shot.mode === "final" ? "SYSTEM REVEAL" : "KARPILO // K-ATLS";
  const rightLabel = shot.mode === "final" ? "FINAL SIGNAL" : "SYSTEM REVEAL";

  return `
    <rect x="44" y="54" width="632" height="1172" rx="28" fill="none" stroke="${shot.accent}" stroke-opacity="0.28" stroke-width="1.4"/>
    <rect x="64" y="84" width="592" height="54" rx="12" fill="#030A14" opacity="0.74" stroke="${shot.accent}" stroke-opacity="0.26"/>
    ${text(leftLabel, 86, 118, 16, colors.steel, "start", 900, 'letter-spacing="3"')}
    ${text(rightLabel, 632, 118, 13, shot.accent, "end", 900, 'letter-spacing="3"')}
  `;
}

function routeVector(shot) {
  return `
    <g filter="url(#glow)">
      <path d="M116 958 C194 806 316 846 392 690 C464 548 558 572 610 420" fill="none" stroke="${shot.accent}" stroke-width="9" stroke-linecap="round" stroke-dasharray="46 28" opacity="0.58"/>
      <path d="M116 958 C194 806 316 846 392 690 C464 548 558 572 610 420" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="13 14" opacity="0.42"/>
      <circle cx="116" cy="958" r="14" fill="${colors.red}"/>
      <circle cx="610" cy="420" r="14" fill="${colors.green}"/>
    </g>
  `;
}

function orbitNodes(shot) {
  const nodes = [
    ["LOADIQ", 166, 906],
    ["ROUTE", 288, 790],
    ["FREIGHT", 432, 860],
    ["ATLAS", 552, 738],
    ["SUPABASE", 366, 1018],
  ];
  const connections = [
    [0, 1],
    [1, 3],
    [0, 2],
    [2, 3],
    [4, 0],
    [4, 3],
  ];
  return `
    <g>
      ${connections
        .map(([a, b], index) =>
          line(nodes[a][1], nodes[a][2], nodes[b][1], nodes[b][2], index % 2 ? shot.accent : colors.blue, 'stroke-width="1.6" stroke-opacity="0.36"')
        )
        .join("\n")}
      ${nodes
        .map(([label, x, y], index) => `
          <circle cx="${x}" cy="${y}" r="${index === 3 ? 32 : 24}" fill="#030A14" stroke="${index === 3 ? shot.accent : colors.blue}" stroke-opacity="0.68"/>
          ${text(label, x, y + 5, index === 3 ? 13 : 11, colors.white, "middle", 900, 'letter-spacing="1"')}
        `)
        .join("\n")}
    </g>
  `;
}

function metrics(shot) {
  const items = [
    ["TRUE RPM", "$2.14", colors.blue],
    ["DEADHEAD", "147 mi", colors.red],
    ["FUEL", "$522", colors.amber],
  ];
  return items
    .map(([label, value, color], index) => {
      const x = 82 + index * 190;
      return `
        ${rect(x, 768, 166, 112, "#06101B", `stroke="${color}" stroke-opacity="0.32"`)}
        ${text(label, x + 18, 806, 13, colors.muted, "start", 900, 'letter-spacing="2"')}
        ${text(value, x + 18, 850, 26, color, "start", 900)}
      `;
    })
    .join("\n");
}

function sceneOverlay(shot, index) {
  if (shot.mode === "darkness") {
    return `
      ${microRows(shot, 210)}
      <circle cx="360" cy="704" r="142" fill="none" stroke="${shot.accent}" stroke-opacity="0.28" stroke-width="2"/>
      <circle cx="360" cy="704" r="78" fill="none" stroke="${colors.red}" stroke-opacity="0.34" stroke-width="2"/>
      ${safeTitle(shot.title, shot.accent)}
      ${text(shot.subtitle, 360, 682, 24, colors.muted, "middle", 700)}
    `;
  }

  if (shot.mode === "activation") {
    return `
      ${microRows(shot, 170)}
      <rect x="96" y="330" width="528" height="316" rx="24" fill="#030A14" opacity="0.78" stroke="${shot.accent}" stroke-opacity="0.28"/>
      ${text("AppShell", 126, 386, 26, colors.white)}
      ${text("CommandRail", 126, 436, 22, shot.accent)}
      ${text("TelemetryHistoryPanel", 126, 486, 22, colors.muted)}
      ${text("AtlasEducationalContextRail", 126, 536, 22, colors.muted)}
      ${orbitNodes(shot)}
    `;
  }

  if (shot.mode === "route") {
    return `
      ${safeTitle(shot.title, shot.accent)}
      ${text(shot.subtitle, 360, 694, 21, colors.muted, "middle", 700)}
      ${routeVector(shot)}
      ${microRows(shot, 176)}
    `;
  }

  if (shot.mode === "freight") {
    return `
      ${safeTitle(shot.title, shot.accent)}
      ${text(shot.subtitle, 360, 694, 22, colors.muted, "middle", 700)}
      ${metrics(shot)}
      ${microRows(shot, 178)}
    `;
  }

  if (shot.mode === "education") {
    return `
      ${safeTitle(shot.title, shot.accent)}
      ${text(shot.subtitle, 360, 692, 21, colors.muted, "middle", 700)}
      ${rect(96, 772, 528, 164, "#06101B", `stroke="${shot.accent}" stroke-opacity="0.32"`)}
      ${text("Field meaning. Operational context.", 126, 830, 24, colors.white)}
      ${text("No formula mutation.", 126, 880, 20, colors.muted)}
      ${microRows(shot, 178)}
    `;
  }

  if (shot.mode === "fleetos") {
    return `
      ${safeTitle(shot.title, shot.accent)}
      ${text(shot.subtitle, 360, 690, 20, colors.muted, "middle", 700)}
      ${rect(112, 778, 496, 152, "#06101B", `stroke="${shot.accent}" stroke-opacity="0.34"`)}
      ${text("Pro reserved. Access isolated.", 360, 836, 25, colors.white, "middle")}
      ${text("Boundaries preserved.", 360, 884, 18, colors.muted, "middle")}
      ${microRows(shot, 180)}
    `;
  }

  if (shot.mode === "nation") {
    return `
      ${safeTitle(shot.title, shot.accent)}
      ${text(shot.subtitle, 360, 710, 22, colors.muted, "middle", 700)}
      ${routeVector(shot)}
      ${orbitNodes(shot)}
      ${microRows(shot, 176)}
    `;
  }

  return `
    <circle cx="360" cy="430" r="116" fill="none" stroke="${shot.accent}" stroke-opacity="0.24"/>
    <circle cx="360" cy="430" r="72" fill="none" stroke="${colors.blue}" stroke-opacity="0.14"/>
    <path d="M282 430 H216 M438 430 H504 M360 352 V296 M360 508 V564" stroke="${shot.accent}" stroke-opacity="0.2" stroke-width="2"/>
    ${text("SYSTEMS ONLINE", 360, 540, 52, colors.white, "middle", 900, 'letter-spacing="2"')}
    ${text("Karpilo LoadIQ", 360, 792, 31, colors.white, "middle")}
    ${text("Karpilo FleetOS", 360, 842, 31, colors.white, "middle")}
    ${text("Karpilo Atlas (K-ATLS)", 360, 892, 31, colors.white, "middle")}
    ${text("We build the paths", 360, 1010, 32, colors.white, "middle")}
    ${text("we don't yet understand.", 360, 1058, 27, colors.muted, "middle", 800)}
  `;
}

function sceneSvg(shot, index) {
  const progress = Math.round(592 * ((index + 1) / shots.length));
  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="topGlow" cx="50%" cy="36%" r="72%">
      <stop offset="0%" stop-color="${shot.accent}" stop-opacity="0.22"/>
      <stop offset="52%" stop-color="#06101B" stop-opacity="0.26"/>
      <stop offset="100%" stop-color="#020711" stop-opacity="0.94"/>
    </radialGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="28" stdDeviation="34" flood-color="#000000" flood-opacity="0.48"/>
    </filter>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="${colors.bg}"/>
  <rect width="${width}" height="${height}" fill="url(#topGlow)"/>
  <g opacity="0.11">
    ${Array.from({ length: 9 }, (_, i) => line(i * 90, 0, i * 90, height, shot.accent)).join("\n")}
    ${Array.from({ length: 15 }, (_, i) => line(0, 96 + i * 82, width, 96 + i * 82, shot.accent)).join("\n")}
  </g>
  ${hudFrame(shot)}
  ${sceneOverlay(shot, index)}
  <rect x="64" y="1170" width="592" height="5" rx="2.5" fill="#132438"/>
  <rect x="64" y="1170" width="${progress}" height="5" rx="2.5" fill="${shot.accent}"/>
</svg>`;
}

async function cover(path, options = {}) {
  return sharp(path)
    .resize(width, height, { fit: "cover" })
    .modulate({ brightness: options.brightness ?? 0.64, saturation: options.saturation ?? 1.08 })
    .blur(options.blur ?? 1.4)
    .png()
    .toBuffer();
}

async function contain(path, boxWidth, boxHeight) {
  return sharp(path)
    .resize(boxWidth, boxHeight, { fit: "contain", withoutEnlargement: true })
    .png()
    .toBuffer();
}

async function lightBackgroundToAlpha(path, boxWidth, boxHeight) {
  const { data, info } = await sharp(path)
    .trim({ background: "#ffffff", threshold: 34 })
    .resize(boxWidth, boxHeight, { fit: "contain", withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let offset = 0; offset < data.length; offset += 4) {
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const brightNeutral = red > 220 && green > 220 && blue > 220 && Math.max(red, green, blue) - Math.min(red, green, blue) < 28;
    const nearWhite = red > 238 && green > 238 && blue > 238;
    if (brightNeutral || nearWhite) {
      data[offset + 3] = 0;
    }
  }

  return sharp(data, { raw: info }).png().toBuffer();
}

async function endeavorLogoToAlpha(path, boxWidth, boxHeight) {
  const metadata = await sharp(path).metadata();
  const sourceWidth = metadata.width ?? 1536;
  const sourceHeight = metadata.height ?? 1024;
  const crop = {
    left: Math.round(sourceWidth * 0.035),
    top: Math.round(sourceHeight * 0.32),
    width: Math.round(sourceWidth * 0.93),
    height: Math.round(sourceHeight * 0.34),
  };

  const { data, info } = await sharp(path)
    .extract(crop)
    .resize(boxWidth, boxHeight, { fit: "contain", withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let offset = 0; offset < data.length; offset += 4) {
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const brightNeutral = red > 214 && green > 214 && blue > 214 && Math.max(red, green, blue) - Math.min(red, green, blue) < 34;
    const nearWhite = red > 236 && green > 236 && blue > 236;
    if (brightNeutral || nearWhite) {
      data[offset + 3] = 0;
    }
  }

  return sharp(data, { raw: info }).png().toBuffer();
}

async function makePlate(shot, index) {
  const background = await cover(shot.backdrop, {
    brightness: shot.mode === "darkness" ? 0.38 : 0.58,
    saturation: 1.14,
    blur: shot.mode === "darkness" ? 2.8 : 1.2,
  });

  const composites = [
    {
      input: Buffer.from(sceneSvg(shot, index)),
      top: 0,
      left: 0,
    },
  ];

  if (shot.dashboard && !["activation", "fleetos"].includes(shot.mode)) {
    const dashboard = await contain(shot.dashboard, 600, 480);
    composites.unshift({
      input: dashboard,
      top: 342,
      left: 60,
      blend: "screen",
    });
  }

  if (shot.emblem && ["route", "freight", "education"].includes(shot.mode)) {
    const emblem = await contain(shot.emblem, shot.mode === "final" ? 170 : 120, shot.mode === "final" ? 170 : 120);
    composites.unshift({
      input: emblem,
      top: shot.mode === "final" ? 298 : 338,
      left: shot.mode === "final" ? 275 : 510,
      blend: "screen",
    });
  }

  if (shot.endeavorLogo) {
    const logo = await endeavorLogoToAlpha(shot.endeavorLogo, 560, 136);
    composites.push({
      input: logo,
      top: 238,
      left: 80,
    });
  }

  if (shot.identityIcons) {
    const iconSize = 82;
    const gap = 20;
    const totalWidth = shot.identityIcons.length * iconSize + (shot.identityIcons.length - 1) * gap;
    const leftStart = Math.round((width - totalWidth) / 2);
    for (const [iconIndex, iconPath] of shot.identityIcons.entries()) {
      const icon = await contain(iconPath, iconSize, iconSize);
      composites.push({
        input: icon,
        top: 642,
        left: leftStart + iconIndex * (iconSize + gap),
        blend: iconIndex === 0 ? "over" : "screen",
      });
    }
  }

  return sharp(background).composite(composites).png();
}

async function renderPlates() {
  const paths = [];
  for (let index = 0; index < shots.length; index += 1) {
    const platePath = resolve(sceneDir, `shot-${String(index + 1).padStart(2, "0")}.png`);
    const plate = await makePlate(shots[index], index);
    await plate.toFile(platePath);
    paths.push(platePath);
  }
  await sharp(paths[0]).toFile(posterPath);
  return paths;
}

function segmentFilter(index, seconds) {
  const frames = seconds * fps;
  const zoom = index % 2 === 0 ? "1+0.024*on/duration" : "1.024-0.014*on/duration";
  const x = index % 3 === 0 ? "iw/2-(iw/zoom/2)+sin(on/95)*10" : "iw/2-(iw/zoom/2)";
  const y = index % 3 === 1 ? "ih/2-(ih/zoom/2)+cos(on/110)*12" : "ih/2-(ih/zoom/2)";
  return `[${index}:v]zoompan=d=${frames}:s=${width}x${height}:fps=${fps}:z='${zoom}':x='${x}':y='${y}',fade=t=in:st=0:d=0.24,fade=t=out:st=${
    seconds - 0.28
  }:d=0.28,setpts=PTS-STARTPTS[v${index}]`;
}

async function renderVideo(paths) {
  const args = ["-y"];
  for (const path of paths) {
    args.push("-i", path);
  }
  args.push("-i", audioPath);

  const segmentFilters = shots.map((shot, index) => segmentFilter(index, shot.seconds));
  const concatInputs = shots.map((_, index) => `[v${index}]`).join("");
  const filterComplex = `${segmentFilters.join(";")};${concatInputs}concat=n=${shots.length}:v=1:a=0,format=yuv420p[v]`;

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

const paths = await renderPlates();
await renderVideo(paths);
console.log(`Wrote ${outputPath}`);
