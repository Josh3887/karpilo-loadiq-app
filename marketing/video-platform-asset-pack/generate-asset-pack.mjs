import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import sharp from "sharp";

const repoRoot = resolve(new URL("../..", import.meta.url).pathname);
const outDir = resolve(repoRoot, "marketing/video-platform-asset-pack");
const verticalDir = resolve(outDir, "snapshots/vertical-9x16");
const wideDir = resolve(outDir, "snapshots/wide-16x9");
const brandDir = resolve(outDir, "brand-assets");
const dataDir = resolve(outDir, "data");

const colors = {
  bg: "#020712",
  panel: "#071320",
  panel2: "#0A1A2A",
  line: "#17405B",
  blue: "#39C7FF",
  red: "#FF355B",
  green: "#39F58A",
  purple: "#B67CFF",
  amber: "#FFB84A",
  white: "#F0F8FF",
  muted: "#9BAFC0",
  dim: "#60788A",
};

const assets = {
  endeavor: resolve(repoRoot, "public/brand/karpiloendeavortech.jpeg"),
  loadiq: resolve(repoRoot, "public/brand/loadiq-app-icon.png"),
  core: resolve(repoRoot, "public/branding/atlas/core/karpilo-atlas-core-emblem.png"),
  freight: resolve(repoRoot, "public/branding/atlas/freight/karpilo-atlas-freight-emblem.png"),
  route: resolve(repoRoot, "public/branding/atlas/route/karpilo-atlas-route-emblem.png"),
  educational: resolve(repoRoot, "public/branding/atlas/educational/karpilo-atlas-educational-emblem.png"),
  coreBackdrop: resolve(repoRoot, "public/branding/atlas/backdrops/karpilo-atlas-core-backdrop-vertical-v1.png"),
  freightBackdrop: resolve(repoRoot, "public/branding/atlas/backdrops/karpilo-atlas-freight-backdrop-vertical-v1.png"),
  routeBackdrop: resolve(repoRoot, "public/branding/atlas/backdrops/karpilo-atlas-route-backdrop-vertical-v1.png"),
  educationalBackdrop: resolve(repoRoot, "public/branding/atlas/backdrops/karpilo-atlas-educational-backdrop-vertical-v1.png"),
};

for (const [name, file] of Object.entries(assets)) {
  if (!existsSync(file)) {
    throw new Error(`Missing asset ${name}: ${file}`);
  }
}

