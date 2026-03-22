#!/usr/bin/env python3
"""Generate a 1280x800 promotional screenshot for Chrome Web Store."""

from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1280, 800

# Colors matching the extension theme
BG = (26, 26, 46)
CARD_BG = (22, 33, 62)
CARD_BORDER = (38, 50, 85)
ACCENT = (233, 69, 96)
WHITE = (255, 255, 255)
LIGHT_GRAY = (170, 170, 170)
MID_GRAY = (120, 120, 120)
DIM_GRAY = (85, 85, 85)

img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

# Subtle radial glow behind card
for r in range(300, 0, -1):
    alpha = int(12 * (1 - r / 300))
    c = tuple(min(255, bg + alpha) for bg in BG)
    draw.ellipse([W//2 - r, H//2 - r, W//2 + r, H//2 + r], fill=c)

# Card dimensions
card_w, card_h = 480, 320
cx = (W - card_w) // 2
cy = (H - card_h) // 2

# Card shadow
for s in range(20, 0, -1):
    opacity = int(6 * s)
    sc = (max(0, BG[0] - opacity), max(0, BG[1] - opacity), max(0, BG[2] - opacity))
    draw.rounded_rectangle(
        [cx - s, cy - s, cx + card_w + s, cy + card_h + s],
        radius=20 + s,
        fill=sc,
    )

# Card border glow
draw.rounded_rectangle(
    [cx - 1, cy - 1, cx + card_w + 1, cy + card_h + 1],
    radius=21,
    fill=CARD_BORDER,
)

# Card background
draw.rounded_rectangle(
    [cx, cy, cx + card_w, cy + card_h],
    radius=20,
    fill=CARD_BG,
)

# Load the shield icon and paste it centered
icon_path = os.path.join(os.path.dirname(__file__), "icons", "icon128.png")
if os.path.exists(icon_path):
    icon = Image.open(icon_path).convert("RGBA")
    icon = icon.resize((56, 56), Image.LANCZOS)
    icon_x = W // 2 - 28
    icon_y = cy + 50
    img.paste(icon, (icon_x, icon_y), icon)

# Try to load a font
try:
    font_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 28)
    font_body = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
    font_hint = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
    font_domain = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
except:
    font_title = ImageFont.load_default()
    font_body = font_title
    font_hint = font_title
    font_domain = font_title

# "Site Blocked" title
title = "Site Blocked"
bbox = draw.textbbox((0, 0), title, font=font_title)
tw = bbox[2] - bbox[0]
draw.text((W // 2 - tw // 2, cy + 120), title, fill=ACCENT, font=font_title)

# Domain pill
domain = "facebook.com"
dbbox = draw.textbbox((0, 0), domain, font=font_domain)
dw = dbbox[2] - dbbox[0]
dh = dbbox[3] - dbbox[1]
pill_pad_x, pill_pad_y = 20, 8
pill_x = W // 2 - (dw + pill_pad_x * 2) // 2
pill_y = cy + 162
draw.rounded_rectangle(
    [pill_x, pill_y, pill_x + dw + pill_pad_x * 2, pill_y + dh + pill_pad_y * 2],
    radius=8,
    fill=(233, 69, 96, 20),
    outline=(60, 40, 50),
)
draw.text((pill_x + pill_pad_x, pill_y + pill_pad_y), domain, fill=WHITE, font=font_domain)

# Divider line
div_w = 40
draw.rounded_rectangle(
    [W // 2 - div_w // 2, cy + 205, W // 2 + div_w // 2, cy + 207],
    radius=1,
    fill=DIM_GRAY,
)

# Message
msg = "This website has been blocked by Site Blocker."
mbbox = draw.textbbox((0, 0), msg, font=font_body)
mw = mbbox[2] - mbbox[0]
draw.text((W // 2 - mw // 2, cy + 222), msg, fill=LIGHT_GRAY, font=font_body)

# Hint
hint = "You can unblock it from the extension popup."
hbbox = draw.textbbox((0, 0), hint, font=font_hint)
hw = hbbox[2] - hbbox[0]
draw.text((W // 2 - hw // 2, cy + 252), hint, fill=MID_GRAY, font=font_hint)

# Save both sizes
out_path = os.path.join(os.path.dirname(__file__), "promo-1280x800.png")
img.save(out_path, "PNG")
print(f"Saved {out_path}")

# Also save 640x400
small = img.resize((640, 400), Image.LANCZOS)
out_small = os.path.join(os.path.dirname(__file__), "promo-640x400.png")
small.save(out_small, "PNG")
print(f"Saved {out_small}")
