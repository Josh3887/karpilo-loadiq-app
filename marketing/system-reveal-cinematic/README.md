# Karpilo Cinematic System Reveal

New standalone cinematic production for:

- Karpilo LoadIQ
- Karpilo FleetOS
- Karpilo Atlas / K-ATLS

This version uses:

- official Atlas branding assets from `public/branding/atlas`
- real app architecture names
- calculator and route-intelligence language from the app
- Supabase/RLS/saved-load telemetry references
- slow cinematic camera glides
- restrained safe-frame text
- no screen shake
- no chatbot framing
- no fake app systems

## Render

From the app repo root:

```bash
node marketing/system-reveal-cinematic/compose-system-reveal-score.mjs
node marketing/system-reveal-cinematic/render-system-reveal.mjs
```

The renderer expects ffmpeg at:

```text
/private/tmp/loadiq-video-tools/node_modules/ffmpeg-static/ffmpeg
```

## Output

```text
marketing/system-reveal-cinematic/karpilo-loadiq-fleetos-atlas-system-reveal.mp4
```

The video is 48 seconds, 720x1280, H.264 with AAC stereo audio.
