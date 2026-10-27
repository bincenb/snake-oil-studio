"""Synthesizes an original 120 BPM backing track for the reel (no samples, no licensing issues).

Cuts in reel.html land on beats, so hits here line up with the visuals.
Usage: python3 soundtrack.py  ->  out/soundtrack.wav
"""
import os
import wave
import numpy as np

SR = 44100
DUR = 24.0
BEAT = 0.5
rng = np.random.default_rng(7)
mix = np.zeros(int(SR * DUR))


def add(sig, at, gain=1.0):
    i = int(at * SR)
    sig = sig[: len(mix) - i]
    mix[i : i + len(sig)] += sig * gain


def env(n, attack=0.002, decay=0.2):
    t = np.arange(n) / SR
    return np.minimum(t / attack, 1) * np.exp(-t / decay)


def kick(big=False):
    n = int(SR * (0.6 if big else 0.35))
    t = np.arange(n) / SR
    freq = 45 + 120 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * env(n, 0.001, 0.25 if big else 0.12)


def hat():
    n = int(SR * 0.05)
    return np.diff(rng.standard_normal(n + 1)) * env(n, 0.0005, 0.012)


def clap():
    n = int(SR * 0.2)
    return rng.standard_normal(n) * env(n, 0.001, 0.05) * 0.6


def bass(f, length):
    n = int(SR * length)
    t = np.arange(n) / SR
    saw = 2 * ((t * f) % 1) - 1
    return np.tanh(2 * (saw * 0.6 + np.sin(2 * np.pi * f * t))) * env(n, 0.005, length * 0.6)


def pop(f=880):
    n = int(SR * 0.12)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * (1 + 2 * np.exp(-t * 40)) * t) * env(n, 0.001, 0.04)


def impact():
    n = int(SR * 0.8)
    noise = np.convolve(rng.standard_normal(n), np.ones(30) / 30, 'same')
    return noise * 3 * env(n, 0.001, 0.15)


def riser(length):
    n = int(SR * length)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n) * (t / length) ** 2 * 0.25
    tone = np.sin(2 * np.pi * np.cumsum(200 + 1200 * (t / length) ** 2) / SR) * (t / length) ** 2 * 0.2
    return noise + tone


# Groove: hook + tactics run 0-16.5s, the flip drops at 16.5, the end card eases off from 20.
roots = [55.0, 43.65, 65.41, 49.0]  # A1 F1 C2 G1
for b in range(int(DUR / BEAT)):
    at = b * BEAT
    if at >= 23.5:
        break
    if 15.0 <= at < 16.5:  # build into the flip: kick only, then silence before the drop
        if at < 16.0:
            add(kick(), at, 0.8)
        continue
    add(kick(big=at in (0.0, 16.5)), at, 0.9)
    add(hat(), at + BEAT / 2, 0.35)
    if b % 2 == 1 and at < 20:
        add(clap(), at, 0.5)
    bar = int(at // 2) % 4
    add(bass(roots[bar], BEAT * 0.9), at, 0.32 if at < 20 else 0.2)

add(riser(1.5), 15.0, 1.0)
for at in (2.5, 16.5, 20.0):
    add(impact(), at, 0.5)
for at in (1.4, 7.7, 10.55):  # stamp slams and "0 results"
    add(impact(), at, 0.45)
for i in range(5):  # F.A.K.E.S letters
    add(pop(660 * 2 ** (i / 12 * 2)), 2.75 + i * 0.22, 0.35)
for at in (12.1, 12.4, 12.7, 17.5, 18.0, 18.5, 21.0):  # comments, checks, CTA
    add(pop(990), at, 0.3)

mix = np.tanh(mix * 0.9)
fade = int(SR * 0.5)
mix[-fade:] *= np.linspace(1, 0, fade)
mix = (mix / np.max(np.abs(mix)) * 0.89 * 32767).astype(np.int16)

os.makedirs(os.path.join(os.path.dirname(__file__), 'out'), exist_ok=True)
with wave.open(os.path.join(os.path.dirname(__file__), 'out', 'soundtrack.wav'), 'wb') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(mix.tobytes())
