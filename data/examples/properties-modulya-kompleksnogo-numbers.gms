[
description = "{info}"

field width = 12;
field height = 12;
camera type = fixed;
show axes = true; show grid = true;

float tab = 1; float R = 2.3; string info = "";

new Point { name = "O0"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false }
new Point { name = "Z1"; pos = (1.5, 1); text = true("z₁"); pauseOnDrag = false; color = #3b82f6 }
new Point { name = "Z2"; pos = (-1, 1.8); text = true("z₂"); pauseOnDrag = false; color = #f59e0b }
new Line { name = "o1"; pos = (O0, Z1); color = #3b82f6; thickness = 3; interact = false }
new Line { name = "o2"; pos = (O0, Z2); color = #f59e0b; thickness = 3; interact = false }

// ---- Вкладка 1: мультипликативность |z₁z₂| = |z₁||z₂| ----
new Point { name = "P"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; text = true("z₁z₂"); color = #22c55e }
new Line { name = "op"; pos = (O0, P); color = #22c55e; thickness = 3; interact = false }
new Claster { name = "tabMul"; elements = (P, op); active = true }

// ---- Вкладка 2: неравенство треугольника |z₁ + z₂| ≤ |z₁| + |z₂| ----
new Point { name = "S"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; text = true("z₁+z₂"); color = #22c55e }
new Line { name = "os"; pos = (O0, S); color = #22c55e; thickness = 3; interact = false }
new Line { name = "s1"; pos = (Z1, S); interact = false }
new Line { name = "s2"; pos = (Z2, S); interact = false }
draw Punctir { name = "ps1"; edge = "s1" }
draw Punctir { name = "ps2"; edge = "s2" }
new Claster { name = "tabSum"; elements = (S, os, s1, s2, ps1, ps2); active = false }

// ---- Вкладка 3: сопряжённое и обратное число ----
new Point { name = "C1"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; text = true("z₁*"); color = #f59e0b }
new Point { name = "W"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; text = true("1/z₁"); color = #22c55e }
new Line { name = "oc"; pos = (O0, C1); interact = false }
new Line { name = "ow"; pos = (O0, W); color = #22c55e; thickness = 3; interact = false }
new Circle { name = "unit"; center = O0; radius = 1; interact = false }
new Claster { name = "tabInv"; elements = (C1, W, oc, ow, unit); active = false }

new UI { name = "b1"; type = button; label = "Произведение"; action = "tab = 1; tabMul.active = true; tabSum.active = false; tabInv.active = false" }
new UI { name = "b2"; type = button; label = "Сумма"; action = "tab = 2; tabMul.active = false; tabSum.active = true; tabInv.active = false" }
new UI { name = "b3"; type = button; label = "Сопряжённое и обратное"; action = "tab = 3; tabMul.active = false; tabSum.active = false; tabInv.active = true" }

Function num(v, d) { if (v < -0.0000001) { return "−" + format(-v, d); } return format(abs(v), d); }
Function cx(a, b) { if (b < -0.0000001) { return num(a, 2) + " − " + format(-b, 2) + "i"; } return num(a, 2) + " + " + format(abs(b), 2) + "i"; }

Update {
  float r1 = hypot(Z1.pos.x, Z1.pos.y);
  if (r1 > R) { Z1.pos.x = Z1.pos.x * R / r1; Z1.pos.y = Z1.pos.y * R / r1; }
  if (r1 < 0.2) { if (r1 < 0.0001) { Z1.pos.x = 0.2; Z1.pos.y = 0; } else { Z1.pos.x = Z1.pos.x * 0.2 / r1; Z1.pos.y = Z1.pos.y * 0.2 / r1; } }
  float r2 = hypot(Z2.pos.x, Z2.pos.y);
  if (r2 > R) { Z2.pos.x = Z2.pos.x * R / r2; Z2.pos.y = Z2.pos.y * R / r2; }
  float x1 = Z1.pos.x; float y1 = Z1.pos.y; float x2 = Z2.pos.x; float y2 = Z2.pos.y;
  float m1 = hypot(x1, y1); float m2 = hypot(x2, y2);
  P.pos.x = x1 * x2 - y1 * y2; P.pos.y = x1 * y2 + y1 * x2;
  S.pos.x = x1 + x2; S.pos.y = y1 + y2;
  C1.pos.x = x1; C1.pos.y = -y1;
  W.pos.x = x1 / (m1 * m1); W.pos.y = -y1 / (m1 * m1);
  string tail = "\n\nz₁ = " + cx(x1, y1) + ", z₂ = " + cx(x2, y2) + ". Точки z₁ (не ближе 0,2 к нулю) и z₂ лежат в круге радиуса 2,3.";
  if (tab == 1) {
    float mp = hypot(P.pos.x, P.pos.y);
    info = "**Мультипликативность.** Модуль произведения равен произведению модулей: |z₁z₂| = |z₁| · |z₂|.\n\n|z₁| = " + format(m1, 3) + ", |z₂| = " + format(m2, 3) + ", |z₁| · |z₂| = " + format(m1 * m2, 3) + ".\n\nz₁z₂ = " + cx(P.pos.x, P.pos.y) + ", |z₁z₂| = " + format(mp, 3) + " — то же число. Модуль равен нулю только у нуля: при z₂ = 0 и произведение равно 0." + tail;
  }
  if (tab == 2) {
    float ms = hypot(S.pos.x, S.pos.y);
    string eq = "строго меньше: точки z₁, z₂ и 0 не лежат на одном луче.";
    if (m1 * m2 - (x1 * x2 + y1 * y2) < 0.02) { eq = "равенство: z₁ и z₂ лежат на одном луче из начала координат."; }
    info = "**Неравенство треугольника.** |z₁ + z₂| ≤ |z₁| + |z₂| — сторона треугольника 0, z₁, z₁ + z₂ не длиннее суммы двух других.\n\n|z₁ + z₂| = " + format(ms, 3) + ", |z₁| + |z₂| = " + format(m1 + m2, 3) + " — " + eq + tail;
  }
  if (tab == 3) {
    string q = "z₂ = 0: частное не определено.";
    if (m2 > 0.05) { q = "|z₁ / z₂| = " + format(m1 / m2, 3) + " = |z₁| / |z₂|."; }
    info = "**Сопряжённое и обратное.** z₁ · z₁* = |z₁|² = " + format(m1 * m1, 3) + ", поэтому |z₁*| = |z₁| = " + format(m1, 3) + " (на поле сопряжённое обозначено z₁*).\n\nОбратное число: |1/z₁| = 1/|z₁| = " + format(1 / m1, 3) + "; на поле оно лежит на луче z₁* (единичная окружность отмечена).\n\n" + q + tail;
  }
}
]