const frames = [
  {
    id: "01-brand-system",
    kind: "brand",
    accent: colors.blue,
    icon: assets.loadiq,
    backdrop: assets.coreBackdrop,
    eyebrow: "KARPILO LOADIQ",
    title: ["Transportation", "Profitability Estimation"],
    subtitle: "A calculator-first operating view for owner-operators.",
    stats: [
      ["CORE", "Load calculator"],
      ["SUPPORT", "Atlas guidance"],
      ["OUTPUT", "Estimated insight"],
    ],
    bullets: ["Built for user-supplied freight assumptions.", "Designed to keep cost, miles, and margin visible."],
  },
  {
    id: "02-calculator-inputs",
    kind: "calculator",
    accent: colors.blue,
    icon: assets.loadiq,
    backdrop: assets.coreBackdrop,
    eyebrow: "LOAD ANALYSIS",
    title: ["Enter The Load", "See The Pressure"],
    subtitle: "Revenue, miles, fuel, FSC, overhead, and reserve assumptions in one workflow.",
    stats: [
      ["Gross", "$2,350"],
      ["Loaded", "812 mi"],
      ["Deadhead", "147 mi"],
    ],
    bullets: ["Manual inputs remain the calculator authority.", "Route and timing context stay attached to the load."],
  },
  {
    id: "03-true-rpm-results",
    kind: "results",
    accent: colors.green,
    icon: assets.freight,
    backdrop: assets.freightBackdrop,
    eyebrow: "ESTIMATED RESULT",
    title: ["True RPM", "After Deadhead"],
    subtitle: "Loaded RPM alone can hide unpaid movement. True RPM keeps total trip miles visible.",
    stats: [
      ["True RPM", "$2.14"],
      ["Net", "$611"],
      ["Score", "78"],
    ],
    bullets: ["All values are estimates from entered assumptions.", "Profitability is interpreted, not guaranteed."],
  },
  {
    id: "04-deadhead-route",
    kind: "route",
    accent: colors.red,
    icon: assets.route,
    backdrop: assets.routeBackdrop,
    eyebrow: "ATLAS ROUTE CONTEXT",
    title: ["Deadhead Changes", "The Whole Load"],
    subtitle: "Route intelligence frames movement pressure, stop complexity, and distance imbalance.",
    stats: [
      ["Origin", "147 mi"],
      ["Stops", "2"],
      ["Window", "2.5 days"],
    ],
    bullets: ["Deadhead is unpaid operating distance.", "Pickup-to-delivery timing shapes earning capacity."],
  },
  {
    id: "05-fuel-fsc",
    kind: "fuel",
    accent: colors.amber,
    icon: assets.freight,
    backdrop: assets.freightBackdrop,
    eyebrow: "FUEL PRESSURE",
    title: ["Fuel Cost", "Meets FSC Recovery"],
    subtitle: "Fuel surcharge improves recovery, but it does not erase inefficient miles or bad assumptions.",
    stats: [
      ["Fuel", "$522"],
      ["MPG", "6.5"],
      ["FSC", "tracked"],
    ],
    bullets: ["MPG, speed, weight, idle time, and terrain affect real-world outcomes.", "Use actual receipts later to compare estimate vs. trip reality."],
  },
  {
    id: "06-post-trip-actuals",
    kind: "actuals",
    accent: colors.green,
    icon: assets.freight,
    backdrop: assets.freightBackdrop,
    eyebrow: "POST-TRIP ACTUALS",
    title: ["Estimate First", "Actuals After"],
    subtitle: "Capture diesel, DEF, tolls, parking, scale tickets, repairs, hotel, and miscellaneous trip costs.",
    stats: [
      ["Diesel", "PPG x gal"],
      ["DEF", "PPG x gal"],
      ["Flat", "direct cost"],
    ],
    bullets: ["Actual result stays separate from estimated analysis.", "Trip expenses explain margin movement after the load is done."],
  },
  {
    id: "07-load-history",
    kind: "history",
    accent: colors.blue,
    icon: assets.loadiq,
    backdrop: assets.coreBackdrop,
    eyebrow: "LOAD HISTORY",
    title: ["Save The Snapshot", "Review The Pattern"],
    subtitle: "Saved loads preserve entered assumptions, calculated outputs, and later actuals for review.",
    stats: [
      ["Loads", "history"],
      ["Reports", "review"],
      ["Patterns", "visible"],
    ],
    bullets: ["History supports operational awareness over time.", "Saved records do not change the original calculator authority."],
  },
  {
    id: "08-operational-profile",
    kind: "profile",
    accent: colors.purple,
    icon: assets.core,
    backdrop: assets.coreBackdrop,
    eyebrow: "OPERATIONAL PROFILE",
    title: ["Know Your Cost", "Before The Load"],
    subtitle: "Vehicle, overhead, reserve, and target RPM settings help keep the calculator grounded.",
    stats: [
      ["Overhead", "profiled"],
      ["Reserve", "CPM / %"],
      ["Target", "True RPM"],
    ],
    bullets: ["Profile values are assumptions the operator controls.", "Better inputs make estimates more useful."],
  },
  {
    id: "09-atlas-educational",
    kind: "atlas",
    accent: colors.blue,
    icon: assets.educational,
    backdrop: assets.educationalBackdrop,
    eyebrow: "ATLAS EDUCATIONAL SUPPORT",
    title: ["Understand", "What The Fields Mean"],
    subtitle: "Contextual guidance explains inputs, outputs, and operational meaning without changing formulas.",
    stats: [
      ["Inputs", "explained"],
      ["Outputs", "context"],
      ["Tokens", "optional"],
    ],
    bullets: ["Atlas support is educational and informational.", "The deterministic LoadIQ calculator remains the source of truth."],
  },
  {
    id: "10-atlas-freight-route",
    kind: "atlas",
    accent: colors.green,
    icon: assets.freight,
    backdrop: assets.freightBackdrop,
    secondaryIcon: assets.route,
    eyebrow: "ATLAS INSIGHTS",
    title: ["Freight Economics", "Route Context"],
    subtitle: "Atlas Freight and Route views interpret calculated outputs after the load result exists.",
    stats: [
      ["Margin", "pressure"],
      ["Route", "imbalance"],
      ["Risk", "signals"],
    ],
    bullets: ["Atlas does not dispatch, route, or guarantee outcomes.", "It helps explain what the entered numbers suggest."],
  },
  {
    id: "11-mobile-ready",
    kind: "mobile",
    accent: colors.red,
    icon: assets.loadiq,
    backdrop: assets.routeBackdrop,
    eyebrow: "MOBILE-READY WORKFLOW",
    title: ["Built For", "The Road"],
    subtitle: "Fast estimate review, compact result cards, and saved-load access from the operating rhythm.",
    stats: [
      ["Form", "mobile"],
      ["Results", "compact"],
      ["Review", "on hand"],
    ],
    bullets: ["Designed for practical field use.", "Still an estimation platform, not operational control software."],
  },
  {
    id: "12-final-brand",
    kind: "final",
    accent: colors.blue,
    icon: assets.loadiq,
    backdrop: assets.coreBackdrop,
    eyebrow: "KARPILO ENDEAVOR TECHNOLOGIES",
    title: ["Built On The Road", "One Mile At A Time"],
    subtitle: "Karpilo LoadIQ with Karpilo Atlas AI educational and analytical support.",
    stats: [
      ["LoadIQ", "calculator"],
      ["Atlas", "support"],
      ["FleetOS", "future"],
    ],
    bullets: ["Transportation profitability estimation.", "Operational awareness without replacing operator judgment."],
  },
];

