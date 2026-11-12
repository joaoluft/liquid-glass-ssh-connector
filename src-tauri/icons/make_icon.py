"""Generates icon.ico (pure Python, no deps): glassy squircle with a terminal prompt glyph."""
import math, struct, zlib, os

def seg_dist(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))

def render(n):
    ss = 4 if n <= 64 else 2
    N = n * ss
    img = []
    for y in range(n):
        row = []
        for x in range(n):
            acc = [0.0, 0.0, 0.0, 0.0]
            for sy in range(ss):
                for sx in range(ss):
                    u = (x * ss + sx + 0.5) / N
                    v = (y * ss + sy + 0.5) / N
                    c = sample(u, v)
                    a = c[3]
                    acc[0] += c[0] * a; acc[1] += c[1] * a; acc[2] += c[2] * a; acc[3] += a
            k = ss * ss
            a = acc[3] / k
            if a > 0:
                row.append((acc[0] / acc[3], acc[1] / acc[3], acc[2] / acc[3], a))
            else:
                row.append((0, 0, 0, 0))
        img.append(row)
    return img

def sample(u, v):
    # superellipse "squircle", margin 6%
    m = 0.06
    cx, cy, r = 0.5, 0.5, 0.5 - m
    nx, ny = abs(u - cx) / r, abs(v - cy) / r
    if nx ** 5 + ny ** 5 > 1:
        return (0, 0, 0, 0)
    # minimal graphite tile: soft vertical gradient
    top = (0.235, 0.243, 0.275)
    bot = (0.125, 0.130, 0.150)
    col = [top[i] * (1 - v) + bot[i] * v for i in range(3)]
    # thin rim: brighter on top, fading toward the bottom (glass edge)
    e = nx ** 5 + ny ** 5
    if e > 0.90:
        k = 0.16 * max(0.0, 1.0 - v * 1.4) + 0.03
        col = [min(1, c + k) for c in col]
    # glyph ">_" in white, centered, rounded strokes
    w = 0.042
    d1 = seg_dist(u, v, 0.33, 0.37, 0.47, 0.50)
    d2 = seg_dist(u, v, 0.47, 0.50, 0.33, 0.63)
    d3 = seg_dist(u, v, 0.53, 0.63, 0.67, 0.63)
    if min(d1, d2, d3) < w:
        col = [0.97, 0.97, 0.98]
    return (col[0], col[1], col[2], 1.0)

def png(img):
    n = len(img)
    raw = b"".join(b"\x00" + b"".join(bytes([int(p[0] * 255 + .5), int(p[1] * 255 + .5), int(p[2] * 255 + .5), int(p[3] * 255 + .5)]) for p in row) for row in img)
    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", n, n, 8, 6, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")

sizes = [256, 64, 48, 32, 16]
pngs = [png(render(s)) for s in sizes]
out = struct.pack("<HHH", 0, 1, len(sizes))
off = 6 + 16 * len(sizes)
for s, p in zip(sizes, pngs):
    out += struct.pack("<BBBBHHII", s % 256, s % 256, 0, 0, 1, 32, len(p), off)
    off += len(p)
out += b"".join(pngs)
here = os.path.dirname(os.path.abspath(__file__))
open(os.path.join(here, "icon.ico"), "wb").write(out)
open(os.path.join(here, "icon.png"), "wb").write(pngs[0])
print("ok")
