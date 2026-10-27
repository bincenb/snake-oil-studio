"""Render the Snake Oil Studio promo reel (1080x1920, 30 fps, ~24 s).

Everything is generated here: frames are drawn with Pillow, and the beat and
sound effects are synthesized with numpy, so there is no licensed audio in the
file. Run: python3 reel/make_reel.py  (needs ffmpeg, numpy, Pillow)
"""
import math
import os
import random
import subprocess
import wave

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, "out")
W, H, FPS = 1080, 1920, 30
DUR = 24.0
SR = 44100
BPM = 120
BEAT = 60 / BPM          # 0.5 s
STEP = BEAT / 4          # 16th note

# Palette from index.html
INK = (19, 33, 46)
PANEL = (28, 46, 62)
PANEL2 = (34, 56, 75)
LINE = (46, 68, 87)
PAPER = (246, 243, 236)
MUTED = (191, 201, 209)
MUTED2 = (143, 160, 174)
CORAL = (240, 122, 90)
CORAL_DEEP = (184, 58, 32)
TEAL = (92, 194, 176)
RED = (226, 54, 54)

FONT_BLACK = "/usr/share/fonts/opentype/inter/InterDisplay-Black.otf"
FONT_BOLD = "/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf"
FONT_MONO = "/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Bold.ttf"
_fonts = {}


def font(path, size):
    key = (path, int(size))
    if key not in _fonts:
        _fonts[key] = ImageFont.truetype(path, max(4, int(size)))
    return _fonts[key]


# ----------------------------------------------------------------- easing
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def prog(t, start, dur):
    return clamp((t - start) / dur)


def ease_out(x):
    return 1 - (1 - x) ** 3


def ease_back(x):
    c1, c3 = 1.70158, 2.70158
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2


def pop(t, start, dur=0.18):
    """Scale factor for a pop-in: 0 before start, overshoots, settles at 1."""
    if t < start:
        return 0.0
    return ease_back(prog(t, start, dur))


# ----------------------------------------------------------------- drawing
def text_w(d, s, f):
    l, _, r, _ = d.textbbox((0, 0), s, font=f)
    return r - l


def wrap(d, s, f, maxw):
    out, line = [], ""
    for word in s.split(" "):
        test = (line + " " + word).strip()
        if text_w(d, test, f) <= maxw or not line:
            line = test
        else:
            out.append(line)
            line = word
    if line:
        out.append(line)
    return out