function resetDir(path) {
  rmSync(path, { recursive: true, force: true });
  mkdirSync(path, { recursive: true });
}

function xml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function text(value, x, y, size, fill = colors.white, anchor = "start", weight = 800, attrs = "") {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" ${attrs}>${xml(value)}</text>`;
}

function multiline(lines, x, y, size, fill, anchor = "start", weight = 900, gap = 1.08, accent) {
  return lines
    .map((line, index) => text(line, x, y + index * size * gap, size, index === 1 && accent ? accent : fill, anchor, weight))
    .join("\n");
}

function rect(x, y, w, h, fill, attrs = "") {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="24" fill="${fill}" ${attrs}/>`;
}

function line(x1, y1, x2, y2, stroke, attrs = "") {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" ${attrs}/>`;
}

function wrapText(value, maxChars) {
  const words = String(value).split(/\s+/);
  const lines = [];
  let lineValue = "";
  for (const word of words) {
    const next = lineValue ? `${lineValue} ${word}` : word;
    if (next.length > maxChars && lineValue) {
      lines.push(lineValue);
      lineValue = word;
    } else {
      lineValue = next;
    }
  }
  if (lineValue) lines.push(lineValue);
  return lines;
}

function routeGraphic(frame, width, height) {
  const yOffset = height > width ? 0 : -130;
  return `
    <g filter="url(#glow)" opacity="0.9">
      <path d="M${width * 0.16} ${height * 0.78 + yOffset} C${width * 0.30} ${height * 0.62 + yOffset} ${width * 0.44} ${height * 0.70 + yOffset} ${width * 0.55} ${height * 0.52 + yOffset} C${width * 0.68} ${height * 0.31 + yOffset} ${width * 0.79} ${height * 0.42 + yOffset} ${width * 0.88} ${height * 0.22 + yOffset}" fill="none" stroke="${frame.accent}" stroke-width="9" stroke-linecap="round" stroke-dasharray="44 26" opacity="0.6"/>
      <path d="M${width * 0.16} ${height * 0.78 + yOffset} C${width * 0.30} ${height * 0.62 + yOffset} ${width * 0.44} ${height * 0.70 + yOffset} ${width * 0.55} ${height * 0.52 + yOffset} C${width * 0.68} ${height * 0.31 + yOffset} ${width * 0.79} ${height * 0.42 + yOffset} ${width * 0.88} ${height * 0.22 + yOffset}" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="12 14" opacity="0.38"/>
      <circle cx="${width * 0.16}" cy="${height * 0.78 + yOffset}" r="13" fill="${colors.red}"/>
      <circle cx="${width * 0.88}" cy="${height * 0.22 + yOffset}" r="13" fill="${colors.green}"/>
    </g>
  `;
}

