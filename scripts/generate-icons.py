import zlib, struct, math, os

def make_png(width, height, get_pixel):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # filter type 0 (None)
        for x in range(width):
            r, g, b, a = get_pixel(x, y, width, height)
            raw_data.extend((int(r), int(g), int(b), int(a)))
    
    compressed = zlib.compress(bytes(raw_data), 9)
    
    def chunk(chunk_type, data):
        c = chunk_type + data
        crc = zlib.crc32(c) & 0xffffffff
        return struct.pack('>I', len(data)) + c + struct.pack('>I', crc)
    
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png.extend(chunk(b'IHDR', ihdr))
    png.extend(chunk(b'IDAT', compressed))
    png.extend(chunk(b'IEND', b''))
    return bytes(png)

def pixel_shader(x, y, w, h, is_maskable=False):
    # Normalized coordinates [-1, 1]
    nx = (x / w) * 2.0 - 1.0
    ny = (y / h) * 2.0 - 1.0
    dist = math.sqrt(nx * nx + ny * ny)

    # Base background: deep arena blue gradient
    # Top is slightly brighter (#0e1f4d), bottom is dark (#04091a)
    bg_r = 14 - int(10 * (ny + 1) / 2)
    bg_g = 31 - int(22 * (ny + 1) / 2)
    bg_b = 77 - int(51 * (ny + 1) / 2)

    # Rounded corners for non-maskable icon
    if not is_maskable:
        corner_radius = 0.28
        ax = abs(nx) - (1.0 - corner_radius)
        ay = abs(ny) - (1.0 - corner_radius)
        if ax > 0 and ay > 0:
            corner_dist = math.sqrt(ax * ax + ay * ay)
            if corner_dist > corner_radius:
                return (0, 0, 0, 0)

    # Margin scaling (maskable icons need safe inner zone <= 0.8)
    scale = 0.72 if is_maskable else 0.82
    sx = nx / scale
    sy = ny / scale
    sdist = math.sqrt(sx * sx + sy * sy)

    # Shield / Outer Ring
    shield_r, shield_g, shield_b = bg_r, bg_g, bg_b

    # Outer golden ring
    if 0.80 <= sdist <= 0.88:
        # Gold gradient: #f59e0b to #fbbf24
        ring_t = (sy + 1) / 2
        return (245, int(158 + 33 * ring_t), 11, 255)

    # Inside shield glow
    if sdist < 0.80:
        glow = max(0.0, 1.0 - sdist / 0.80)
        shield_r = min(255, int(bg_r + 20 * glow))
        shield_g = min(255, int(bg_g + 45 * glow))
        shield_b = min(255, int(bg_b + 90 * glow))

    # Center Emblem: Bold collegiate "U" and a golden star/lightning
    # Drawing letter "U":
    # U arms: x in [-0.42, -0.22] or [0.22, 0.42], y between -0.45 and 0.15
    # U bottom arc: outer radius 0.42, inner radius 0.22, centered at y = 0.15, for y >= 0.15
    in_u = False
    if -0.45 <= sy <= 0.15:
        if (-0.42 <= sx <= -0.22) or (0.22 <= sx <= 0.42):
            in_u = True
    elif sy > 0.15:
        arc_dist = math.sqrt(sx * sx + (sy - 0.15) * (sy - 0.15))
        if 0.22 <= arc_dist <= 0.42:
            in_u = True

    if in_u:
        # Cyan-to-white gradient for collegiate "U"
        u_t = (sy + 0.45) / 1.0
        cr = int(34 + (255 - 34) * u_t * 0.4)
        cg = int(211 + (255 - 211) * u_t * 0.3)
        cb = 245
        return (cr, cg, cb, 255)

    # Center Star / Trophy Sparkle in middle of U (sx ~ 0, sy between -0.2 and 0.1)
    if -0.25 <= sy <= 0.05 and -0.15 <= sx <= 0.15:
        # 4-pointed diamond star
        star_val = abs(sx / 0.15) + abs((sy + 0.10) / 0.15)
        if star_val <= 1.0:
            # Bright golden yellow
            return (251, 191, 36, 255)

    # Two small accent dots / laurel stars on bottom left and right
    for dx in [-0.60, 0.60]:
        dd = math.sqrt((sx - dx) * (sx - dx) + (sy - 0.50) * (sy - 0.50))
        if dd < 0.06:
            return (245, 158, 11, 255)

    return (shield_r, shield_g, shield_b, 255)

os.makedirs('public', exist_ok=True)

print("Generating public/icon-192.png...")
png_192 = make_png(192, 192, lambda x, y, w, h: pixel_shader(x, y, w, h, False))
with open('public/icon-192.png', 'wb') as f:
    f.write(png_192)

print("Generating public/icon-512.png...")
png_512 = make_png(512, 512, lambda x, y, w, h: pixel_shader(x, y, w, h, False))
with open('public/icon-512.png', 'wb') as f:
    f.write(png_512)

print("Generating public/icon-maskable-512.png...")
png_maskable = make_png(512, 512, lambda x, y, w, h: pixel_shader(x, y, w, h, True))
with open('public/icon-maskable-512.png', 'wb') as f:
    f.write(png_maskable)

print("Generating public/apple-touch-icon.png...")
png_apple = make_png(180, 180, lambda x, y, w, h: pixel_shader(x, y, w, h, False))
with open('public/apple-touch-icon.png', 'wb') as f:
    f.write(png_apple)

print("All PWA icons generated successfully!")
