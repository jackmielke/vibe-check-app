"""Renders assets/icon.png: the app's own gradient and typeface as a 1024 mark.

Run with: python3 scripts/make-icon.py
Requires Pillow. App Store icons must be square with no alpha channel.
"""
from PIL import Image, ImageDraw, ImageFont

SIZE = 1024
OUT = "assets/icon.png"
SYNE = "node_modules/@expo-google-fonts/syne/800ExtraBold/Syne_800ExtraBold.ttf"

# Same ramp the Atmosphere component paints behind every screen.
STOPS = [(0.00, (19, 50, 46)), (0.30, (31, 77, 69)), (0.62, (48, 118, 96)), (0.88, (196, 165, 116)), (1.00, (222, 196, 148))]
CREAM = (244, 239, 230)
ORB = (255, 214, 160)


def lerp(a, b, t):
    return tuple(round(x + (y - x) * t) for x, y in zip(a, b))


def ramp(t):
    """Colour at position t along the multi-stop gradient."""
    for (p0, c0), (p1, c1) in zip(STOPS, STOPS[1:]):
        if t <= p1:
            span = p1 - p0
            return lerp(c0, c1, 0 if span == 0 else (t - p0) / span)
    return STOPS[-1][1]


def diagonal_gradient():
    """Corner-to-corner gradient, matching the app's 0.15,0 -> 0.85,1 sweep."""
    img = Image.new("RGB", (SIZE, SIZE))
    px = img.load()
    for y in range(SIZE):
        for x in range(SIZE):
            t = (x * 0.42 + y * 0.58) / SIZE
            px[x, y] = ramp(min(1.0, max(0.0, t)))
    return img


def add_orb(img, cx, cy, radius, colour, peak):
    """Soft radial glow, drawn as stacked translucent discs."""
    glow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow)
    steps = 90
    for i in range(steps, 0, -1):
        f = i / steps
        r = radius * f
        # Falls off on a curve so the centre stays hot and the edge dissolves.
        alpha = round(peak * (1 - f) ** 2.2)
        if alpha <= 0:
            continue
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=colour + (alpha,))
    return Image.alpha_composite(img.convert("RGBA"), glow)


def main():
    img = add_orb(diagonal_gradient(), SIZE * 0.78, SIZE * 0.20, SIZE * 0.42, ORB, 135)

    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(SYNE, int(SIZE * 0.46))

    # Optically centre the glyph using its rendered bounds, not the font metrics.
    box = draw.textbbox((0, 0), "V", font=font)
    x = (SIZE - (box[2] - box[0])) / 2 - box[0]
    y = (SIZE - (box[3] - box[1])) / 2 - box[1]

    draw.text((x, y + SIZE * 0.012), "V", font=font, fill=(12, 34, 31, 70))  # grounding shadow
    draw.text((x, y), "V", font=font, fill=CREAM + (255,))

    img.convert("RGB").save(OUT)  # RGB drops alpha, which the App Store rejects
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
