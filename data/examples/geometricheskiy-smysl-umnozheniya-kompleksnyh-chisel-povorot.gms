[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
show axes = true; show grid = true;
string info = "";
float p1x = 99; float p1y = 99; float p2x = 99; float p2y = 99;
float rz = 2; float rp = 3;

new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "one"; pos = (1, 0); text = true("1"); dynamic = false; collision = false }
new Point { name = "z"; pos = (2, 1); text = true("z"); pauseOnDrag = false; collideWithPoints = false; color = #3b82f6 }
new Point { name = "w"; pos = (0.8, 1.2); text = true("w"); pauseOnDrag = false; collideWithPoints = false; color = #f59e0b }
new Point { name = "p"; pos = (0.4, 2.8); text = true("zw"); dynamic = false; collision = false; color = #22c55e }
new Line { name = "oz"; pos = (O, z); interact = false; color = #3b82f6; thickness = 3 }
new Line { name = "ow"; pos = (O, w); interact = false; color = #f59e0b; thickness = 3 }
new Line { name = "op"; pos = (O, p); interact = false; color = #22c55e; thickness = 3 }
new Line { name = "w1"; pos = (one, w); interact = false; color = #f59e0b }
new Line { name = "zp"; pos = (z, p); interact = false; color = #22c55e }
new Circle { name = "cz"; center = O; radius = rz; interact = false; color = #3b82f6 }
new Circle { name = "cp"; center = O; radius = rp; interact = false; color = #22c55e }

Function num(v) { if (v < 0) { return "−" + format(-v, 1); } return format(v, 1); }
Function num2(v) { if (v < 0) { return "−" + format(-v, 2); } return format(v, 2); }
Function term(v) { if (v < 0) { return " − " + format(-v, 1); } return " + " + format(v, 1); }
Function cx(a, b) { return num(a) + term(b) + "i"; }
Function deg(a, b) { return atan2(b, a) * 57.29578; }

Update {
  float R = min(fieldMaxX, fieldMaxY);
  float r1 = hypot(z.pos.x, z.pos.y); float r2 = hypot(w.pos.x, w.pos.y);
  // не даём числам стать нулём: у нуля нет направления
  if (r1 < 0.4) { if (r1 < 0.0001) { z.pos.x = 0.4; } else { z.pos.x = z.pos.x * 0.4 / r1; z.pos.y = z.pos.y * 0.4 / r1; } }
  if (r2 < 0.4) { if (r2 < 0.0001) { w.pos.x = 0.4; } else { w.pos.x = w.pos.x * 0.4 / r2; w.pos.y = w.pos.y * 0.4 / r2; } }
  r1 = hypot(z.pos.x, z.pos.y); r2 = hypot(w.pos.x, w.pos.y);
  // модуль произведения не должен выходить за поле: сдвинутая точка сжимается к началу координат
  if (r1 * r2 > R) {
    float m1 = abs(z.pos.x - p1x) + abs(z.pos.y - p1y);
    float m2 = abs(w.pos.x - p2x) + abs(w.pos.y - p2y);
    float k = R / (r1 * r2);
    if (m1 >= m2) { z.pos.x = z.pos.x * k; z.pos.y = z.pos.y * k; }
    else { w.pos.x = w.pos.x * k; w.pos.y = w.pos.y * k; }
  }
  if (abs(z.pos.x - p1x) > 0.00001 || abs(z.pos.y - p1y) > 0.00001 || abs(w.pos.x - p2x) > 0.00001 || abs(w.pos.y - p2y) > 0.00001) {
    p1x = z.pos.x; p1y = z.pos.y; p2x = w.pos.x; p2y = w.pos.y;
    p.pos.x = p1x * p2x - p1y * p2y; p.pos.y = p1x * p2y + p1y * p2x;
    rz = hypot(p1x, p1y); rp = hypot(p.pos.x, p.pos.y);
  }
  float a = p1x; float b = p1y; float c = p2x; float d = p2y;
  float re = a * c - b * d; float im = a * d + b * c;
  float rw = hypot(c, d);
  info = "**Умножение на w** — это поворот радиус-вектора z вокруг начала координат на угол arg w и растяжение относительно него в |w| раз. Треугольники O·1·w и O·z·zw подобны: единица переходит в w, а z — в zw.\n\n";
  info = info + "z = " + cx(a, b) + ", w = " + cx(c, d) + ", zw = " + cx(re, im) + ".\n\n";
  info = info + "Угол поворота arg w = " + num(deg(c, d)) + "°: arg z + arg w = " + num(deg(a, b)) + "° + " + num(deg(c, d)) + "° ≡ " + num(deg(re, im)) + "° = arg zw (mod 360°).\n\n";
  string kind = "растяжение";
  if (rw < 0.995) { kind = "сжатие"; }
  if (abs(rw - 1) <= 0.005) { kind = "длина не меняется — чистый поворот"; }
  info = info + "Коэффициент растяжения |w| = " + format(rw, 2) + " (" + kind + "): |zw| = |z|·|w| = " + format(hypot(a, b), 2) + "·" + format(rw, 2) + " = " + format(hypot(re, im), 2) + ".";
}
]
