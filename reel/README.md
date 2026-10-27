# Snake Oil Studio promo reel

`out/snake_oil_reel.mp4`: 1080x1920, 30 fps, 24 s, H.264 + AAC. Ready for Instagram Reels, TikTok and YouTube Shorts.

| File | What it is |
| --- | --- |
| `out/snake_oil_reel.mp4` | Full reel with the original beat and sound effects |
| `out/snake_oil_reel_sfx_only.mp4` | Same video with sound effects only, so you can add a trending sound in the Instagram editor |
| `out/cover.jpg` | Cover frame (the hook) |
| `out/cover_drop.jpg` | Other cover option (the F.A.K.E.S. reveal) |
| `make_reel.py` | Builds all of the above: `python3 reel/make_reel.py` (needs ffmpeg, numpy, Pillow) |

All the music and sound effects are made in code with numpy. There are no samples or licensed tracks, so the audio won't be muted or flagged for copyright.

## Structure (cuts land on the beat at 120 BPM)

| Time | Beat | On screen | Sound |
| --- | --- | --- | --- |
| 0–2 s | Hook | "POV: your boss says make $39 turmeric water go viral as an acne cure" | notification ping, filtered beat |
| 2–15 s | Five steps | F · A · K · E · S, with the share counter going from 0 to 1.2M | typing, cha-ching, glitch, stamps, buzzer, pops, riser, snare roll |
| 15–16 s | Twist | "...wait. you just built a scam in 15 seconds" (black-and-white freeze) | tape stop + record scratch |
| 16–20 s | Drop | THAT'S THE SCAM RECIPE: F.A.K.E.S. letters land one per beat | boom + hits, full phonk-style beat |
| 20–24 s | Call to action | Play the scammer. Spot the next one. SNAKE OIL STUDIO · LINK IN BIO | beat keeps going and cuts on the bar line so the reel loops cleanly |

A "PARODY · FAKE PRODUCT · MADE FOR TRAINING" tag stays on screen through the scam steps, so a screenshot of the fake ad can't pass as a real one.

## Caption

```
POV: you're hired to make a health scam go viral 😳

Fear hook. AI "expert." Knockoff citations. Enemy. Sale.
That's the F.A.K.E.S. recipe, and AI can fake all five in minutes.

Play the scammer in Snake Oil Studio so you can spot the next one 👀
Free · 10 min · no account · link in bio

Comment FAKES if you'd have shared it 👇

#medialiteracy #misinformation #healthscams #aifakes #deepfake #factcheck #scamalert #skincaretok #learnontiktok #edutok
```

## Posting tips

- Post it as a Reel, not a feed video, and pick `out/cover.jpg` as the cover.
- To ride a trending sound, upload `snake_oil_reel_sfx_only.mp4`, tap **Audio**, choose a trending track (look for the ↗ arrow) and set it to about 30–50% volume so the scratch and impacts still come through. The original-audio version works as-is if you'd rather keep the custom beat.
- Put the game link in your bio before you post, since the call to action points there.
- Pin a comment like "How many of the 5 did you spot? 🐍" to get replies going.