function statsSvg(frame, layout) {
  const { width, height, isWide } = layout;
  const cardWidth = isWide ? 280 : 285;
  const gap = isWide ? 26 : 24;
  const totalWidth = frame.stats.length * cardWidth + (frame.stats.length - 1) * gap;
  const xStart = (width - totalWidth) / 2;
  const y = isWide ? height * 0.59 : 1060;

  return frame.stats
    .map(([label, value], index) => {
      const x = xStart + index * (cardWidth + gap);
      return `
        ${rect(x, y, cardWidth, isWide ? 116 : 126, "#06101B", `stroke="${frame.accent}" stroke-opacity="0.35"`)}
        ${text(label, x + 24, y + 43, isWide ? 20 : 22, colors.muted, "start", 900, 'letter-spacing="2"')}
        ${text(value, x + 24, y + (isWide ? 82 : 92), isWide ? 27 : 31, frame.accent, "start", 900)}
      `;
    })
    .join("\n");
}

function bulletsSvg(frame, layout) {
  const { width, height, isWide } = layout;
  const x = isWide ? width * 0.58 : 90;
  const y = isWide ? height * 0.35 : 1290;
  const maxChars = isWide ? 44 : 46;
  return frame.bullets
    .flatMap((bullet, index) => {
      const lines = wrapText(bullet, maxChars);
      const top = y + index * (isWide ? 118 : 126);
      return [
        `<circle cx="${x}" cy="${top - 10}" r="5" fill="${frame.accent}"/>`,
        ...lines.map((lineValue, lineIndex) =>
          text(lineValue, x + 24, top + lineIndex * (isWide ? 28 : 31), isWide ? 24 : 27, lineIndex === 0 ? colors.white : colors.muted, "start", 750)
        ),
      ];
    })
    .join("\n");
}

function dashboardMock(frame, layout) {
  const { width, height, isWide } = layout;
  const x = isWide ? width * 0.09 : 80;
  const y = isWide ? height * 0.31 : 735;
  const w = isWide ? width * 0.39 : width - 160;
  const h = isWide ? height * 0.33 : 270;
  const rows = frame.kind === "route" ? ["Deadhead origin", "Pickup window", "Delivery flow"] : frame.kind === "fuel" ? ["Fuel price", "MPG assumption", "FSC recovery"] : ["Gross revenue", "Loaded miles", "Deadhead miles"];
  return `
    ${rect(x, y, w, h, "#06101B", `stroke="${frame.accent}" stroke-opacity="0.28"`)}
    ${text("LOADIQ SNAPSHOT", x + 32, y + 50, isWide ? 20 : 23, frame.accent, "start", 900, 'letter-spacing="2"')}
    ${rows
      .map((row, index) => {
        const rowY = y + 92 + index * (isWide ? 54 : 58);
        return `
          ${line(x + 32, rowY + 18, x + w - 32, rowY + 18, colors.line, 'stroke-width="1" stroke-opacity="0.7"')}
          ${text(row, x + 32, rowY, isWide ? 24 : 27, colors.white, "start", 750)}
          ${text(index === 0 ? "entered" : index === 1 ? "estimated" : "visible", x + w - 32, rowY, isWide ? 20 : 23, colors.muted, "end", 700)}
        `;
      })
      .join("\n")}
  `;
}

function footer(layout) {
  const { width, height, isWide } = layout;
  return `
    ${line(isWide ? 70 : 80, height - 86, width - (isWide ? 70 : 80), height - 86, colors.blue, 'stroke-width="4" stroke-opacity="0.78" stroke-linecap="round"')}
    ${text("Informational estimates based on user-supplied inputs.", width / 2, height - 45, isWide ? 18 : 22, colors.dim, "middle", 700)}
  `;
}

