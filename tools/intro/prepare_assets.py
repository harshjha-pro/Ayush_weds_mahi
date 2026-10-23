"""Prepare the intro's photographic layers from the generated source images.

Sources are AI-generated stills (Figma file "Mahi & Ayush – Intro Assets"),
saved as PNG in a folder passed as the first argument. This script:
  - keys out the green backdrop (dove, branch, letter, paper) with despill,
  - lines the three dove poses up on the eye so they can be swapped while flying,
  - repaints the wax seal so it reads "M&A",
  - splits the rolled letter into a bow/seal layer and a bare roll,
  - writes mobile-sized WebP files to assets/intro/.

Usage: python3 prepare_assets.py <raw-dir> <font.ttf> <out-dir>
"""
import sys
import numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageFont, ImageChops

RAW, FONT, OUT = sys.argv[1:4]


def load(name):
    return np.asarray(Image.open(f"{RAW}/{name}.png").convert("RGB")).astype(np.float32)


def key_green(a, t0=25.0, t1=70.0, despill_all=True):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    d = g - np.maximum(r, b)
    alpha = 1 - np.clip((d - t0) / (t1 - t0), 0, 1)
    out = a.copy()
    spill_cap = np.maximum(r, b)
    mask = np.ones_like(alpha, bool) if despill_all else alpha < 0.98
    out[..., 1] = np.where(mask, np.minimum(g, spill_cap), g)
    return out, alpha


def to_image(rgb, alpha):
    a = np.clip(alpha * 255, 0, 255).astype(np.uint8)
    im = Image.fromarray(np.dstack([np.clip(rgb, 0, 255).astype(np.uint8), a]), "RGBA")
    # Soften the matte edge by a hair so cut-outs sit naturally on the plates.
    soft = im.getchannel("A").filter(ImageFilter.GaussianBlur(0.6))
    im.putalpha(ImageChops.multiply(soft, im.getchannel("A")).point(lambda v: min(255, int(v * 1.25))))
    return im


def crop_alpha(im, pad=8):
    box = im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    x0, y0, x1, y1 = box
    return im.crop((max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad)))


def save(im, name, width=None, q=84):
    if width and im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(f"{OUT}/{name}.webp", "WEBP", quality=q, method=6)
    return im.size


# ── Plates (full-frame backgrounds) ──────────────────────────
for name in ("garden", "table"):
    print(name, save(Image.open(f"{RAW}/{name}.png").convert("RGB"), name, q=80))

# ── Dove poses, registered on the eye ────────────────────────
# Eye positions and scale measured on the sources; the perched bird was
# generated larger, so it is scaled to match the flying poses.
POSES = {"dove-perched": ((748, 212), 0.72), "dove-up": ((735, 524), 1.0), "dove-down": ((744, 338), 1.0)}
CANVAS = (1100, 1000)
EYE_AT = (800, 470)
for name, ((ex, ey), s) in POSES.items():
    rgb, alpha = key_green(load(name))
    im = to_image(rgb, alpha)
    if s != 1:
        im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    canvas.alpha_composite(im, (round(EYE_AT[0] - ex * s), round(EYE_AT[1] - ey * s)))
    print(name, save(canvas, name, width=640, q=80))

# ── Blossom branch ───────────────────────────────────────────
rgb, alpha = key_green(load("branch"), t0=40, t1=78, despill_all=False)
print("branch", save(crop_alpha(to_image(rgb, alpha)), "branch", width=1100, q=78))

# ── Parchment card ───────────────────────────────────────────
rgb, alpha = key_green(load("paper"))
print("paper", save(crop_alpha(to_image(rgb, alpha), pad=4), "paper", width=720, q=80))

# ── Rolled letter: seal repaint, bow layer, bare roll ────────
src = load("scroll")
# This backdrop came out darker, so the key starts lower.
rgb, alpha = key_green(src, t0=18, t1=50)
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]

