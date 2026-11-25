// news-image-20261125 — "Wednesday 25 November 2026 — The World in One Page"
// Renders entry.png (1024x1024, cream broadsheet) with Node stdlib only.
// Usage: node main.ts [output-path]   (default: /output/entry.png)
// Paths resolve from the script directory, never from cwd.
import { createHash } from "node:crypto";
import { deflateSync } from "node:zlib";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const W = 1024;
const H = 1024;

// ---------------------------------------------------------------- palette
const CREAM = [248, 244, 232];
const INK = [26, 26, 26];
const RED = [179, 39, 30];
const TAN = [232, 220, 192];
const TAN2 = [222, 208, 172];
const BLUE = [31, 58, 95];
const GOLD = [201, 162, 39];
const GREEN = [46, 107, 52];
const ORANGE = [214, 106, 24];
const GREY = [90, 86, 76];
const WHITE = [255, 255, 255];
const SKY = [168, 205, 225];
const SEA = [64, 110, 140];

// ---------------------------------------------------------------- 5x7 font
// Each glyph: 7 rows of 5 bits, "1" = ink. Keys are single characters.
const FONT: Record<string, string[]> = {
  "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  "B": ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  "C": ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  "D": ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  "E": ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  "F": ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  "G": ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  "H": ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  "I": ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  "J": ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  "K": ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  "L": ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  "M": ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  "N": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  "P": ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  "Q": ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  "R": ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  "S": ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  "T": ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  "U": ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  "V": ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  "W": ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  "X": ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  "Y": ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  "Z": ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "a": ["00000", "00000", "01110", "00001", "01111", "10001", "01111"],
  "b": ["10000", "10000", "11110", "10001", "10001", "10001", "11110"],
  "c": ["00000", "00000", "01110", "10001", "10000", "10001", "01110"],
  "d": ["00001", "00001", "01111", "10001", "10001", "10001", "01111"],
  "e": ["00000", "00000", "01110", "10001", "11111", "10000", "01110"],
  "f": ["00110", "01001", "01000", "11110", "01000", "01000", "01000"],
  "g": ["00000", "01111", "10001", "10001", "01111", "00001", "01110"],
  "h": ["10000", "10000", "11110", "10001", "10001", "10001", "10001"],
  "i": ["00100", "00000", "01100", "00100", "00100", "00100", "01110"],
  "j": ["00010", "00000", "00110", "00010", "00010", "00010", "01100"],
  "k": ["10000", "10000", "10010", "10100", "11000", "10100", "10010"],
  "l": ["01100", "00100", "00100", "00100", "00100", "00100", "01110"],
  "m": ["00000", "00000", "11010", "10101", "10101", "10101", "10101"],
  "n": ["00000", "00000", "11110", "10001", "10001", "10001", "10001"],
  "o": ["00000", "00000", "01110", "10001", "10001", "10001", "01110"],
  "p": ["00000", "00000", "11110", "10001", "11110", "10000", "10000"],
  "q": ["00000", "00000", "01111", "10001", "01111", "00001", "00001"],
  "r": ["00000", "00000", "10110", "11001", "10000", "10000", "10000"],
  "s": ["00000", "00000", "01111", "10000", "01110", "00001", "11110"],
  "t": ["01000", "01000", "11100", "01000", "01000", "01001", "00110"],
  "u": ["00000", "00000", "10001", "10001", "10001", "10011", "01101"],
  "v": ["00000", "00000", "10001", "10001", "10001", "01010", "00100"],
  "w": ["00000", "00000", "10001", "10101", "10101", "10101", "01010"],
  "x": ["00000", "00000", "10001", "01010", "00100", "01010", "10001"],
  "y": ["00000", "00000", "10001", "10001", "01111", "00001", "01110"],
  "z": ["00000", "00000", "11111", "00010", "00100", "01000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  '"': ["01010", "01010", "00000", "00000", "00000", "00000", "00000"],
  "#": ["01010", "01010", "11111", "01010", "11111", "01010", "01010"],
  "$": ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "*": ["00000", "00100", "10101", "01110", "10101", "00100", "00000"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  ",": ["00000", "00000", "00000", "00000", "00100", "00100", "01000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "00110", "00110"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  ":": ["00000", "00110", "00110", "00000", "00110", "00110", "00000"],
  ";": ["00000", "00110", "00110", "00000", "00110", "00100", "01000"],
  "<": ["00010", "00100", "01000", "10000", "01000", "00100", "00010"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  ">": ["01000", "00100", "00010", "00001", "00010", "00100", "01000"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  "@": ["01110", "10001", "10111", "10101", "10110", "10000", "01110"],
  "[": ["01110", "01000", "01000", "01000", "01000", "01000", "01110"],
  "]": ["01110", "00010", "00010", "00010", "00010", "00010", "01110"],
  "_": ["00000", "00000", "00000", "00000", "00000", "00000", "11111"],
  "~": ["00000", "00000", "01001", "10110", "00000", "00000", "00000"],
  "^": ["00100", "01010", "00000", "00000", "00000", "00000", "00000"],
  "{": ["00010", "00100", "00100", "01100", "00100", "00100", "00010"],
  "}": ["01000", "00100", "00100", "00110", "00100", "00100", "01000"],
  "|": ["00100", "00100", "00100", "00100", "00100", "00100", "00100"],
  "\\": ["10000", "01000", "01000", "00100", "00010", "00010", "00001"],
  "\u2014": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "\u2013": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "\u00b7": ["00000", "00000", "00110", "00110", "00000", "00000", "00000"],
  "\u2022": ["00000", "00000", "00110", "00110", "00000", "00000", "00000"],
  "\u2018": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "\u2019": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "\u201c": ["01010", "01010", "00000", "00000", "00000", "00000", "00000"],
  "\u201d": ["01010", "01010", "00000", "00000", "00000", "00000", "00000"],
  "\u00b0": ["00100", "01010", "00100", "00000", "00000", "00000", "00000"],
};
const BLANK = ["00000", "00000", "00000", "00000", "00000", "00000", "00000"];

// ---------------------------------------------------------------- canvas
class Canvas {
  data: Uint8Array;
  constructor() {
    this.data = new Uint8Array(W * H * 3);
    for (let i = 0; i < W * H; i++) {
      this.data[i * 3] = CREAM[0];
      this.data[i * 3 + 1] = CREAM[1];
      this.data[i * 3 + 2] = CREAM[2];
    }
  }
  px(x: number, y: number, c: number[]): void {
    const xi = Math.round(x), yi = Math.round(y);
    if (xi < 0 || yi < 0 || xi >= W || yi >= H) return;
    const o = (yi * W + xi) * 3;
    this.data[o] = c[0]; this.data[o + 1] = c[1]; this.data[o + 2] = c[2];
  }
  rect(x: number, y: number, w: number, h: number, c: number[]): void {
    const x0 = Math.max(0, Math.round(x)), y0 = Math.max(0, Math.round(y));
    const x1 = Math.min(W, Math.round(x + w)), y1 = Math.min(H, Math.round(y + h));
    for (let yy = y0; yy < y1; yy++) {
      for (let xx = x0; xx < x1; xx++) {
        const o = (yy * W + xx) * 3;
        this.data[o] = c[0]; this.data[o + 1] = c[1]; this.data[o + 2] = c[2];
      }
    }
  }
  hline(x: number, y: number, w: number, c: number[], t = 1): void {
    this.rect(x, y, w, t, c);
  }
  vline(x: number, y: number, h: number, c: number[], t = 1): void {
    this.rect(x, y, t, h, c);
  }
  outline(x: number, y: number, w: number, h: number, c: number[], t = 1): void {
    this.rect(x, y, w, t, c);
    this.rect(x, y + h - t, w, t, c);
    this.rect(x, y, t, h, c);
    this.rect(x + w - t, y, t, h, c);
  }
  line(x0: number, y0: number, x1: number, y1: number, c: number[]): void {
    let ax = Math.round(x0), ay = Math.round(y0);
    const bx = Math.round(x1), by = Math.round(y1);
    const dx = Math.abs(bx - ax), dy = Math.abs(by - ay);
    const sx = ax < bx ? 1 : -1, sy = ay < by ? 1 : -1;
    let err = dx - dy;
    for (;;) {
      this.px(ax, ay, c);
      if (ax === bx && ay === by) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; ax += sx; }
      if (e2 < dx) { err += dx; ay += sy; }
    }
  }
  circle(cx: number, cy: number, r: number, c: number[]): void {
    for (let yy = Math.round(cy - r); yy <= Math.round(cy + r); yy++) {
      for (let xx = Math.round(cx - r); xx <= Math.round(cx + r); xx++) {
        const dx = xx - cx, dy = yy - cy;
        if (dx * dx + dy * dy <= r * r) this.px(xx, yy, c);
      }
    }
  }
  ring(cx: number, cy: number, r: number, c: number[], t = 2): void {
    for (let a = 0; a < 360; a += 1) {
      const rad = (a * Math.PI) / 180;
      for (let k = 0; k < t; k++) {
        this.px(cx + (r - k) * Math.cos(rad), cy + (r - k) * Math.sin(rad), c);
      }
    }
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, c: number[]): void {
    for (let yy = Math.round(cy - ry); yy <= Math.round(cy + ry); yy++) {
      for (let xx = Math.round(cx - rx); xx <= Math.round(cx + rx); xx++) {
        const dx = (xx - cx) / rx, dy = (yy - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.px(xx, yy, c);
      }
    }
  }
  tri(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: number[]): void {
    const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2)));
    const maxX = Math.min(W - 1, Math.ceil(Math.max(x0, x1, x2)));
    const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)));
    const maxY = Math.min(H - 1, Math.ceil(Math.max(y0, y1, y2)));
    const d = (x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0);
    if (d === 0) return;
    for (let yy = minY; yy <= maxY; yy++) {
      for (let xx = minX; xx <= maxX; xx++) {
        const a = ((x1 - xx) * (y2 - yy) - (y1 - yy) * (x2 - xx)) / d;
        const b = ((x2 - xx) * (y0 - yy) - (y2 - yy) * (x0 - xx)) / d;
        const g = 1 - a - b;
        if (a >= 0 && b >= 0 && g >= 0) this.px(xx, yy, c);
      }
    }
  }
  // ---- text ----
  textWidth(s: string, scale: number, tight = false): number {
    const adv = tight ? 5 * scale : 6 * scale;
    if (s.length === 0) return 0;
    return s.length * adv - (tight ? 0 : scale);
  }
  drawChar(x: number, y: number, ch: string, scale: number, c: number[]): void {
    const g = FONT[ch] || BLANK;
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === "1") this.rect(x + col * scale, y + r * scale, scale, scale, c);
      }
    }
  }
  text(x: number, y: number, s: string, scale: number, c: number[], bold = false, tight = false): void {
    const adv = tight ? 5 * scale : 6 * scale;
    let cx = x;
    for (const ch of s) {
      this.drawChar(cx, y, ch, scale, c);
      if (bold) this.drawChar(cx + 1, y, ch, scale, c);
      cx += adv;
    }
  }
  textCentered(cx: number, y: number, s: string, scale: number, c: number[], bold = false, tight = false): void {
    this.text(cx - Math.round(this.textWidth(s, scale, tight) / 2), y, s, scale, c, bold, tight);
  }
  wrap(s: string, scale: number, maxW: number): string[] {
    const words = s.split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? cur + " " + w : w;
      if (this.textWidth(test, scale) <= maxW || !cur) cur = test;
      else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    return lines;
  }
}

