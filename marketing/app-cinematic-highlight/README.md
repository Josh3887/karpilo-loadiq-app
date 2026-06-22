# Karpilo LoadIQ Cinematic App Highlight

This version intentionally avoids the problems in the earlier trailer attempts:

- no screen shake
- no heavy text-overlay trailer treatment
- no generic startup montage
- no fake chatbot framing
- slower cinematic tempo
- product-first app surfaces

The reel highlights LoadIQ sell points through calm app-style scenes:

- profitability estimate dashboard
- Analyze Load inputs
- true RPM and deadhead context
- fuel/FSC pressure
- post-trip actuals
- saved load history
- Atlas educational guidance

## Render

From the app repo root:

```bash
node marketing/app-cinematic-highlight/compose-slow-loadiq-score.mjs
node marketing/app-cinematic-highlight/render-app-highlight.mjs
```

The renderer expects ffmpeg at:

```text
/private/tmp/loadiq-video-tools/node_modules/ffmpeg-static/ffmpeg
```

## Output

```text
marketing/app-cinematic-highlight/karpilo-loadiq-app-cinematic-highlight.mp4
```

The video is 46 seconds, 720x1280, H.264 with AAC stereo audio.