function sceneSvg(frame, layout) {
  const { width, height, isWide } = layout;
  const titleX = isWide ? width * 0.09 : width / 2;
  const titleY = isWide ? height * 0.22 : 445;
  const titleAnchor = isWide ? "start" : "middle";
  const titleSize = isWide ? 66 : 72;
  const subtitleLines = wrapText(frame.subtitle, isWide ? 52 : 42);
  const subtitleX = isWide ? width * 0.09 : width / 2;
  const subtitleY = titleY + (isWide ? 160 : 180);
  const subtitleAnchor = isWide ? "start" : "middle";

  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow-bg" cx="${isWide ? "25%" : "50%"}" cy="28%" r="76%">
      <stop offset="0%" stop-color="${frame.accent}" stop-opacity="0.23"/>
      <stop offset="54%" stop-color="#06101B" stop-opacity="0.34"/>
      <stop offset="100%" stop-color="#020712" stop-opacity="0.96"/>
    </radialGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="${colors.bg}"/>
  <rect width="${width}" height="${height}" fill="url(#glow-bg)"/>
  <g opacity="0.11">
    ${Array.from({ length: isWide ? 13 : 9 }, (_, i) => line(i * (width / (isWide ? 12 : 8)), 0, i * (width / (isWide ? 12 : 8)), height, frame.accent)).join("\n")}
    ${Array.from({ length: isWide ? 8 : 15 }, (_, i) => line(0, 104 + i * (height / (isWide ? 8 : 15)), width, 104 + i * (height / (isWide ? 8 : 15)), frame.accent)).join("\n")}
  </g>
  <rect x="${isWide ? 54 : 44}" y="${isWide ? 48 : 54}" width="${width - (isWide ? 108 : 88)}" height="${height - (isWide ? 96 : 108)}" rx="${isWide ? 28 : 34}" fill="none" stroke="${frame.accent}" stroke-opacity="0.24" stroke-width="2"/>
  <rect x="${isWide ? 78 : 64}" y="${isWide ? 72 : 84}" width="${width - (isWide ? 156 : 128)}" height="${isWide ? 58 : 66}" rx="15" fill="#030A14" opacity="0.76" stroke="${frame.accent}" stroke-opacity="0.24"/>
  ${text(frame.eyebrow, isWide ? 104 : 92, isWide ? 109 : 126, isWide ? 18 : 21, colors.steel, "start", 900, 'letter-spacing="3"')}
  ${text("VIDEO ASSET PACK", width - (isWide ? 104 : 92), isWide ? 109 : 126, isWide ? 15 : 18, frame.accent, "end", 900, 'letter-spacing="3"')}
  ${multiline(frame.title, titleX, titleY, titleSize, colors.white, titleAnchor, 900, 1.04, frame.accent)}
  ${subtitleLines.map((lineValue, index) => text(lineValue, subtitleX, subtitleY + index * (isWide ? 34 : 38), isWide ? 26 : 30, index === 0 ? colors.muted : colors.dim, subtitleAnchor, 700)).join("\n")}
  ${["route", "mobile"].includes(frame.kind) ? routeGraphic(frame, width, height) : dashboardMock(frame, layout)}
  ${statsSvg(frame, layout)}
  ${bulletsSvg(frame, layout)}
  ${footer(layout)}
</svg>`;
}

async function contain(path, boxWidth, boxHeight) {
  return sharp(path)
    .resize(boxWidth, boxHeight, { fit: "contain", withoutEnlargement: true })
    .png()
    .toBuffer();
}

async function background(path, width, height) {
  return sharp(path)
    .resize(width, height, { fit: "cover" })
    .modulate({ brightness: 0.42, saturation: 1.14 })
    .blur(1.6)
    .png()
    .toBuffer();
}

async function renderFrame(frame, layout, outputPath) {
  const { width, height, isWide } = layout;
  const bg = await background(frame.backdrop, width, height);
  const composites = [
    { input: Buffer.from(sceneSvg(frame, layout)), top: 0, left: 0 },
  ];

  const iconSize = isWide ? 126 : 144;
  const iconTop = isWide ? 178 : 216;
  const iconLeft = isWide ? Math.round(width * 0.74) : Math.round(width / 2 - iconSize / 2);
  composites.push({
    input: await contain(frame.icon, iconSize, iconSize),
    top: iconTop,
    left: iconLeft,
    blend: frame.icon === assets.loadiq ? "over" : "screen",
  });

  if (frame.secondaryIcon) {
    const secondarySize = Math.round(iconSize * 0.82);
    composites.push({
      input: await contain(frame.secondaryIcon, secondarySize, secondarySize),
      top: iconTop + Math.round(iconSize * 0.52),
      left: iconLeft + Math.round(iconSize * 0.7),
      blend: "screen",
    });
  }

  if (frame.kind === "brand" || frame.kind === "final") {
    const icons = [assets.loadiq, assets.core, assets.freight, assets.route, assets.educational];
    const size = isWide ? 72 : 82;
    const gap = isWide ? 18 : 20;
    const total = icons.length * size + (icons.length - 1) * gap;
    const start = Math.round((width - total) / 2);
    const top = isWide ? height - 235 : 1462;
    for (const [index, iconPath] of icons.entries()) {
      composites.push({
        input: await contain(iconPath, size, size),
        top,
        left: start + index * (size + gap),
        blend: index === 0 ? "over" : "screen",
      });
    }
  }

  await sharp(bg)
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
}

function markdownTable(rows) {
  return [
    "| # | File | Feature | Recommended use |",
    "| - | ---- | ------- | --------------- |",
    ...rows.map((row, index) => `| ${index + 1} | \`${row.file}\` | ${row.feature} | ${row.use} |`),
  ].join("\n");
}