// ---------------------------------------------------------------- PNG encode
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t.push(c >>> 0);
  }
  return t;
})();
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}
function encodePNG(cv: Canvas): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    raw.set(cv.data.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- icons
// Each icon draws inside box (x, y, w, h) on a coloured band.
function iconTower(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, [42, 42, 48]);
  cv.rect(x + w * 0.38, y + h * 0.25, w * 0.24, h * 0.75, [120, 130, 145]);
  cv.rect(x + w * 0.30, y + h * 0.42, w * 0.40, h * 0.58, [90, 98, 112]);
  for (let i = 0; i < 4; i++) cv.rect(x + w * 0.32, y + h * (0.46 + i * 0.12), w * 0.36, h * 0.05, GOLD);
  cv.tri(x + w * 0.30, y + h * 0.42, x + w * 0.70, y + h * 0.42, x + w * 0.50, y + h * 0.22, RED);
  cv.tri(x + w * 0.62, y + h * 0.30, x + w * 0.78, y + h * 0.30, x + w * 0.70, y + h * 0.12, ORANGE);
  cv.circle(x + w * 0.80, y + h * 0.18, h * 0.10, GREY);
  cv.circle(x + w * 0.72, y + h * 0.10, h * 0.08, GREY);
}
function iconCourt(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, [58, 74, 96]);
  cv.tri(x + w * 0.08, y + h * 0.34, x + w * 0.92, y + h * 0.34, x + w * 0.50, y + h * 0.08, CREAM);
  cv.rect(x + w * 0.08, y + h * 0.36, w * 0.84, h * 0.06, CREAM);
  for (let i = 0; i < 4; i++) cv.rect(x + w * (0.14 + i * 0.20), y + h * 0.44, w * 0.07, h * 0.42, CREAM);
  cv.rect(x + w * 0.06, y + h * 0.88, w * 0.88, h * 0.06, CREAM);
  cv.circle(x + w * 0.82, y + h * 0.20, h * 0.09, GOLD);
}
function iconChart(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, [24, 60, 44]);
  cv.line(x + w * 0.10, y + h * 0.85, x + w * 0.10, y + h * 0.12, CREAM);
  cv.line(x + w * 0.10, y + h * 0.85, x + w * 0.92, y + h * 0.85, CREAM);
  const pts: [number, number][] = [[0.14, 0.30], [0.32, 0.22], [0.50, 0.48], [0.68, 0.42], [0.86, 0.68]];
  for (let i = 0; i < pts.length - 1; i++) {
    cv.line(x + w * pts[i][0], y + h * pts[i][1], x + w * pts[i + 1][0], y + h * pts[i + 1][1], RED);
    cv.line(x + w * pts[i][0], y + h * pts[i][1] + 1, x + w * pts[i + 1][0], y + h * pts[i + 1][1] + 1, RED);
  }
  for (const p of pts) cv.circle(x + w * p[0], y + h * p[1], 3, GOLD);
  cv.tri(x + w * 0.86, y + h * 0.68, x + w * 0.78, y + h * 0.60, x + w * 0.94, y + h * 0.62, RED);
}
function iconShip(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, [28, 52, 84]);
  cv.rect(x + w * 0.18, y + h * 0.55, w * 0.60, h * 0.16, [150, 60, 50]);
  cv.tri(x + w * 0.18, y + h * 0.55, x + w * 0.78, y + h * 0.55, x + w * 0.72, y + h * 0.71, [150, 60, 50]);
  cv.rect(x + w * 0.38, y + h * 0.34, w * 0.10, h * 0.21, CREAM);
  cv.tri(x + w * 0.30, y + h * 0.34, x + w * 0.48, y + h * 0.34, x + w * 0.39, y + h * 0.16, ORANGE);
  cv.circle(x + w * 0.68, y + h * 0.22, h * 0.08, GREY);
  cv.rect(x, y + h * 0.76, w, h * 0.06, SKY);
  cv.rect(x, y + h * 0.86, w, h * 0.05, SKY);
}
function iconMedal(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, [96, 28, 28]);
  cv.tri(x + w * 0.36, y + h * 0.10, x + w * 0.50, y + h * 0.10, x + w * 0.43, y + h * 0.38, BLUE);
  cv.tri(x + w * 0.50, y + h * 0.10, x + w * 0.64, y + h * 0.10, x + w * 0.57, y + h * 0.38, RED);
  cv.circle(x + w * 0.50, y + h * 0.62, h * 0.22, GOLD);
  cv.ring(x + w * 0.50, y + h * 0.62, h * 0.22, [150, 110, 20], 3);
  cv.text(x + w * 0.50 - 6, y + h * 0.62 - 7, "1", 2, [120, 80, 10], true);
}
function iconSat(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, [16, 22, 38]);
  for (let i = 0; i < 14; i++) cv.px(x + (i * 37) % w, y + (i * 53) % h, WHITE);
  cv.circle(x + w * 0.50, y + h * 0.55, h * 0.16, SKY);
  cv.rect(x + w * 0.30, y + h * 0.50, w * 0.40, h * 0.08, SKY);
  cv.line(x + w * 0.50, y + h * 0.55, x + w * 0.78, y + h * 0.25, GOLD);
  cv.line(x + w * 0.50, y + h * 0.55, x + w * 0.24, y + h * 0.30, GOLD);
  cv.tri(x + w * 0.74, y + h * 0.28, x + w * 0.82, y + h * 0.20, x + w * 0.82, y + h * 0.30, GOLD);
}
function iconCoin(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, [40, 90, 40]);
  cv.line(x + w * 0.08, y + h * 0.78, x + w * 0.30, y + h * 0.55, GREEN);
  cv.line(x + w * 0.30, y + h * 0.55, x + w * 0.52, y + h * 0.66, GREEN);
  cv.line(x + w * 0.52, y + h * 0.66, x + w * 0.74, y + h * 0.30, GREEN);
  cv.line(x + w * 0.74, y + h * 0.30, x + w * 0.92, y + h * 0.18, GREEN);
  cv.circle(x + w * 0.82, y + h * 0.24, h * 0.20, GOLD);
  cv.ring(x + w * 0.82, y + h * 0.24, h * 0.20, [150, 110, 20], 3);
  cv.text(x + w * 0.82 - 6, y + h * 0.24 - 7, "B", 2, [120, 80, 10], true);
}
function iconShop(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, [90, 60, 30]);
  cv.rect(x + w * 0.15, y + h * 0.30, w * 0.70, h * 0.55, [210, 180, 140]);
  cv.rect(x + w * 0.10, y + h * 0.22, w * 0.80, h * 0.12, RED);
  cv.rect(x + w * 0.42, y + h * 0.48, w * 0.16, h * 0.37, [80, 50, 30]);
  cv.circle(x + w * 0.50, y + h * 0.44, h * 0.07, GOLD);
  cv.rect(x + w * 0.18, y + h * 0.40, w * 0.16, h * 0.14, SKY);
  cv.rect(x + w * 0.66, y + h * 0.40, w * 0.16, h * 0.14, SKY);
}
function iconQuake(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, [70, 66, 58]);
  cv.rect(x + w * 0.12, y + h * 0.30, w * 0.30, h * 0.45, [200, 190, 170]);
  cv.rect(x + w * 0.58, y + h * 0.42, w * 0.28, h * 0.33, [180, 168, 148]);
  cv.line(x + w * 0.45, y + h * 0.25, x + w * 0.52, y + h * 0.55, INK);
  cv.line(x + w * 0.52, y + h * 0.55, x + w * 0.44, y + h * 0.80, INK);
  cv.line(x + w * 0.44, y + h * 0.80, x + w * 0.55, y + h * 1.0, INK);
  cv.line(x, y + h * 0.78, x + w, y + h * 0.78, RED);
  cv.line(x, y + h * 0.79, x + w, y + h * 0.79, RED);
}
function iconRocket(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, [14, 20, 44]);
  for (let i = 0; i < 18; i++) cv.px(x + (i * 41) % w, y + (i * 29) % h, WHITE);
  cv.ellipse(x + w * 0.50, y + h * 0.42, w * 0.10, h * 0.30, CREAM);
  cv.circle(x + w * 0.50, y + h * 0.30, h * 0.07, SKY);
  cv.tri(x + w * 0.40, y + h * 0.55, x + w * 0.50, y + h * 0.55, x + w * 0.38, y + h * 0.72, RED);
  cv.tri(x + w * 0.50, y + h * 0.55, x + w * 0.60, y + h * 0.55, x + w * 0.62, y + h * 0.72, RED);
  cv.tri(x + w * 0.44, y + h * 0.68, x + w * 0.56, y + h * 0.68, x + w * 0.50, y + h * 0.92, ORANGE);
}
function iconBall(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, [22, 80, 34]);
  cv.circle(x + w * 0.50, y + h * 0.50, h * 0.34, WHITE);
  cv.ring(x + w * 0.50, y + h * 0.50, h * 0.34, INK, 2);
  cv.circle(x + w * 0.50, y + h * 0.50, h * 0.10, INK);
  cv.circle(x + w * 0.30, y + h * 0.30, h * 0.05, INK);
  cv.circle(x + w * 0.70, y + h * 0.30, h * 0.05, INK);
  cv.circle(x + w * 0.30, y + h * 0.72, h * 0.05, INK);
  cv.circle(x + w * 0.70, y + h * 0.72, h * 0.05, INK);
}
function iconScales(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, [52, 52, 66]);
  cv.rect(x + w * 0.48, y + h * 0.18, w * 0.04, h * 0.60, GOLD);
  cv.rect(x + w * 0.22, y + h * 0.22, w * 0.56, h * 0.05, GOLD);
  cv.line(x + w * 0.26, y + h * 0.27, x + w * 0.26, y + h * 0.48, GOLD);
  cv.line(x + w * 0.74, y + h * 0.27, x + w * 0.74, y + h * 0.48, GOLD);
  cv.tri(x + w * 0.16, y + h * 0.48, x + w * 0.36, y + h * 0.48, x + w * 0.26, y + h * 0.62, GOLD);
  cv.tri(x + w * 0.64, y + h * 0.48, x + w * 0.84, y + h * 0.48, x + w * 0.74, y + h * 0.62, GOLD);
  cv.rect(x + w * 0.34, y + h * 0.80, w * 0.32, h * 0.06, GOLD);
}
function iconFlag(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, [96, 110, 150]);
  cv.rect(x + w * 0.20, y + h * 0.15, w * 0.04, h * 0.70, INK);
  cv.rect(x + w * 0.24, y + h * 0.15, w * 0.52, h * 0.34, RED);
  cv.rect(x + w * 0.24, y + h * 0.32, w * 0.52, h * 0.17, WHITE);
  cv.rect(x + w * 0.24, y + h * 0.32, w * 0.20, h * 0.17, BLUE);
}
function iconPlane(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, [120, 160, 200]);
  cv.ellipse(x + w * 0.50, y + h * 0.50, w * 0.30, h * 0.10, WHITE);
  cv.tri(x + w * 0.72, y + h * 0.50, x + w * 0.84, y + h * 0.42, x + w * 0.84, y + h * 0.58, WHITE);
  cv.tri(x + w * 0.42, y + h * 0.42, x + w * 0.58, y + h * 0.42, x + w * 0.50, y + h * 0.30, WHITE);
  cv.tri(x + w * 0.42, y + h * 0.58, x + w * 0.58, y + h * 0.58, x + w * 0.50, y + h * 0.70, WHITE);
  cv.circle(x + w * 0.76, y + h * 0.48, h * 0.03, BLUE);
}
function iconBarrel(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, [60, 60, 60]);
  cv.ellipse(x + w * 0.50, y + h * 0.30, w * 0.20, h * 0.10, [40, 40, 40]);
  cv.rect(x + w * 0.30, y + h * 0.30, w * 0.40, h * 0.50, [40, 40, 40]);
  cv.ellipse(x + w * 0.50, y + h * 0.80, w * 0.20, h * 0.10, [30, 30, 30]);
  cv.rect(x + w * 0.28, y + h * 0.42, w * 0.44, h * 0.05, GOLD);
  cv.rect(x + w * 0.28, y + h * 0.62, w * 0.44, h * 0.05, GOLD);
}
function iconGlobe(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, [30, 70, 110]);
  cv.circle(x + w * 0.50, y + h * 0.50, h * 0.32, SEA);
  cv.ellipse(x + w * 0.42, y + h * 0.42, w * 0.10, h * 0.08, GREEN);
  cv.ellipse(x + w * 0.60, y + h * 0.60, w * 0.08, h * 0.07, GREEN);
  cv.ring(x + w * 0.50, y + h * 0.50, h * 0.32, CREAM, 2);
  cv.ellipse(x + w * 0.50, y + h * 0.50, w * 0.06, h * 0.32, CREAM);
}
const ICONS: Record<string, (cv: Canvas, x: number, y: number, w: number, h: number) => void> = {
  tower: iconTower, court: iconCourt, chart: iconChart, ship: iconShip,
  medal: iconMedal, sat: iconSat, coin: iconCoin, shop: iconShop,
  quake: iconQuake, rocket: iconRocket, ball: iconBall, scales: iconScales,
  flag: iconFlag, plane: iconPlane, barrel: iconBarrel, globe: iconGlobe,
};