H, W = alpha.shape
yy, xx = np.mgrid[0:H, 0:W]
near_bow = (xx > 370) & (xx < 1010) & (yy > 180) & (yy < 565)
seal_disc = (xx - 686) ** 2 + (yy - 383) ** 2 < 90**2
# Satin keeps more blue than the ivory paper, even in its pale highlights.
satin = (((r - g > 34) & (r > 150)) | ((r - g > 10) & (b > g - 13) & (r > 170))) & near_bow
gold = (r - b > 70) & (r < 235) & (g < r)
outline = Image.new("L", (W, H), 0)
ImageDraw.Draw(outline).polygon(
    [(392, 232), (470, 222), (628, 296), (690, 286), (760, 246), (862, 188), (956, 228), (962, 304), (912, 372),
     (950, 440), (1002, 556), (905, 524), (772, 470), (700, 526), (566, 472), (522, 556), (382, 502), (468, 424),
     (514, 384), (404, 352)],
    fill=255,
)
outline = np.asarray(outline) > 0
bow = Image.fromarray((((satin & outline) | (gold & seal_disc)) & (alpha > 0.5)).astype(np.uint8) * 255)
# Fill the small holes left by specular highlights, then drop stray specks.
bow = bow.filter(ImageFilter.MaxFilter(11)).filter(ImageFilter.MinFilter(11)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
bow = Image.fromarray((np.asarray(bow) * outline).astype(np.uint8))
# Fill the small gaps left by bright highlights (a wider closing), keeping
# the result inside the traced outline so paper between the loops stays out.
closed = bow.filter(ImageFilter.MaxFilter(21)).filter(ImageFilter.MinFilter(21))
bow = Image.fromarray((np.maximum(np.asarray(bow), np.asarray(closed)) * outline).astype(np.uint8))
bow = bow.filter(ImageFilter.GaussianBlur(1.2))
bow_m = np.asarray(bow).astype(np.float32) / 255

# Warm the roll's shadowed underside, which picked up the green backdrop.
lum = 0.3 * r + 0.59 * g + 0.11 * b
cool = (alpha > 0.5) & (bow_m < 0.2) & (b < g - 25) & ~(satin | gold)
for c, k in enumerate((1.12, 1.0, 0.84)):
    rgb[..., c] = np.where(cool, np.clip(lum * k + 18, 0, 255), rgb[..., c])

# Repaint the seal: smooth the generated lettering, then engrave "M&A".
img = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8))
cx, cy, R = 686, 383, 86
disc = Image.new("L", img.size, 0)
ImageDraw.Draw(disc).ellipse((cx - R + 14, cy - R + 14, cx + R - 14, cy + R - 14), fill=255)
smooth = img.filter(ImageFilter.GaussianBlur(9))
img = Image.composite(smooth, img, disc.filter(ImageFilter.GaussianBlur(3)))
font = ImageFont.truetype(FONT, 68)
text = "M&A"
tw = font.getbbox(text)[2] - font.getbbox(text)[0]
th = font.getbbox(text)[3] - font.getbbox(text)[1]
tx, ty = cx - tw / 2 - font.getbbox(text)[0], cy - th / 2 - font.getbbox(text)[1] - 2
layer = ImageDraw.Draw(img)
for (dx, dy), col in (((1.6, 1.6), (232, 205, 140)), ((-1.2, -1.2), (92, 66, 24)), ((0, 0), (150, 112, 52))):
    layer.text((tx + dx, ty + dy), text, font=font, fill=col)
for rr, col in ((R - 22, (120, 88, 36)), (R - 20, (226, 196, 128))):
    layer.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), outline=col, width=1)
rgb = np.asarray(img).astype(np.float32)

full = to_image(rgb, alpha)
box = full.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
box = (box[0] - 8, box[1] - 8, box[2] + 8, box[3] + 8)

# Bow + seal on their own layer, so they can lift away when the letter opens.
bow_layer = to_image(rgb, alpha * bow_m)

# Bare roll: rebuild the part under the bow from clean paper on either side.
roll_y0, roll_y1 = 262, 530
# Mirrored tiles of the clean ends, cross-faded where they meet, replace the
# whole middle band (feathered into the original at both sides).
x0, x1 = 360, 1025
span = x1 - x0


def tile(src_x0, src_x1, arr):
    seg = arr[roll_y0:roll_y1, src_x0:src_x1]
    return np.concatenate([seg, seg[:, ::-1]], axis=1)


def blend_join(a, b, fade=40):
    w = np.linspace(1, 0, fade)[None, :, None] if a.ndim == 3 else np.linspace(1, 0, fade)[None, :]
    mid = a[:, -fade:] * w + b[:, :fade] * (1 - w)
    return np.concatenate([a[:, :-fade], mid, b[:, fade:]], axis=1)


def band(arr):
    left, right = tile(135, 375, arr), tile(1010, 1250, arr)[:, ::-1]
    joined = blend_join(left, right)
    img = Image.fromarray(np.clip(joined if joined.ndim == 2 else joined, 0, 255).astype(np.uint8))
    return np.asarray(img.resize((span, roll_y1 - roll_y0), Image.LANCZOS)).astype(np.float32)


bare = rgb.copy()
bare_alpha = alpha.copy()
patch = band(rgb)
patch_a = band(alpha * 255) / 255
feather = np.ones(span)
feather[:30] = np.linspace(0, 1, 30)
feather[-30:] = np.linspace(1, 0, 30)
m = feather[None, :]
bare[roll_y0:roll_y1, x0:x1] = patch * m[..., None] + bare[roll_y0:roll_y1, x0:x1] * (1 - m[..., None])
bare_alpha[roll_y0:roll_y1, x0:x1] = patch_a * m + bare_alpha[roll_y0:roll_y1, x0:x1] * (1 - m)
# The bow's loops and tails stick out past the roll; drop them from the bare roll.
outside = np.ones_like(alpha, bool)
outside[roll_y0:roll_y1, :] = False
bare_alpha = np.where(outside & (bow_m > 0.1), 0, bare_alpha)

for im, name in ((full, "scroll"), (bow_layer, "scroll-bow"), (to_image(bare, bare_alpha), "scroll-roll")):
    print(name, save(im.crop(box), name, width=760, q=82))
print("crop box", box)
