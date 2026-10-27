// Renders reel.html to an MP4 frame by frame.
//   node render.js                -> out/snake-oil-studio-reel.mp4 (+ cover.png)
//   node render.js --stills 1,5   -> out/still-1.png, out/still-5.png for quick checks
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const FPS = 30;
const OUT = path.join(__dirname, 'out');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.join(__dirname, 'reel.html'));
  await page.evaluate(() => document.fonts.ready);
  const stage = await page.$('#stage');
  const shot = async t => { await page.evaluate(t => window.render(t), t); return stage.screenshot({ type: 'png' }); };

  const si = process.argv.indexOf('--stills');
  if (si > -1) {
    for (const t of process.argv[si + 1].split(',').map(Number)) fs.writeFileSync(path.join(OUT, `still-${t}.png`), await shot(t));
    return browser.close();
  }

  fs.writeFileSync(path.join(OUT, 'cover.png'), await shot(2.0));

  const duration = await page.evaluate(() => window.DURATION);
  const audio = path.join(OUT, 'soundtrack.wav');
  const args = ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-'];
  if (fs.existsSync(audio)) args.push('-i', audio, '-c:a', 'aac', '-b:a', '192k', '-shortest');
  args.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-crf', '18', '-preset', 'slow',
    '-movflags', '+faststart', path.join(OUT, 'snake-oil-studio-reel.mp4'));
  const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });

  const frames = Math.round(duration * FPS);
  for (let i = 0; i < frames; i++) {
    const buf = await shot(i / FPS);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
})();