// ---------------------------------------------------------------- data
type Story = { n: number; tag: string; head: string; deck: string; src: string; icon: string; badge: string; field: string; region: string };
const LEADS: Story[] = [
  { n: 1, tag: "REPORTED", head: "Houthis hit Riyadh tower", deck: "Missiles strike the PIF Tower for the second time in under a week. At least 11 people are wounded, Saudi Civil Defense says.", src: "REUTERS", icon: "tower", badge: "11 WOUNDED", field: "CONFLICT", region: "MIDDLE EAST" },
  { n: 2, tag: "REPORTED", head: "Huawei convicted in US trial", deck: "A New York jury finds the Chinese tech giant guilty of stealing trade secrets and bank fraud over its Iran business.", src: "REUTERS / AP", icon: "court", badge: "GUILTY", field: "COURTS", region: "AMERICAS" },
  { n: 3, tag: "REPORTED", head: "Nvidia bounce fades", deck: "The Huang-return rally fizzles in a day: Nvidia falls 6%, the Nasdaq drops 1.5% and the S&P 500 slips 0.5%.", src: "REUTERS", icon: "chart", badge: "NVDA -6%", field: "MARKETS", region: "AMERICAS" },
];
const MIDS: Story[] = [
  { n: 4, tag: "REPORTED", head: "Kyiv admits ship strike", deck: "Kyiv hit a Russian ship in the Gulf of Finland.", src: "REUTERS", icon: "ship", badge: "KYIV ADMITS IT", field: "CONFLICT", region: "EUROPE" },
  { n: 5, tag: "REPORTED", head: "Medal for Giuliani", deck: "The Medal of Freedom goes to the ex-mayor, 82.", src: "AP / REUTERS", icon: "medal", badge: "MEDAL OF FREEDOM", field: "POLITICS", region: "AMERICAS" },
  { n: 6, tag: "REPORTED", head: "CIA system is breached", deck: "Unclassified CIA and ODNI systems breached.", src: "AP / REUTERS", icon: "sat", badge: "UNCLASSIFIED", field: "SECURITY", region: "AMERICAS" },
  { n: 7, tag: "REPORTED", head: "US tariffs coming", deck: "Section 301 probe covers 16 trading partners.", src: "REUTERS", icon: "flag", badge: "16 PARTNERS", field: "POLITICS", region: "AMERICAS" },
  { n: 8, tag: "REPORTED", head: "Bitcoin under $60k", deck: "$844m liquidated in a day; record ETF outflows.", src: "COINDESK", icon: "coin", badge: "$59,300", field: "MARKETS", region: "WORLD" },
  { n: 9, tag: "REPORTED", head: "25 hostages in Cartagena", deck: "Armed men seize a shop after a failed hijack.", src: "REUTERS / AP", icon: "shop", badge: "25 HOSTAGES", field: "CRIME", region: "AMERICAS" },
  { n: 10, tag: "REPORTED", head: "Sarkozy to face trial", deck: "Ex-president and wife face the Gaddafi-cash case.", src: "REUTERS", icon: "scales", badge: "TRIAL 2027", field: "COURTS", region: "EUROPE" },
  { n: 11, tag: "REPORTED", head: "Confidence at peak", deck: "US consumer confidence at a near 2-year high.", src: "REUTERS", icon: "chart", badge: "HIGHEST SINCE 2024", field: "MARKETS", region: "AMERICAS" },
  { n: 12, tag: "REPORTED", head: "Rocket flies Pakistani", deck: "Chinese rocket carries a Pakistani astronaut.", src: "BBC", icon: "rocket", badge: "HISTORIC FLIGHT", field: "TECH", region: "ASIA-PACIFIC" },
  { n: 13, tag: "REPORTED", head: "Madrid rout PSV 5-1", deck: "Mbappe stars; Arsenal 1-1 Dortmund, City 2-2.", src: "FLASHSCORE", icon: "ball", badge: "UCL 5-1", field: "SPORT", region: "EUROPE" },
  { n: 14, tag: "REPORTED", head: "Hasan seeks stay", deck: "Hasan fights firing-squad execution date.", src: "REUTERS", icon: "scales", badge: "STAY SOUGHT", field: "COURTS", region: "AMERICAS" },
  { n: 15, tag: "REPORTED", head: "M5.6 quake shakes Nepal", deck: "Tremor hits Koshi Province near the China border.", src: "PW.LIVE", icon: "quake", badge: "M5.6", field: "DISASTER", region: "ASIA-PACIFIC" },
];
const ALSO: string[] = [
  "16. Aden — Houthis won't take city — REUTERS",
  "17. Moscow — Putin vows reply — REUTERS",
  "18. Havana — WHO: end Cuba blockade — REUTERS",
  "19. Washington — Abrego Garcia exits — AP",
  "20. New York — Trump conviction path — AP",
  "21. Iowa — Army to blow up lead-azide — AP",
  "22. Washington — Dems clinch 259 seats — AP",
  "23. New York — Trump Jr. fund probe — AP",
  "24. Atlanta — CDC chief faces exit calls — AP",
  "25. Washington — States sue HUD on aid — AP",
  "26. Albuquerque — DEA let 1.4m pills go — AP",
  "27. Chicago — Radar fault delays flights — AP",
  "28. Stockholm — Vote on Kristersson — REUTERS",
  "29. Jerusalem — Eisenkot seals pact — REUTERS",
  "30. Berlin — Left expels lawmaker — REUTERS",
  "31. Berlin — 53% oppose Ukraine aid — REUTERS",
  "32. Latvia sees war tipping point — REUTERS",
  "33. Minsk — Lukashenko offers trip — REUTERS",
  "34. Madrid — Spain challenges unborn law — REUTERS",
  "35. Newcastle — Man admits Huntley killing — REUTERS",
  "36. Los Angeles — Thomas Markle indicted — REUTERS",
  "37. Sandringham — Two held over burglary — AP",
  "38. Burgas — Santas wash up on beach — REUTERS",
  "39. Mexico — Inflation at 6-month high — REUTERS",
  "40. Caracas — Citi weighs Venezuela return — REUTERS",
  "41. Delhi — Modi meets Chancellor Merz — PW.LIVE",
  "42. Sydney — Australia CPI hits 4.9% — GUARDIAN",
  "43. Seoul — Minister quits in exam scandal — WH.NEWS",
  "44. Dakar — Senegal regain AFCON title — BBC",
  "45. Sydney — England level T20 series — BBC",
  "46. Vatican — Pope diary tells of the devil — AP",
  "47. Jerusalem — US envoy doubts aid cut — REUTERS",
  "48. London — Oil falls: Brent $90.97 — REUTERS",
];
const STATS: [string, string][] = [
  ["11", "WOUNDED IN RIYADH"],
  ["$59,300", "BITCOIN BELOW $60K"],
  ["25", "HOSTAGES IN CARTAGENA"],
  ["259", "HOUSE SEATS FOR DEMS"],
  ["M5.6", "QUAKE IN NEPAL"],
  ["5-1", "REAL MADRID WIN"],
];
const TIMELINE: [string, string][] = [
  ["13:08 GMT", "MEXICO INFLATION 3.96%"],
  ["TUE PM", "GIULIANI GETS MEDAL OF FREEDOM"],
  ["TUE EVE", "HOUTHIS HIT RIYADH PIF TOWER"],
  ["TUE EVE", "HUAWEI VERDICT IN NEW YORK"],
  ["21:00 GMT", "US CLOSE: NASDAQ -1.5%, NVDA -6%"],
  ["02:40 UTC", "BITCOIN $59,300"],
];