def centered(d, s, y, size, fill, path=FONT_BLACK, scale=1.0, maxw=940,
             lh=1.05, stroke=0, stroke_fill=INK, x=W // 2):
    """Draw wrapped, centered text; returns bottom y. scale=0 draws nothing."""
    if scale <= 0.01:
        return y
    f = font(path, size * scale)
    lines = wrap(d, s, font(path, size), maxw)
    step = size * scale * lh
    total = step * len(lines)
    cy = y + (size * lh * len(lines) - total) / 2
    for ln in lines:
        d.text((x, cy), ln, font=f, fill=fill, anchor="ma",
               stroke_width=stroke, stroke_fill=stroke_fill)
        cy += step
    return y + size * lh * len(lines)


def pill(d, cx, cy, s, size, fg, bg, pad=(26, 12), path=FONT_BLACK, outline=None):
    f = font(path, size)
    tw = text_w(d, s, f)
    x0, x1 = cx - tw / 2 - pad[0], cx + tw / 2 + pad[0]
    y0, y1 = cy - size / 2 - pad[1], cy + size / 2 + pad[1]
    d.rounded_rectangle((x0, y0, x1, y1), radius=(y1 - y0) / 2, fill=bg,
                        outline=outline, width=3 if outline else 0)
    d.text((cx, cy), s, font=f, fill=fg, anchor="mm")


def hud(d, t, shares, stage):
    # Fixed parody label so a clipped frame never reads as a real ad.
    pill(d, W // 2, 250, "PARODY  ·  FAKE PRODUCT  ·  MADE FOR TRAINING", 26,
         INK, PAPER, path=FONT_BOLD)
    # Stage pills, like the game header.
    letters = "FAKES"
    x = W // 2 - 2 * 92
    for i, ch in enumerate(letters):
        on = i == stage
        done = i < stage
        bg = CORAL if on else (PANEL2 if done else INK)
        fg = INK if on else (PAPER if done else MUTED2)
        d.rounded_rectangle((x + i * 92 - 36, 310, x + i * 92 + 36, 380), 10,
                            fill=bg, outline=CORAL if on else LINE, width=3)
        d.text((x + i * 92, 345), ch, font=font(FONT_BLACK, 44), fill=fg, anchor="mm")
    # Share meter.
    d.text((W // 2, 420), "SHARES", font=font(FONT_MONO, 30), fill=MUTED, anchor="ma")
    d.text((W // 2, 456), f"{int(shares):,}", font=font(FONT_MONO, 78), fill=CORAL, anchor="ma")


def phone_card(img, box, fill=PAPER, radius=34, shadow=True):
    d = ImageDraw.Draw(img)
    x0, y0, x1, y1 = box
    if shadow:
        d.rounded_rectangle((x0 + 10, y0 + 16, x1 + 10, y1 + 16), radius, fill=(10, 18, 26))
    d.rounded_rectangle(box, radius, fill=fill)
    return d


def bottle(d, cx, cy, s=1.0, label=True):
    """ThermoRoot Drops bottle."""
    bw, bh = 220 * s, 330 * s
    # dropper cap
    d.rounded_rectangle((cx - 40 * s, cy - bh / 2 - 120 * s, cx + 40 * s, cy - bh / 2 - 20 * s),
                        20 * s, fill=(30, 30, 30))
    d.rectangle((cx - 60 * s, cy - bh / 2 - 30 * s, cx + 60 * s, cy - bh / 2 + 10 * s), fill=(55, 55, 55))
    d.rounded_rectangle((cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2), 40 * s, fill=(196, 120, 34))
    d.rounded_rectangle((cx - bw / 2 + 18 * s, cy - bh / 2 + 18 * s, cx - bw / 2 + 48 * s, cy + bh / 2 - 40 * s),
                        14 * s, fill=(230, 168, 80))
    if label:
        d.rectangle((cx - bw / 2, cy - 70 * s, cx + bw / 2, cy + 90 * s), fill=PAPER)
        d.text((cx, cy - 40 * s), "THERMO", font=font(FONT_BLACK, 44 * s), fill=CORAL_DEEP, anchor="mm")
        d.text((cx, cy + 6 * s), "ROOT", font=font(FONT_BLACK, 44 * s), fill=CORAL_DEEP, anchor="mm")
        d.text((cx, cy + 58 * s), "DROPS", font=font(FONT_MONO, 26 * s), fill=INK, anchor="mm")


def stamp(img, cx, cy, s, color, scale, angle=-12, size=92):
    if scale <= 0.01:
        return
    f = font(FONT_BLACK, size)
    tmp = Image.new("RGBA", (1, 1))
    tw = text_w(ImageDraw.Draw(tmp), s, f)
    layer = Image.new("RGBA", (int(tw + 80), int(size * 1.7)), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    ld.rounded_rectangle((6, 6, layer.width - 6, layer.height - 6), 14, outline=color, width=10)
    ld.text((layer.width / 2, layer.height / 2), s, font=f, fill=color, anchor="mm")
    layer = layer.rotate(angle, expand=True, resample=Image.BICUBIC)
    if scale != 1:
        layer = layer.resize((max(1, int(layer.width * scale)), max(1, int(layer.height * scale))),
                             Image.BICUBIC)
    img.paste(layer, (int(cx - layer.width / 2), int(cy - layer.height / 2)), layer)


def doctor(img, cx, cy, t, glitch):
    """The AI-generated 'Dr. Glow' avatar with RGB-split glitch."""
    size = 420
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse((0, 0, size, size), fill=(120, 190, 220))
    d.pieslice((40, 250, size - 40, size + 230), 180, 360, fill=PAPER)              # coat
    d.polygon([(size / 2 - 40, 262), (size / 2 + 40, 262), (size / 2, 340)], fill=(92, 194, 176))
    d.ellipse((size / 2 - 95, 70, size / 2 + 95, 290), fill=(226, 176, 140))       # head
    d.chord((size / 2 - 100, 50, size / 2 + 100, 200), 180, 360, fill=(70, 44, 30))  # hair
    for ex in (-42, 42):
        d.ellipse((size / 2 + ex - 14, 170, size / 2 + ex + 14, 198), fill=INK)
    d.arc((size / 2 - 50, 190, size / 2 + 50, 255), 20, 160, fill=INK, width=8)  # smile
    d.ellipse((size / 2 - 70, 300, size / 2 - 20, 350), outline=MUTED2, width=6)  # stethoscope
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size, size), fill=255)
    layer.putalpha(Image.composite(layer.getchannel("A"), mask, mask))
    x, y = int(cx - size / 2), int(cy - size / 2)
    if glitch > 0:
        r, g, b, a = layer.split()
        off = int(18 * glitch)
        img.paste(Image.merge("RGBA", (r, g.point(lambda _: 0), b.point(lambda _: 0), a)),
                  (x - off, y), a)
        img.paste(Image.merge("RGBA", (r.point(lambda _: 0), g, b, a)), (x + off, y), a)
        # horizontal slice tears
        rnd = random.Random(int(t * 30))
        for _ in range(int(6 * glitch)):
            sy = rnd.randint(0, size - 30)
            strip = layer.crop((0, sy, size, sy + rnd.randint(8, 30)))
            img.paste(strip, (x + rnd.randint(-40, 40), y + sy), strip)
    else:
        img.paste(layer, (x, y), layer)


# ----------------------------------------------------------------- scenes
def step_title(d, lt, n, s):
    d.text((W // 2, 575), f"STEP {n} OF 5", font=font(FONT_MONO, 38), fill=MUTED2, anchor="ma")
    centered(d, s, 625, 100, CORAL, scale=pop(lt, 0.0), maxw=1040)


def scene_hook(img, d, t):
    centered(d, "POV:", 600, 96, CORAL, scale=pop(t, 0.0, 0.2))
    centered(d, "your boss says make", 720, 76, PAPER, scale=pop(t, 0.12))
    centered(d, "$39 TURMERIC WATER", 820, 88, PAPER, scale=pop(t, 0.3), maxw=1040)
    centered(d, "go viral as an acne cure", 940, 68, PAPER, path=FONT_BOLD, scale=pop(t, 0.5), maxw=1040)
    b = ease_back(prog(t, 0.7, 0.35))
    if b > 0:
        bottle(d, W // 2, 1340 + (1 - b) * 700, 1.0)
        pill(d, W // 2 + 210, 1200 + (1 - b) * 700, "$39", 56, INK, CORAL)


def scene_f(img, d, t, lt):
    step_title(d, lt, 1, "SCARE THEM")
    y0 = 790
    dd = phone_card(img, (90, y0, W - 90, y0 + 500))
    dd.ellipse((130, y0 + 40, 210, y0 + 120), fill=CORAL)
    dd.text((170, y0 + 80), "T", font=font(FONT_BLACK, 48), fill=INK, anchor="mm")
    dd.text((235, y0 + 52), "thermoroot.wellness", font=font(FONT_BOLD, 36), fill=INK)
    dd.text((235, y0 + 96), "Sponsored", font=font(FONT_BOLD, 28), fill=MUTED2)
    head = "STOP using acne cream NOW. What dermatologists won't tell you will SHOCK you."
    left = int(len(head) * prog(lt, 0.2, 1.2))
    y = y0 + 165
    for ln in wrap(dd, head, font(FONT_BLACK, 62), W - 300):
        dd.text((130, y), ln[:max(0, left)], font=font(FONT_BLACK, 62), fill=INK)
        left -= len(ln) + 1
        y += 74
    centered(d, "Fake news gets 70% more retweets", 1350, 50, PAPER, path=FONT_BOLD, scale=pop(lt, 1.5))
    centered(d, "Vosoughi et al., Science, 2018", 1415, 36, MUTED2, path=FONT_MONO, scale=pop(lt, 1.6))


def scene_a(img, d, t, lt):
    step_title(d, lt, 2, "FAKE AN EXPERT")
    g = 1.0 if lt < 0.45 else (0.6 if (int(lt * 12) % 5 == 0) else 0.0)
    doctor(img, W // 2, 1000, t, g)
    centered(d, "Dr. Glow, MD", 1235, 76, PAPER, scale=pop(lt, 0.4))
    centered(d, "“20 years in dermatology”", 1335, 50, MUTED, path=FONT_BOLD, scale=pop(lt, 0.55))
    stamp(img, W // 2, 1000, "AI-MADE. NOT REAL", RED, pop(lt, 1.25, 0.16), size=76)


def scene_k(img, d, t, lt):
    step_title(d, lt, 3, "FAKE THE PROOF")
    refs = ["Nguyen & Patel. J Integrative Dermal Science, 2023",
            "Okafor et al. Clinical Skin Nutrition Reports, 2024",
            "Hartley. Holistic Medicine Review, 2022"]
    d.text((W // 2, 780), "“AI, give me 3 studies proving it works”", font=font(FONT_BOLD, 40),
           fill=MUTED, anchor="ma")
    for i, r in enumerate(refs):
        p = ease_out(prog(lt, 0.25 + i * 0.25, 0.2))
        if p <= 0:
            continue
        y = 860 + i * 195 + (1 - p) * 80
        dd = phone_card(img, (110, y, W - 110, y + 165), fill=PANEL2, radius=24, shadow=False)
        dd.text((150, y + 30), f"[{i + 1}]", font=font(FONT_MONO, 40), fill=TEAL)
        for j, ln in enumerate(wrap(dd, r, font(FONT_BOLD, 40), W - 380)):
            dd.text((240, y + 30 + j * 52), ln, font=font(FONT_BOLD, 40), fill=PAPER)
    if lt > 1.2:
        pill(d, W // 2, 1490, "PubMed search: 0 results", 48, PAPER, PANEL, outline=LINE, path=FONT_MONO)
    stamp(img, W // 2, 1110, "INVENTED", RED, pop(lt, 1.45, 0.16), angle=8, size=110)


def scene_e(img, d, t, lt):
    step_title(d, lt, 4, "PICK AN ENEMY")
    centered(d, "BIG PHARMA", 790, 140, PAPER, scale=pop(lt, 0.15), maxw=1040)
    centered(d, "doesn't want you to know", 950, 62, MUTED, path=FONT_BOLD, scale=pop(lt, 0.3))
    comments = ["I KNEW it. They always lie to us.", "Sharing before it gets deleted",
                "This is why I don't trust doctors", "Finally someone says it!!"]
    for i, c in enumerate(comments):
        p = ease_back(prog(lt, 0.55 + i * 0.25, 0.2))
        if p <= 0:
            continue
        side = -1 if i % 2 == 0 else 1
        y = 1070 + i * 120
        f = font(FONT_BOLD, 42)
        tw = text_w(d, c, f)
        cx = W / 2 + side * 60 + (1 - p) * side * 500
        d.rounded_rectangle((cx - tw / 2 - 30, y, cx + tw / 2 + 30, y + 92), 46, fill=PANEL2)
        d.text((cx, y + 46), c, font=f, fill=PAPER, anchor="mm")


def scene_s(img, d, t, lt):
    step_title(d, lt, 5, "RUSH THE SALE")
    bottle(d, W // 2 - 220, 1080, 0.8)
    secs = max(0, 599 - int(lt * 37))
    pill(d, W // 2 + 170, 880, "ONLY 3 LEFT", 52, PAPER, RED)
    pill(d, W // 2 + 170, 1010, "50% OFF", 60, INK, CORAL)
    pill(d, W // 2 + 170, 1140, f"00:{secs // 60:02d}:{secs % 60:02d}", 52, PAPER, PANEL2, path=FONT_MONO)
    centered(d, "Clear skin in 7 days. Link in bio.", 1320, 56, PAPER, path=FONT_BOLD, scale=pop(lt, 0.5))
    if lt > 1.6:
        centered(d, "IT WENT VIRAL", 1420, 112, CORAL, scale=pop(lt, 1.6, 0.2), stroke=8, stroke_fill=INK)


def scene_wait(img, d, t, lt):
    centered(d, "...wait.", 900, 170, PAPER, scale=pop(lt, 0.05, 0.12))
    centered(d, "you just built a scam in 15 seconds", 1110, 54, MUTED, path=FONT_BOLD,
             scale=pop(lt, 0.45, 0.15))


def scene_fakes(img, d, t, lt):
    labels = ["Fear hook", "AI “expert”", "Knockoff citations", "Enemy", "Sale"]
    centered(d, "THAT'S THE SCAM RECIPE", 360, 80, TEAL, scale=pop(lt, 0.0))
    for i, (ch, lab) in enumerate(zip("FAKES", labels)):
        s = pop(lt, i * BEAT, 0.16)
        if s <= 0:
            continue
        cy = 640 + i * 190
        box = 160 * s
        d.rounded_rectangle((240 - box / 2, cy - box / 2, 240 + box / 2, cy + box / 2), 26,
                            fill=CORAL if i % 2 == 0 else TEAL)
        d.text((240, cy), ch, font=font(FONT_BLACK, 120 * s), fill=INK, anchor="mm")
        p = ease_out(prog(lt, i * BEAT + 0.06, 0.2))
        d.text((360 + (1 - p) * 60, cy), lab, font=font(FONT_BLACK, 68), fill=PAPER, anchor="lm")
    if lt > 2.6:
        centered(d, "AI can fake all 5 in minutes.", 1520, 54, MUTED, path=FONT_BOLD, scale=pop(lt, 2.6))


def scene_cta(img, d, t, lt):
    centered(d, "Play the scammer.", 540, 104, PAPER, scale=pop(lt, 0.0))
    centered(d, "Spot the next one.", 660, 104, TEAL, scale=pop(lt, 0.25))
    s = pop(lt, 0.5, 0.22)
    if s > 0:
        d.rounded_rectangle((W / 2 - 430 * s, 970 - 150 * s, W / 2 + 430 * s, 970 + 150 * s), 30, fill=PANEL,
                            outline=CORAL, width=5)
        d.text((W / 2, 920), "SNAKE OIL", font=font(FONT_BLACK, 110 * s), fill=PAPER, anchor="mm")
        d.text((W / 2, 1030), "STUDIO", font=font(FONT_BLACK, 110 * s), fill=CORAL, anchor="mm")
    centered(d, "free  ·  10 min  ·  no account", 1180, 50, MUTED, path=FONT_BOLD, scale=pop(lt, 0.9))
    if lt > 1.3:
        pulse = 1 + 0.04 * math.sin((lt - 1.3) * 2 * math.pi * 2)
        pill(d, W // 2, 1330, "LINK IN BIO", int(62 * pulse), INK, CORAL)
    centered(d, "Comment FAKES if you'd have shared it", 1460, 46, PAPER, path=FONT_BOLD, scale=pop(lt, 2.0))


# (start, end, fn, stage index or None, shares at start, shares at end)
SCENES = [
    (0.0, 2.0, "hook", None, 0, 0),
    (2.0, 4.5, "f", 0, 0, 18400),
    (4.5, 7.0, "a", 1, 18400, 96000),
    (7.0, 9.5, "k", 2, 96000, 240000),
    (9.5, 11.5, "e", 3, 240000, 610000),
    (11.5, 15.0, "s", 4, 610000, 1200000),
    (15.0, 16.0, "wait", None, 1200000, 1200000),
    (16.0, 20.0, "fakes", None, 0, 0),
    (20.0, 24.0, "cta", None, 0, 0),
]
FNS = {"f": scene_f, "a": scene_a, "k": scene_k, "e": scene_e, "s": scene_s,
       "wait": scene_wait, "fakes": scene_fakes, "cta": scene_cta}
IMPACTS = [2.0, 4.5, 7.0, 9.5, 11.5, 16.0, 16.5, 17.0, 17.5, 18.0, 20.0]
SHAKES = [5.75, 8.45, 13.1, 16.0, 16.5, 17.0, 17.5, 18.0]


def background(t, hot):
    img = Image.new("RGB", (W, H), INK)
    d = ImageDraw.Draw(img)
    # slow drifting diagonal stripes, faster in the drop
    speed = 220 if hot else 60
    off = (t * speed) % 160
    for i in range(-4, 30):
        x = i * 160 - off
        d.polygon([(x, 0), (x + 60, 0), (x + 60 - 700, H), (x - 700, H)], fill=(22, 37, 51))
    return img, d


def frame(t):
    sc = next(s for s in SCENES if s[0] <= t < s[1])
    start, end, name, stage, s0, s1 = sc
    lt = t - start
    hot = t >= 16.0
    img, d = background(t, hot)
    if stage is not None or name == "wait":
        k = ease_out(prog(lt, 0.0, max(0.4, (end - start) * 0.7)))
        shares = s0 + (s1 - s0) * k
        hud(d, t, shares, stage if stage is not None else 5)
    if name == "hook":
        hud(d, t, 0, -1)
        scene_hook(img, d, t)
    else:
        FNS[name](img, d, t, lt)

    if name == "wait":  # freeze-frame look
        img = Image.blend(img.convert("L").convert("RGB"), img, 0.25)
    # zoom punch on cuts/impacts
    z = 1.0
    for it in IMPACTS:
        if 0 <= t - it < 0.18:
            z = max(z, 1 + 0.07 * (1 - (t - it) / 0.18))
    if z > 1.0:
        cw, ch = int(W / z), int(H / z)
        img = img.crop(((W - cw) // 2, (H - ch) // 2, (W - cw) // 2 + cw, (H - ch) // 2 + ch)).resize((W, H))
    # shake
    for st in SHAKES:
        if 0 <= t - st < 0.2:
            a = 22 * (1 - (t - st) / 0.2)
            rnd = random.Random(int(t * 1000))
            img = img.transform((W, H), Image.AFFINE, (1, 0, rnd.uniform(-a, a), 0, 1, rnd.uniform(-a, a)),
                                fillcolor=INK)
    # white flash on the drop
    if 16.0 <= t < 16.15:
        img = Image.blend(img, Image.new("RGB", (W, H), PAPER), 0.85 * (1 - (t - 16.0) / 0.15))
    return img


# ----------------------------------------------------------------- audio
N = int(DUR * SR)
rng = np.random.default_rng(7)


def tt(sec):
    return np.arange(int(sec * SR)) / SR


def env(sec, decay, attack=0.002):
    t = tt(sec)
    return np.minimum(1, t / attack) * np.exp(-t / decay)


def lp_filter(x, cutoff):
    """One-pole low-pass; cutoff may be an array (time-varying)."""
    c = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    a = 1 - np.exp(-2 * np.pi * c / SR)
    y = np.empty_like(x)
    s = 0.0
    for i in range(len(x)):
        s += a[i] * (x[i] - s)
        y[i] = s
    return y


def band(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, len(x))


def kick():
    t = tt(0.45)
    f = 45 + 110 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    click = rng.standard_normal(len(t)) * np.exp(-t / 0.003) * 0.4
    return np.tanh(2.2 * np.sin(ph) * np.exp(-t / 0.22)) + click


def bass808(freq, sec=0.45, drive=2.0):
    t = tt(sec)
    f = freq * (1 + 0.6 * np.exp(-t / 0.02))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.tanh(drive * np.sin(ph)) * env(sec, sec * 0.55, 0.004)


def clap():
    t = tt(0.25)
    n = band(rng.standard_normal(len(t)), 900, 6000)
    e = np.zeros(len(t))
    for o in (0.0, 0.011, 0.022):
        i = int(o * SR)
        e[i:] += np.exp(-(t[: len(t) - i]) / (0.012 if o < 0.02 else 0.09))
    return n * e / np.abs(n).max()


_hat = band(rng.standard_normal(int(0.08 * SR)), 7000, 16000)
_hat /= np.abs(_hat).max()


def hat(dec=0.025):
    return _hat * np.exp(-tt(0.08) / dec)


def cowbell(freq):
    t = tt(0.32)
    sq = np.sign(np.sin(2 * np.pi * freq * t)) + np.sign(np.sin(2 * np.pi * freq * 1.48 * t))
    return band(sq, 400, 5000) * env(0.32, 0.09) * 0.5


def noise_sweep(sec, f0, f1, shape="bell"):
    t = tt(sec)
    n = rng.standard_normal(len(t))
    cut = f0 * (f1 / f0) ** (t / sec)
    y = n - lp_filter(n, cut * 0.35)   # crude band around the sweep
    y = lp_filter(y, cut)
    e = np.sin(np.pi * t / sec) ** 2 if shape == "bell" else (t / sec) ** 2.5
    return y * e / (np.abs(y).max() + 1e-9)


def ping():
    out = np.zeros(int(0.5 * SR))
    for o, f in ((0.0, 1318.5), (0.09, 1760.0)):
        s = np.sin(2 * np.pi * f * tt(0.4)) * env(0.4, 0.09)
        i = int(o * SR)
        out[i:i + len(s)] += s
    return out * 0.6


def tick():
    t = tt(0.02)
    return band(rng.standard_normal(len(t)), 2000, 9000) * np.exp(-t / 0.003)


def chaching():
    t = tt(0.9)
    ring = sum(np.sin(2 * np.pi * f * t) * a for f, a in ((2093, 1), (2637, .7), (3136, .5), (4186, .3)))
    ring *= env(0.9, 0.25)
    out = np.zeros(int(1.0 * SR))
    c = tick() * 3
    out[:len(c)] += c
    i = int(0.08 * SR)
    out[i:i + len(ring)] += ring * 0.35
    return out


def buzzer():
    t = tt(0.45)
    s = np.sign(np.sin(2 * np.pi * 98 * t)) + np.sign(np.sin(2 * np.pi * 104 * t))
    return lp_filter(s, 2500) * env(0.45, 0.3, 0.005) * 0.35


def glitch():
    sec = 0.4
    out = np.zeros(int(sec * SR))
    i = 0
    while i < len(out):
        L = int(rng.integers(300, 2500))
        kind = rng.integers(0, 3)
        seg = tt(L / SR)
        if kind == 0:
            s = np.sign(np.sin(2 * np.pi * rng.uniform(200, 2000) * seg))
        elif kind == 1:
            s = np.round(rng.standard_normal(L) * 2) / 2
        else:
            s = np.zeros(L)
        out[i:i + L] = s[: len(out) - i] * 0.35
        i += L
    return out


def popfx():
    t = tt(0.08)
    f = 300 + 900 * np.exp(-t / 0.012)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(0.08, 0.025) * 0.7


def boom():
    t = tt(1.6)
    f = 32 + 60 * np.exp(-t / 0.08)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.6)
    n = lp_filter(rng.standard_normal(len(t)), 1800) * np.exp(-t / 0.12) * 1.2
    return np.tanh(1.6 * (sub + n))


def stamp_hit():
    t = tt(0.3)
    return np.tanh(3 * (np.sin(2 * np.pi * 70 * t) * np.exp(-t / 0.06)
                        + lp_filter(rng.standard_normal(len(t)), 3000) * np.exp(-t / 0.03)))


def place(buf, at, sig, gain=1.0):
    i = int(at * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i] * gain


def build_music():
    drums = np.zeros(N)
    bass = np.zeros(N)
    lead = np.zeros(N)
    # E minor phonk-ish: roots per bar (Hz)
    roots = [41.2, 41.2, 49.0, 36.7]  # E1 E1 G1 D1
    mel = [659.3, 0, 784.0, 659.3, 0, 880.0, 784.0, 0, 659.3, 0, 587.3, 0, 659.3, 784.0, 0, 987.8]
    bars = int(DUR / (BEAT * 4))
    for bar in range(bars):
        b0 = bar * BEAT * 4
        if 15.0 <= b0 < 16.0:
            continue
        drop = b0 >= 16.0
        build = 12.0 <= b0 < 15.0
        root = roots[bar % 4]
        kicks = [0, 3, 6, 10] if drop else [0, 7, 10]
        for k in kicks:
            at = b0 + k * STEP
            if 15.0 <= at < 16.0:
                continue
            place(drums, at, kick(), 0.9)
            place(bass, at, bass808(root * (2 if k == 6 and drop else 1), 0.42 if not drop else 0.38,
                                    2.8 if drop else 1.8), 0.55)
        for c in (4, 12):
            at = b0 + c * STEP
            if not (15.0 <= at < 16.0):
                place(drums, at, clap(), 0.45)
        # hats with rolls
        for st in range(16):
            at = b0 + st * STEP
            if 15.0 <= at < 16.0:
                continue
            if st % 2 == 0 or drop:
                place(drums, at, hat(), 0.22 if st % 4 == 0 else 0.15)
        if bar % 2 == 1 or build:
            for r in range(6):  # 32nd-triplet roll at end of the bar
                place(drums, b0 + 12 * STEP + r * STEP * 2 / 3, hat(0.015), 0.12 + r * 0.02)
        # cowbell melody (quieter until the drop, absent in the first half-bar to let the ping land)
        g = 0.42 if drop else (0.0 if b0 < 2.0 else 0.22)
        for st, f in enumerate(mel):
            at = b0 + st * STEP
            if f and not (15.0 <= at < 16.0):
                place(lead, at, cowbell(f * (1.5 if bar % 4 == 3 else 1)), g)
    # snare roll building into the stop
    t = 13.0
    while t < 15.0:
        rate = STEP if t < 14.0 else STEP / 2
        place(drums, t, clap(), 0.18 + 0.25 * (t - 13.0) / 2)
        t += rate
    # sidechain-ish duck of bass + lead on each kick
    duck = np.ones(N)
    for bar in range(bars):
        for k in ([0, 3, 6, 10] if bar * 2 >= 16 else [0, 7, 10]):
            i = int((bar * 2 + k * STEP) * SR)
            L = int(0.12 * SR)
            if i < N:
                seg = 1 - 0.6 * np.exp(-np.arange(min(L, N - i)) / (0.04 * SR))
                duck[i:i + len(seg)] = np.minimum(duck[i:i + len(seg)], seg)
    music = drums + (bass + lead) * duck
    # first bar slightly filtered so the hook voiceover/SFX sits on top
    music[: int(2.0 * SR)] = lp_filter(music[: int(2.0 * SR)], np.linspace(1200, 12000, int(2.0 * SR)))
    # riser
    place(music, 13.0, noise_sweep(2.0, 300, 9000, "up"), 0.35)
    return music


def tape_stop(x, at, sec):
    """Slow the music to a halt starting at `at` for `sec` seconds."""
    i0, L = int(at * SR), int(sec * SR)
    src = x[i0:i0 + int(sec * SR * 1.5)].copy()
    rate = np.linspace(1, 0, L) ** 1.3
    pos = np.cumsum(rate)
    pos = np.clip(pos, 0, len(src) - 2)
    out = np.interp(pos, np.arange(len(src)), src) * np.linspace(1, 0.2, L)
    x[i0:i0 + L] = out
    x[i0 + L:int(16.0 * SR)] = 0


def scratch(x, at):
    """Vinyl scratch made by wobbling playback of a slice of the beat."""
    src = x[int(16.0 * SR):int(16.6 * SR)].copy()
    L = int(0.45 * SR)
    t = np.arange(L) / SR
    pos = (0.15 + 0.12 * np.sin(2 * np.pi * 6.5 * t) * (1 - t / 0.45)) * SR
    s = np.interp(pos, np.arange(len(src)), src) * np.sin(np.pi * t / 0.45)
    place(x, at, s, 0.9)


def build_sfx():
    fx = np.zeros(N)
    place(fx, 0.0, ping(), 0.8)
    place(fx, 0.25, noise_sweep(0.5, 800, 6000), 0.25)
    place(fx, 0.75, popfx(), 0.7)           # bottle
    for at in (2.0, 4.5, 7.0, 9.5, 11.5, 20.0):
        place(fx, at - 0.25, noise_sweep(0.3, 1500, 9000), 0.35)   # whoosh into each cut
    for i in range(28):                       # typing the headline
        place(fx, 2.2 + i * (1.2 / 28) + rng.uniform(-0.01, 0.01), tick(), 0.5)
    place(fx, 3.5, chaching(), 0.6)
    place(fx, 4.5, glitch(), 0.7)
    place(fx, 5.75, stamp_hit(), 0.8)
    for i in range(3):
        place(fx, 7.25 + i * 0.25, popfx(), 0.6)
    place(fx, 8.2, buzzer(), 0.9)
    place(fx, 8.45, stamp_hit(), 0.8)
    for i in range(4):
        place(fx, 10.05 + i * 0.25, popfx(), 0.5)
    place(fx, 12.0, chaching(), 0.5)
    place(fx, 13.1, chaching(), 0.7)
    for i in range(6):                        # notification storm as it goes viral
        place(fx, 13.3 + i * 0.27, ping(), 0.25)
    for at in (16.0, 16.5, 17.0, 17.5, 18.0):
        place(fx, at, boom() if at == 16.0 else stamp_hit(), 0.9 if at == 16.0 else 0.6)
    place(fx, 20.5, chaching(), 0.45)
    place(fx, 21.3, ping(), 0.4)
    return fx


def build_audio(with_music=True):
    music = build_music()
    tape_stop(music, 14.75, 0.5)
    scratch(music, 15.05)
    fx = build_sfx()
    mix = (music * 0.7 if with_music else 0) + fx * 0.8
    if not with_music:
        # keep the scratch so the freeze still lands
        scratch(mix, 15.05)
    mix = np.tanh(1.3 * mix) / np.tanh(1.3)
    mix *= 0.89 / (np.abs(mix).max() + 1e-9)
    fade = int(0.01 * SR)
    mix[-fade:] *= np.linspace(1, 0, fade)
    return mix


def write_wav(path, x):
    data = (np.clip(x, -1, 1) * 32767).astype("<i2")
    stereo = np.repeat(data[:, None], 2, axis=1)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(stereo.tobytes())


# ----------------------------------------------------------------- main
def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    full_wav = os.path.join(OUT_DIR, "_audio_full.wav")
    sfx_wav = os.path.join(OUT_DIR, "_audio_sfx.wav")
    write_wav(full_wav, build_audio(True))
    write_wav(sfx_wav, build_audio(False))
    print("audio done")

    silent = os.path.join(OUT_DIR, "_video.mp4")
    ff = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
         "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium",
         "-crf", "18", "-pix_fmt", "yuv420p", silent],
        stdin=subprocess.PIPE)
    total = int(DUR * FPS)
    for n in range(total):
        t = n / FPS
        img = frame(t)
        if n == int(16.3 * FPS):
            img.save(os.path.join(OUT_DIR, "cover_drop.jpg"), quality=92)
        ff.stdin.write(img.tobytes())
        if n % 60 == 0:
            print(f"frame {n}/{total}")
    ff.stdin.close()
    ff.wait()
    frame(1.4).save(os.path.join(OUT_DIR, "cover.jpg"), quality=92)

    for wav, name in ((full_wav, "snake_oil_reel.mp4"), (sfx_wav, "snake_oil_reel_sfx_only.mp4")):
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", silent, "-i", wav, "-c:v", "copy",
                        "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart",
                        os.path.join(OUT_DIR, name)], check=True)
    for p in (silent, full_wav, sfx_wav):
        os.remove(p)
    print("done:", OUT_DIR)


if __name__ == "__main__":
    main()
