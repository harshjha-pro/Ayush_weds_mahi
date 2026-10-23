# Original composition: tanpura drone + santoor-style melody in Raag Bhupali.
# Additive synthesis, no samples, so the result is free of third-party rights.
import numpy as np, wave, sys

SR = 44100
rng = np.random.default_rng(7)
SA = 146.83  # D3 as Sa
RATIO = {"S": 1, "R": 9 / 8, "G": 5 / 4, "P": 3 / 2, "D": 5 / 3}


def freq(note):
    name, octv = note[0], note.count("'") - note.count(",")
    return SA * 2 * RATIO[name] * 2**octv  # melody sits an octave above the drone


def pluck(f, dur, amp, bright=1.0, decay=2.2, inharm=0.0004, partials=10):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for k in range(1, partials + 1):
        fk = f * k * np.sqrt(1 + inharm * k * k)
        if fk > SR / 2.2:
            break
        a = (1 / k**1.15) * (bright if k > 3 else 1)
        out += a * np.exp(-t * decay * (1 + 0.35 * k)) * np.sin(2 * np.pi * fk * t + rng.uniform(0, 6.28))
    attack = np.minimum(1, t / 0.004)
    return amp * out * attack


def tanpura(f, dur, amp):
    # Jawari: upper harmonics swell after the pluck, giving the shimmering buzz.
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for k in range(1, 18):
        fk = f * k
        swell = np.exp(-((t - 0.25 * np.log1p(k)) ** 2) / (0.5 + 0.05 * k)) * (k > 2) + 0.4 * (k <= 2)
        env = np.exp(-t * (0.55 + 0.04 * k)) * (0.6 + swell)
        out += (1 / k**0.9) * env * np.sin(2 * np.pi * fk * t + rng.uniform(0, 6.28))
    return amp * out * np.minimum(1, t / 0.01)


def add(buf, sig, start):
    i = int(start * SR)
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i]


# Melody: (note, beats). "-" is a rest. One beat = 0.42 s, gently rubato.
PHRASES = [
    "S 2 D, 1 S 1 R 1 G 3 R 1 S 2 D, 1 P, 2 D, 1 S 4 - 2",
    "G 1 R 1 G 1 P 2 G 1 D 1 P 1 G 1 R 1 G 3 R 1 S 3 - 2",
    "G 1 P 1 D 1 S' 3 D 1 S' 1 R' 1 S' 2 D 1 P 1 G 1 P 3 G 1 R 1 S 3 - 2",
    "P 1 D 1 S' 1 R' 1 G' 3 R' 1 S' 2 D 1 P 2 G 1 R 1 S 1 D, 1 S 5 - 3",
]
BEAT = 0.42

events, t = [], 2.0
for ph in PHRASES:
    tok = ph.split()
    for name, beats in zip(tok[::2], tok[1::2]):
        d = float(beats) * BEAT * rng.uniform(0.94, 1.08)
        if name != "-":
            events.append((t, name, d))
        t += d
    t += 0.6
length = t + 3.5

mix = np.zeros(int(length * SR) + SR)

# Tanpura cycle: Pa(low) Sa Sa Sa(low), continuous under everything.
cycle = [SA * 3 / 4, SA, SA, SA / 2]
tt = 0.0
i = 0
while tt < length:
    add(mix, tanpura(cycle[i % 4], 4.5, 0.18), tt)
    tt += 0.85
    i += 1

# Santoor-style strikes: long notes get the soft tremolo the instrument is known for.
for start, name, d in events:
    f = freq(name)
    add(mix, pluck(f, min(d + 2.5, 5), 0.5, bright=1.1), start)
    if d > 0.9:
        k, s = 1, start + 0.16
        while s < start + d - 0.1:
            add(mix, pluck(f, 2.0, 0.22 * (0.85**k), bright=0.9, decay=3.0), s)
            s += 0.13
            k += 1

# A swarmandal-style shimmer to open and to close.
for base, direction in ((0.3, 1), (length - 3.2, -1)):
    notes = ["S", "R", "G", "P", "D", "S'", "R'", "G'", "P'"]
    seq = notes if direction > 0 else notes[::-1]
    for j, nm in enumerate(seq):
        add(mix, pluck(freq(nm), 3.0, 0.16, bright=1.3, decay=1.6), base + j * 0.07)

# Simple hall reverb: convolve with decaying noise.
ir_len = int(2.4 * SR)
ir = rng.standard_normal(ir_len) * np.exp(-np.arange(ir_len) / SR * 2.6)
ir[: int(0.02 * SR)] = 0
nfft = 1 << int(np.ceil(np.log2(len(mix) + ir_len)))
wet = np.fft.irfft(np.fft.rfft(mix, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(mix)]
wet /= np.max(np.abs(wet)) + 1e-9
dry = mix / (np.max(np.abs(mix)) + 1e-9)
out = 0.72 * dry + 0.38 * wet

# Fade in/out so the loop restarts softly.
n = len(out)
out[: int(2.0 * SR)] *= np.linspace(0, 1, int(2.0 * SR))
out[-int(3.5 * SR):] *= np.linspace(1, 0, int(3.5 * SR)) ** 1.5
out = out / np.max(np.abs(out)) * 0.85

with wave.open(sys.argv[1], "w") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((out * 32767).astype("<i2").tobytes())
print(f"{n / SR:.1f} s")
