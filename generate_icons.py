#!/usr/bin/env python3
"""Generate Site Blocker extension icons at 16, 48, and 128px."""

from PIL import Image, ImageDraw, ImageFont
import math
import os

ICON_DIR = os.path.join(os.path.dirname(__file__), "icons")

# Color palette matching the extension's dark theme
BG_COLOR = (26, 26, 46)        # #1a1a2e - dark bg
SHIELD_COLOR = (233, 69, 96)   # #e94560 - accent red/pink
SHIELD_DARK = (180, 50, 72)    # darker shade for depth
WHITE = (255, 255, 255)
TRANSPARENT = (0, 0, 0, 0)


def draw_shield(draw, cx, cy, size, color, outline_color=None):
    """Draw a shield shape centered at (cx, cy)."""
    w = size * 0.8
    h = size * 0.9
    top = cy - h * 0.45
    bot = cy + h * 0.55

    # Build shield path as polygon points
    points = []
    # Top left curve to top center
    steps = 12
    for i in range(steps + 1):
        t = i / steps
        x = cx - w / 2 + t * w / 2
        # Slight curve at top
        curve = (1 - (2 * t - 1) ** 2) * h * 0.05
        y = top - curve
        points.append((x, y))

    # Top center to top right curve
    for i in range(1, steps + 1):
        t = i / steps
        x = cx + t * w / 2
        curve = (1 - (2 * t - 1) ** 2) * h * 0.05
        y = top - curve
        points.append((x, y))

    # Right side down to bottom point
    side_steps = 16
    for i in range(1, side_steps + 1):
        t = i / side_steps
        # Sides curve inward toward the bottom point
        x = cx + w / 2 * (1 - t ** 1.2)
        y = top + t * (bot - top)
        points.append((x, y))

    # Bottom point
    points.append((cx, bot))

    # Left side going back up
    for i in range(1, side_steps):
        t = 1 - i / side_steps
        x = cx - w / 2 * (1 - (1 - t) ** 1.2)
        y = top + (1 - t) * (bot - top)
        points.append((x, y))

    draw.polygon(points, fill=color)
    if outline_color:
        draw.polygon(points, outline=outline_color)


def draw_hand_icon(draw, cx, cy, size):
    """Draw a raised hand / stop symbol inside the shield."""
    s = size * 0.28
    # Palm (circle)
    palm_r = s * 0.55
    palm_cy = cy + s * 0.15
    draw.ellipse(
        [cx - palm_r, palm_cy - palm_r, cx + palm_r, palm_cy + palm_r],
        fill=WHITE,
    )
    # Fingers (5 rounded rectangles)
    finger_w = s * 0.16
    finger_h = s * 0.5
    finger_positions = [-0.38, -0.19, 0, 0.19, 0.38]
    finger_heights = [0.7, 0.9, 1.0, 0.9, 0.65]
    for i, (xoff, hfactor) in enumerate(zip(finger_positions, finger_heights)):
        fx = cx + xoff * s * 1.3
        fh = finger_h * hfactor
        fy = palm_cy - palm_r * 0.6 - fh
        r = finger_w / 2
        draw.rounded_rectangle(
            [fx - finger_w / 2, fy, fx + finger_w / 2, fy + fh + r],
            radius=r,
            fill=WHITE,
        )
    # Thumb
    tx = cx - s * 0.55
    ty = palm_cy - s * 0.1
    draw.rounded_rectangle(
        [tx - finger_w / 2, ty, tx + finger_w / 2, ty + s * 0.35],
        radius=finger_w / 2,
        fill=WHITE,
    )


def draw_block_symbol(draw, cx, cy, size):
    """Draw a 'no entry' / block symbol (circle with diagonal line)."""
    r = size * 0.22
    line_w = max(2, int(size * 0.06))

    # Outer circle
    draw.ellipse(
        [cx - r, cy - r, cx + r, cy + r],
        outline=WHITE,
        width=line_w,
    )

    # Diagonal slash
    offset = r * 0.7
    draw.line(
        [cx - offset, cy + offset, cx + offset, cy - offset],
        fill=WHITE,
        width=line_w,
    )


def generate_icon(size):
    """Generate a single icon at the given size."""
    # Use 4x supersampling for antialiasing
    ss = 4
    big = size * ss
    img = Image.new("RGBA", (big, big), TRANSPARENT)
    draw = ImageDraw.Draw(img)

    cx, cy = big // 2, big // 2

    # Subtle circular background
    bg_r = big * 0.46
    draw.ellipse(
        [cx - bg_r, cy - bg_r, cx + bg_r, cy + bg_r],
        fill=(22, 33, 62, 200),  # #16213e with some transparency
    )

    # Shield
    draw_shield(draw, cx, cy, big * 0.85, SHIELD_COLOR)

    # Inner lighter shield for depth
    draw_shield(draw, cx, cy - big * 0.01, big * 0.7, SHIELD_DARK)
    draw_shield(draw, cx, cy - big * 0.01, big * 0.65, SHIELD_COLOR)

    # Block symbol centered in shield
    draw_block_symbol(draw, cx, cy + big * 0.03, big * 0.8)

    # Downsample with high-quality resampling
    img = img.resize((size, size), Image.LANCZOS)
    return img


def main():
    os.makedirs(ICON_DIR, exist_ok=True)
    for size in (16, 48, 128):
        icon = generate_icon(size)
        path = os.path.join(ICON_DIR, f"icon{size}.png")
        icon.save(path, "PNG")
        print(f"Generated {path} ({size}x{size})")


if __name__ == "__main__":
    main()