function buildDocs() {
  const shotRows = frames.map((frame) => ({
    file: `${frame.id}.png`,
    feature: `${frame.eyebrow} - ${frame.title.join(" ")}`,
    use: frame.kind === "final" ? "Closing identity card" : frame.kind === "brand" ? "Opening title card" : "Feature highlight / B-roll card",
  }));

  const readme = `# Karpilo LoadIQ Video Builder Asset Pack

This folder contains clean marketing snapshots for building a video in Canva, CapCut, Adobe Express, Premiere, Resolve, or another purpose-built video platform.

## Folders

- \`snapshots/vertical-9x16\`: portrait frames for Facebook/Instagram Reels, Stories, TikTok, and Shorts.
- \`snapshots/wide-16x9\`: widescreen frames for YouTube, website hero video, and desktop ads.
- \`brand-assets\`: copied brand marks and Atlas icons used in the snapshots.
- \`data/manifest.json\`: machine-readable shot metadata.

## Positioning Guardrails

Karpilo LoadIQ is positioned as a transportation profitability calculator and operational estimation platform. Atlas support is educational, informational, and analytical. Do not describe the product as dispatch authority, compliance authority, route authority, or guaranteed-profit software.

## Suggested Video Flow

${markdownTable(shotRows)}

## Editing Notes

- Use slow push-ins, soft wipes, and subtle parallax.
- Avoid shaking, spinning, or duplicated text overlays.
- Let the visuals breathe; one line of narration per card is enough.
- Keep music slower, darker, and cinematic rather than upbeat corporate.
`;

  const copy = `# Copy Bank

Use these as captions, voiceover lines, or short overlays. Keep only one or two on screen at a time.

- Built for transportation profitability estimation.
- See loaded miles, deadhead, fuel pressure, and margin in one operating view.
- True RPM keeps unpaid movement visible.
- Estimate before the load. Compare actuals after the trip.
- Atlas Guidance explains what the numbers mean.
- Atlas Freight Intelligence interprets calculated margin pressure.
- Atlas Route Intelligence frames distance imbalance and movement context.
- Saved loads turn one-off decisions into visible operating patterns.
- Built on the road. One mile at a time.

## Avoid

- Guaranteed profit.
- Guaranteed fuel savings.
- Dispatch authority.
- Compliance certification.
- Exact final settlement claims.
`;

  writeFileSync(resolve(outDir, "README.md"), readme);
  writeFileSync(resolve(outDir, "copy-bank.md"), copy);
}

resetDir(verticalDir);
resetDir(wideDir);
resetDir(brandDir);
mkdirSync(dataDir, { recursive: true });

for (const assetPath of Object.values(assets)) {
  copyFileSync(assetPath, resolve(brandDir, basename(assetPath)));
}

const manifest = {
  generatedAt: new Date().toISOString(),
  source: "Karpilo LoadIQ app project",
  formats: {
    vertical: "1080x1920 PNG",
    wide: "1920x1080 PNG",
  },
  frames: frames.map((frame) => ({
    id: frame.id,
    eyebrow: frame.eyebrow,
    title: frame.title.join(" "),
    subtitle: frame.subtitle,
    stats: frame.stats,
    bullets: frame.bullets,
  })),
};

for (const frame of frames) {
  await renderFrame(frame, { width: 1080, height: 1920, isWide: false }, resolve(verticalDir, `${frame.id}.png`));
  await renderFrame(frame, { width: 1920, height: 1080, isWide: true }, resolve(wideDir, `${frame.id}.png`));
}

writeFileSync(resolve(dataDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
buildDocs();

console.log(`Wrote video builder asset pack to ${outDir}`);
