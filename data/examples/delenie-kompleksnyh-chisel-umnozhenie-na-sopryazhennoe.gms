[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
show axes = true; show grid = true;
string info = "";
float p1x = 99; float p1y = 99; float p2x = 99; float p2y = 99;

new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "z1"; pos = (3, 2); text = true("z₁"); pauseOnDrag = false; collideWithPoints = false; color = #3b82f6 }
new Point { name = "z2"; pos = (1, 1); text = true("z₂"); pauseOnDrag = false; collideWithPoints = false; color = #f59e0b }
new Point { name = "c2"; pos = (1, -1); text = true("z̄₂"); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "w"; pos = (5, -1); text = true("z₁·z̄₂"); dynamic = false; collision = false }
new Point { name = "q"; pos = (2.5, -0.5); text = true("z₁/z₂"); dynamic = false; collision = false; color = #22c55e }
new Line { name = "o1"; pos = (O, z1); interact = false; color = #3b82f6; thickness = 3 }
new Line { name = "o2"; pos = (O, z2); interact = false; color = #f59e0b; thickness = 3 }
new Line { name = "oc"; pos = (O, c2); interact = false; color = #f59e0b }
new Line { name = "ow"; pos = (O, w); interact = false }
new Line { name = "oq"; pos = (O, q); interact = false; color = #22c55e; thickness = 3 }
draw Vector { name = "v1"; edge = "o1"; pos = 1; color = #3b82f6; thickness = 3 }
draw Vector { name = "v2"; edge = "o2"; pos = 1; color = #f59e0b; thickness = 3 }
draw Vector { name = "vq"; edge = "oq"; pos = 1; color = #22c55e; thickness = 3 }

Function num(v) { if (v < 0) { return "−" + format(-v, 1); } return format(v, 1); }
Function num2(v) { if (v < 0) { return "−" + format(-v, 2); } return format(v, 2); }
Function term(v) { if (v < 0) { return " − " + format(-v, 1); } return " + " + format(v, 1); }
Function par(v) { if (v < 0) { return "(" + num(v) + ")"; } return num(v); }
Function cx(a, b) { return num(a) + term(b) + "i"; }

Update {
  float R = min(fieldMaxX, fieldMaxY);
  float r1 = hypot(z1.pos.x, z1.pos.y); float r2 = hypot(z2.pos.x, z2.pos.y);
  float m1 = abs(z1.pos.x - p1x) + abs(z1.pos.y - p1y);
  float m2 = abs(z2.pos.x - p2x) + abs(z2.pos.y - p2y);
  // делитель отличен от нуля; |z₁·z̄₂| и |z₁/z₂| остаются в поле
  if (r2 < 0.8) {
    if (r2 < 0.001) { z2.pos.x = 0.8; z2.pos.y = 0; } else { float k = 0.8 / r2; z2.pos.x = z2.pos.x * k; z2.pos.y = z2.pos.y * k; }
    r2 = 0.8;
  }
  if (r1 * r2 > R || r1 > R * r2) {
    if (m1 >= m2) { float k = min(R / r2, R * r2) / r1; z1.pos.x = z1.pos.x * k; z1.pos.y = z1.pos.y * k; }
    else { float k = min(R / r1, 1000) / r2; if (r1 > R * r2) { k = r1 / (R * r2); } z2.pos.x = z2.pos.x * k; z2.pos.y = z2.pos.y * k; }
  }
  if (abs(z1.pos.x - p1x) > 0.00001 || abs(z1.pos.y - p1y) > 0.00001 || abs(z2.pos.x - p2x) > 0.00001 || abs(z2.pos.y - p2y) > 0.00001) {
    p1x = z1.pos.x; p1y = z1.pos.y; p2x = z2.pos.x; p2y = z2.pos.y;
    float n2 = p2x * p2x + p2y * p2y;
    c2.pos.x = p2x; c2.pos.y = -p2y;
    w.pos.x = p1x * p2x + p1y * p2y; w.pos.y = p1y * p2x - p1x * p2y;
    q.pos.x = w.pos.x / n2; q.pos.y = w.pos.y / n2;
  }
  float a = p1x; float b = p1y; float c = p2x; float d = p2y;
  float n = c * c + d * d;
  float wr = a * c + b * d; float wi = b * c - a * d;
  info = "**Деление комплексных чисел.** Числитель и знаменатель умножают на число, сопряжённое знаменателю: z₁/z₂ = z₁·z̄₂ / (z₂·z̄₂) = z₁·z̄₂ / (c² + d²) — знаменатель становится действительным.\n\n";
  info = info + "z₁ = " + cx(a, b) + ", z₂ = " + cx(c, d) + ", z̄₂ = " + cx(c, -d) + ".\n\n";
  info = info + "Знаменатель: z₂·z̄₂ = " + par(c) + "² + " + par(d) + "² = " + format(n, 2) + ". Числитель: z₁·z̄₂ = " + num2(wr) + term(wi) + "i.\n\n";
  info = info + "z₁/z₂ = (" + num2(wr) + term(wi) + "i) / " + format(n, 2) + " = " + num2(wr / n) + term(wi / n) + "i. Модуль частного равен |z₁|/|z₂| = " + format(hypot(a, b), 2) + " / " + format(hypot(c, d), 2) + " = " + format(hypot(a, b) / hypot(c, d), 2) + ", аргумент — разности аргументов. Деление на нуль не определено, поэтому z₂ не подходит к началу координат ближе чем на 0,8.";
}
]
