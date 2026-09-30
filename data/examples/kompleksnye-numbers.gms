[
description = "{info}"
field width = 14; field height = 9;
camera type = fixed;
show axes = true; show grid = true;
string info = ""; float tab = 1;
float mz = 1.5; float mw = 1.2; float az = 0.6; float aw = 2;

new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "z"; pos = (1.2, 0.9); text = true("z"); pauseOnDrag = false; collideWithPoints = false; color = #3b82f6 }
new Point { name = "w"; pos = (-0.6, 1.1); text = true("w"); pauseOnDrag = false; collideWithPoints = false; color = #f59e0b }
new Line { name = "oz"; pos = (O, z); interact = false; color = #3b82f6; thickness = 3 }
new Line { name = "ow"; pos = (O, w); interact = false; color = #f59e0b; thickness = 3 }

new Point { name = "s"; pos = (0, 0); text = true("z + w"); dynamic = false; collision = false; color = #22c55e }
new Line { name = "zs"; pos = (z, s); interact = false; thickness = 1 }
new Line { name = "ws"; pos = (w, s); interact = false; thickness = 1 }
new Line { name = "os"; pos = (O, s); interact = false; color = #22c55e; thickness = 3 }
new Claster { name = "tabAdd"; elements = (s, zs, ws, os); active = true }

new Point { name = "zc"; pos = (0, 0); text = true("z̄"); dynamic = false; collision = false; color = #22c55e }
new Line { name = "ozc"; pos = (O, zc); interact = false; color = #22c55e; thickness = 3 }
new Line { name = "zzc"; pos = (z, zc); interact = false; thickness = 1 }
new Curve { name = "cm"; type = parametric; x = "mz * cos(6.283185 * t)"; y = "mz * sin(6.283185 * t)"; interact = false; thickness = 1 }
new Claster { name = "tabConj"; elements = (zc, ozc, zzc, cm); active = false }

new Point { name = "p"; pos = (0, 0); text = true("zw"); dynamic = false; collision = false; color = #22c55e }
new Point { name = "q"; pos = (0, 0); text = true("1/z"); dynamic = false; collision = false }
new Line { name = "op"; pos = (O, p); interact = false; color = #22c55e; thickness = 3 }
new Line { name = "oq"; pos = (O, q); interact = false; thickness = 3 }
new Claster { name = "tabMul"; elements = (p, q, op, oq); active = false }

new UI { name = "btnAdd"; type = button; label = "Сложение"; action = "tab = 1; tabAdd.active = true; tabConj.active = false; tabMul.active = false" }
new UI { name = "btnConj"; type = button; label = "Сопряжение и модуль"; action = "tab = 2; tabAdd.active = false; tabConj.active = true; tabMul.active = false" }
new UI { name = "btnMul"; type = button; label = "Умножение и обратное"; action = "tab = 3; tabAdd.active = false; tabConj.active = false; tabMul.active = true" }

Function num(v) { if (v < 0) { return "−" + format(-v, 2); } return format(v, 2); }
Function term(v) { if (v < 0) { return " − " + format(-v, 2); } return " + " + format(v, 2); }
// алгебраическая форма a + bi
Function cx(a, b) { return num(a) + term(b) + "i"; }

Update {
  // модули ограничены, чтобы z + w, zw и 1/z оставались в поле; z и w сжимаются/растягиваются вдоль луча
  float m1 = hypot(z.pos.x, z.pos.y);
  if (m1 > 2.1) { z.pos.x = z.pos.x * 2.1 / m1; z.pos.y = z.pos.y * 2.1 / m1; }
  if (m1 < 0.5) { if (m1 < 0.0001) { z.pos.x = 0.5; } else { z.pos.x = z.pos.x * 0.5 / m1; z.pos.y = z.pos.y * 0.5 / m1; } }
  float m2 = hypot(w.pos.x, w.pos.y);
  if (m2 > 2.1) { w.pos.x = w.pos.x * 2.1 / m2; w.pos.y = w.pos.y * 2.1 / m2; }
  float a = z.pos.x; float b = z.pos.y; float c = w.pos.x; float d = w.pos.y;
  mz = hypot(a, b); mw = hypot(c, d);
  az = atan2(b, a) * 57.29578; aw = atan2(d, c) * 57.29578;
  s.pos.x = a + c; s.pos.y = b + d;
  zc.pos.x = a; zc.pos.y = -b;
  p.pos.x = a * c - b * d; p.pos.y = a * d + b * c;
  q.pos.x = a / (mz * mz); q.pos.y = -b / (mz * mz);
  if (tab == 1) {
    info = "**Комплексные числа** z = a + bi, где i² = −1; складываются покомпонентно: (a + bi) + (c + di) = (a + c) + (b + d)i — как векторы.\n\n";
    info = info + "z = " + cx(a, b) + ", w = " + cx(c, d) + ".\n\n";
    info = info + "z + w = (" + num(a) + term(c) + ") + (" + num(b) + term(d) + ")i = " + cx(a + c, b + d) + ".";
  } else if (tab == 2) {
    info = "**Сопряжённое** к z = a + bi число z̄ = a − bi (отражение относительно действительной оси). Произведение z·z̄ = a² + b² — неотрицательное действительное число, а **модуль** |z| = √(a² + b²).\n\n";
    info = info + "z = " + cx(a, b) + ", z̄ = " + cx(a, -b) + ".\n\n";
    info = info + "z·z̄ = " + format(a * a, 2) + term(b * b) + " = " + format(mz * mz, 2) + ", |z| = " + format(mz, 2) + ".";
  } else {
    info = "**Умножение** при i² = −1: (a + bi)(c + di) = (ac − bd) + (ad + bc)i. Модули перемножаются, аргументы складываются. **Обратное** число: 1/z = z̄ / |z|².\n\n";
    info = info + "z = " + cx(a, b) + ", w = " + cx(c, d) + ".\n\n";
    info = info + "zw = " + cx(a * c - b * d, a * d + b * c) + ";  |z|·|w| = " + format(mz, 2) + " · " + format(mw, 2) + " = " + format(mz * mw, 2) + " = |zw|.\n\n";
    info = info + "1/z = " + cx(a / (mz * mz), -b / (mz * mz)) + ";  z · (1/z) = 1.";
  }
}
]