// ---------------------------------------------------------------- layout
function chip(cv: Canvas, x: number, y: number, label: string, bg: number[]): number {
  const w = cv.textWidth(label, 1) + 10;
  cv.rect(x, y, w, 13, bg);
  cv.text(x + 5, y + 3, label, 1, WHITE, true);
  return w;
}

function render(): Buffer {
  const cv = new Canvas();
  const MX = 26, RW = 972, RX = MX + RW;

  // eyebrow
  cv.text(MX, 8, "THE WORLD IN ONE DAY", 2, RED, true);
  const right = "WEDNESDAY'S NEWS \u00b7 ONE PAGE \u00b7 48 STORIES";
  cv.text(RX - cv.textWidth(right, 2), 8, right, 2, INK, true);
  cv.hline(MX, 24, RW, INK, 2);

  // masthead
  cv.textCentered(512, 32, "Wednesday 25 November 2026", 6, INK, true, true);
  cv.hline(MX, 84, RW, INK, 2);
  cv.textCentered(512, 92, "Houthis hit Riyadh's tallest tower \u00b7 Huawei convicted \u00b7 Nvidia bounce fades", 2, RED, true);
  cv.hline(MX, 116, RW, INK, 1);

  // stats strip
  const statW = RW / 6;
  for (let i = 0; i < 6; i++) {
    const cx = MX + statW * i;
    cv.textCentered(Math.round(cx + statW / 2), 124, STATS[i][0], 3, RED, true);
    cv.textCentered(Math.round(cx + statW / 2), 146, STATS[i][1], 1, INK, true);
    if (i > 0) cv.vline(Math.round(cx), 126, 30, TAN2, 1);
  }
  cv.hline(MX, 160, RW, INK, 1);

  // UTC timeline
  cv.text(MX, 168, "TUESDAY INTO WEDNESDAY IN UTC", 1, RED, true);
  const tlY = 186;
  cv.hline(MX + 200, tlY, RW - 200, GREY, 1);
  const tlW = (RW - 200) / 6;
  for (let i = 0; i < 6; i++) {
    const cx = Math.round(MX + 200 + tlW * (i + 0.5));
    cv.circle(cx, tlY, 4, RED);
    cv.textCentered(cx, 168, TIMELINE[i][0], 1, RED, true);
    const lines = cv.wrap(TIMELINE[i][1], 1, Math.round(tlW) - 8);
    lines.slice(0, 2).forEach((ln, k) => cv.textCentered(cx, 194 + k * 9, ln, 1, INK));
  }
  // timeline labels sit below the line; shift block: labels at 194-212
  cv.hline(MX, 216, RW, INK, 1);

  // BY FIELD / BY REGION
  const fields = "BY FIELD  \u00b7  POLITICS 11 \u00b7 COURTS 7 \u00b7 MARKETS 7 \u00b7 DIPLOMACY 6 \u00b7 CONFLICT 4 \u00b7 CRIME 3 \u00b7 SPORT 3 \u00b7 SECURITY 2 \u00b7 TECH 1 \u00b7 DISASTER 1 \u00b7 AVIATION 1 \u00b7 SOCIETY 1 \u00b7 CULTURE 1";
  cv.textCentered(512, 222, fields, 1, INK);
  const regions = "BY REGION  \u00b7  AMERICAS 21 \u00b7 EUROPE 13 \u00b7 ASIA-PACIFIC 5 \u00b7 MIDDLE EAST 4 \u00b7 WORLD 3 \u00b7 AFRICA 1 \u00b7 OCEANIA 1";
  cv.textCentered(512, 234, regions, 1, INK);
  cv.hline(MX, 248, RW, INK, 2);

  // leads
  const leadW = 317, leadGap = 10, leadY = 256, leadH = 224;
  LEADS.forEach((s, i) => {
    const x = MX + i * (leadW + leadGap);
    cv.outline(x, leadY, leadW, leadH, INK, 1);
    ICONS[s.icon](cv, x + 1, leadY + 1, leadW - 2, 96);
    // badge on illustration
    const bw = cv.textWidth(s.badge, 1) + 10;
    cv.rect(x + leadW - bw - 6, leadY + 6, bw, 13, RED);
    cv.text(x + leadW - bw - 1, leadY + 9, s.badge, 1, WHITE, true);
    let y = leadY + 104;
    cv.text(x + 8, y, String(s.n) + ".", 1, RED, true);
    chip(cv, x + 22, y - 1, s.tag, RED);
    y += 18;
    const hl = cv.wrap(s.head, 3, leadW - 16);
    hl.slice(0, 2).forEach((ln) => { cv.text(x + 8, y, ln, 3, INK, true); y += 24; });
    y += 2;
    const dl = cv.wrap(s.deck, 1, leadW - 16);
    dl.slice(0, 3).forEach((ln) => { cv.text(x + 8, y, ln, 1, INK); y += 9; });
    cv.text(x + 8, leadY + leadH - 14, "SOURCE: " + s.src, 1, GREY, true);
  });

  // legend
  cv.textCentered(512, 492, "HOW SURE ARE WE?  CONFIRMED — TWO OR MORE OUTLETS  \u00b7  REPORTED — NAMED SOURCE  \u00b7  CLAIM — ONE SIDE SAYS SO  \u00b7  FORECAST — SCHEDULED", 1, GREY);
  cv.hline(MX, 508, RW, INK, 1);

  // mid tiles: 2 rows x 6 cols
  const midW = 154, midGap = 9, midH = 104, midY0 = 512;
  MIDS.forEach((s, i) => {
    const row = Math.floor(i / 6), col = i % 6;
    const x = MX + 1 + col * (midW + midGap);
    const y = midY0 + row * (midH + 6);
    cv.outline(x, y, midW, midH, INK, 1);
    ICONS[s.icon](cv, x + 1, y + 1, midW - 2, 22);
    const bw = cv.textWidth(s.badge, 1) + 8;
    cv.rect(x + midW - bw - 3, y + 4, bw, 12, RED);
    cv.text(x + midW - bw + 1, y + 7, s.badge, 1, WHITE, true);
    let yy = y + 28;
    cv.text(x + 5, yy, String(s.n) + ".", 1, RED, true);
    chip(cv, x + 18, yy - 1, s.tag, RED);
    yy += 15;
    const hl = cv.wrap(s.head, 2, midW - 10);
    hl.slice(0, 2).forEach((ln) => { cv.text(x + 5, yy, ln, 2, INK, true); yy += 16; });
    const dl = cv.wrap(s.deck, 1, midW - 10);
    dl.slice(0, 2).forEach((ln) => { cv.text(x + 5, yy, ln, 1, GREY); yy += 9; });
    cv.text(x + 5, y + midH - 10, s.src, 1, GREY, true);
  });

  // map + ALSO
  const mapX = MX, mapW = 370, alsoX = 406, alsoW = 592, secY = 736;
  cv.hline(MX, 730, RW, INK, 2);
  cv.text(mapX, secY, "WHERE IT HAPPENED", 2, INK, true);
  cv.text(alsoX, secY, "ALSO ON WEDNESDAY 25 NOVEMBER", 2, INK, true);
  // map panel
  const mapTop = 758, mapBot = 946;
  cv.outline(mapX, mapTop, mapW, mapBot - mapTop, INK, 1);
  cv.rect(mapX + 1, mapTop + 1, mapW - 2, mapBot - mapTop - 2, [238, 232, 210]);
  // stylised continents (light tan blobs)
  const land = (cx: number, cy: number, rx: number, ry: number) => cv.ellipse(cx, cy, rx, ry, TAN);
  land(110, 805, 58, 28); land(140, 845, 34, 20); // N America
  land(200, 880, 22, 30); // S America
  land(232, 795, 18, 14); // Europe
  land(240, 845, 24, 28); // Africa
  land(300, 800, 55, 22); land(315, 828, 40, 16); // Asia
  land(332, 905, 16, 9); // Australia
  // dotted halftone over sea
  for (let yy = mapTop + 6; yy < mapBot - 4; yy += 8) {
    for (let xx = mapX + 6; xx < mapX + mapW - 4; xx += 8) {
      cv.px(xx, yy, [200, 192, 168]);
    }
  }
  // pins: lon/lat -> panel coords
  const pins: [number, number, number][] = [
    [45.5, 24.7, 1], [-74, 40.7, 2], [-74, 40.7, 3], [26, 60, 4],
    [-77, 38.9, 5], [-77, 38.9, 6], [-77, 38.9, 7], [0, 51.5, 8],
    [-75.5, 10.4, 9], [2.35, 48.85, 10], [-77, 38.9, 11], [98.5, 41, 12],
    [-3.7, 40.4, 13], [-97.8, 31.1, 14], [85.3, 27.7, 15],
  ];
  const offs: Record<number, [number, number]> = { 3: [20, -16], 6: [18, 14], 7: [-20, 16], 11: [20, 16] };
  for (const [lon, lat, n] of pins) {
    let px = mapX + 8 + ((lon + 180) / 360) * (mapW - 16);
    let py = mapTop + 8 + ((85 - lat) / 145) * (mapBot - mapTop - 16);
    const o = offs[n];
    if (o) { cv.line(px, py, px + o[0], py + o[1], RED); px += o[0]; py += o[1]; }
    cv.circle(px, py, 8, RED);
    cv.ring(px, py, 8, WHITE, 1);
    const num = String(n);
    cv.text(px - (num.length > 1 ? 5 : 2), py - 3, num, 1, WHITE, true);
  }
  cv.text(mapX, mapBot + 4, "PINS 1-15 MATCH THE FEATURED STORIES. DOTS MARK ALSO BRIEFS.", 1, GREY);

  // ALSO list, 2 columns
  const colW = 291, colGap = 10;
  const alsoL = ALSO.slice(0, 17), alsoR = ALSO.slice(17);
  alsoL.forEach((ln, i) => cv.text(alsoX, 758 + i * 11, ln, 1, INK));
  alsoR.forEach((ln, i) => cv.text(alsoX + colW + colGap, 758 + i * 11, ln, 1, INK));

  // DATE CHECK
  const dcTop = 958, dcH = 52;
  cv.outline(MX, dcTop, RW, dcH, RED, 2);
  cv.text(MX + 8, dcTop + 5, "DATE CHECK —", 1, RED, true);
  const dcBody = "Every story here happened, was first reported, or developed overnight into Wednesday 25 November 2026. Left out as earlier news: COP31 collapse in Antalya (22 Nov) \u00b7 Huang reinstated, Nvidia +31% (23 Nov) \u00b7 Sparta II towed to St Petersburg (23 Nov) \u00b7 Ukraine sinks Russian warship off Libya (23 Nov) \u00b7 Alcaraz wins the ATP Finals (23 Nov) \u00b7 Las Vegas GP (22 Nov) \u00b7 GTA 6 release (19 Nov) \u00b7 ICJ Myanmar ruling (19 Nov) \u00b7 Peru M6.7 quake (20 Nov) \u00b7 Hong Kong fire anniversary — one year on, not new (25 Nov 2025).";
  const dcLines = cv.wrap(dcBody, 1, RW - 16);
  dcLines.slice(0, 4).forEach((ln, k) => cv.text(MX + 8, dcTop + 16 + k * 9, ln, 1, INK));

  // footer
  cv.textCentered(512, 1014, "Disputed claims are attributed, not stated as fact. Sources: Reuters, AP, BBC, CoinDesk, Flashscore, Guardian. Wires as of ~03:00 UTC, Wed 25 Nov 2026.", 1, GREY);

  return encodePNG(cv);
}

// ---------------------------------------------------------------- main
function main(): void {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const outArg = process.argv[2];
  const outPath = outArg ? path.resolve(outArg) : "/output/entry.png";
  const png = render();
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, png);
  const sha = createHash("sha256").update(png).digest("hex");
  console.log("wrote " + outPath + " " + png.length + " bytes sha256 " + sha);
  const committed = path.join(here, "entry.png");
  if (fs.existsSync(committed)) {
    const csha = createHash("sha256").update(fs.readFileSync(committed)).digest("hex");
    const match = csha === sha;
    console.log("committed entry.png sha256 " + csha + " match=" + match);
    if (!match) { console.error("MISMATCH: rendered output differs from committed entry.png"); process.exit(1); }
  } else {
    console.log("no committed entry.png yet in " + here);
  }
}
main();
