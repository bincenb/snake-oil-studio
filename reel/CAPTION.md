# Snake Oil Studio reel: posting kit

**Video:** `out/snake-oil-studio-reel.mp4` (1080×1920, 30 fps, 24 s, H.264 + AAC)
**Cover:** `out/cover.png`

## Caption

I made a fake doctor in 30 seconds. That's the scary part.

Almost every health scam online follows the same recipe: F.A.K.E.S.
F: a fear hook
A: an AI "expert" who doesn't exist
K: knockoff studies a chatbot made up
E: an enemy to be angry at
S: the sale

Before you share a health post, ask:
1. Who made it?
2. Does the study exist?
3. What do others say?

Snake Oil Studio is a free 10-minute game where you build a (fictional) scam so you'll spot the next real one. Link in bio.

Send this to the person in your family who forwards every health tip.

#misinformation #medialiteracy #healthscams #deepfake #factcheck #ai #scamalert #criticalthinking #publichealth #learnontiktok

## On-screen text (for alt text / accessibility)

I made a fake doctor in 30 seconds. Every health scam uses the same 5-step recipe: F.A.K.E.S. Fear hook. AI "expert". Knockoff studies. An enemy. The sale. Before you share, ask: Who made it? Does the study exist? What do others say? Snake Oil Studio, free 10-minute game, link in bio.

## Posting notes

- The built-in track is original and synthesized, so it's safe to post. A trending sound usually helps reach more people: add one in the Instagram editor and turn the original audio down. Cuts land on a 120 BPM grid.
- Text stays out of the zones that Instagram's buttons and caption cover (top 220 px, bottom 400 px).
- The last frame fades to the dark background, so the loop back into the hook feels seamless. Rewatches help reach.
- Pin a comment with the game link, and put it in your bio before posting.
- Everything shown is fictional: Dr. Glow, ThermoRoot and the cited study are all invented, and they're labeled fake on screen.

## Rebuilding

```
python3 soundtrack.py   # out/soundtrack.wav
node render.js          # out/snake-oil-studio-reel.mp4 + out/cover.png
node render.js --stills 2,10   # preview frames
```

Edit text and timing in `reel.html` (`SCENES` holds the scene windows). Fonts are Oswald, Public Sans and JetBrains Mono (SIL Open Font License).
