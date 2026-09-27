[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;
show axes = true;
show grid = true;

// ---- Ограничение g(x, y) = x²/9 + y²/4 − 1 = 0 (эллипс), точка P ходит по нему.
// Серые — линии уровня f, оранжевая — линия уровня через P. Стрелки — ∇f (синяя) и ∇g (зелёная). ----
new Curve { name = "lv0"; type = parametric; x = "lvx(0, t)"; y = "lvy(0, t)"; segments = 80; color = #6b7280; thickness = 1 }
new Curve { name = "lv1"; type = parametric; x = "lvx(1, t)"; y = "lvy(1, t)"; segments = 80; color = #6b7280; thickness = 1 }
new Curve { name = "lv2"; type = parametric; x = "lvx(2, t)"; y = "lvy(2, t)"; segments = 80; color = #6b7280; thickness = 1 }
new Curve { name = "lv3"; type = parametric; x = "lvx(3, t)"; y = "lvy(3, t)"; segments = 80; color = #6b7280; thickness = 1 }
new Curve { name = "lv4"; type = parametric; x = "lvx(4, t)"; y = "lvy(4, t)"; segments = 80; color = #6b7280; thickness = 1 }
new Curve { name = "lv5"; type = parametric; x = "lvx(5, t)"; y = "lvy(5, t)"; segments = 80; color = #6b7280; thickness = 1 }
new Curve { name = "lv6"; type = parametric; x = "lvx(6, t)"; y = "lvy(6, t)"; segments = 80; color = #6b7280; thickness = 1 }
new Curve { name = "lv7"; type = parametric; x = "lvx(7, t)"; y = "lvy(7, t)"; segments = 80; color = #6b7280; thickness = 1 }
new Curve { name = "lv8"; type = parametric; x = "lvx(8, t)"; y = "lvy(8, t)"; segments = 80; color = #6b7280; thickness = 1 }
new Curve { name = "lv9"; type = parametric; x = "lvx(9, t)"; y = "lvy(9, t)"; segments = 80; color = #6b7280; thickness = 1 }
new Curve { name = "lv10"; type = parametric; x = "lvx(10, t)"; y = "lvy(10, t)"; segments = 80; color = #6b7280; thickness = 1 }
new Curve { name = "lv11"; type = parametric; x = "lvx(11, t)"; y = "lvy(11, t)"; segments = 80; color = #6b7280; thickness = 1 }
new Curve { name = "cur1"; type = parametric; x = "cvx(0, t)"; y = "cvy(0, t)"; segments = 160; color = #f59e0b; thickness = 2.5 }
new Curve { name = "cur2"; type = parametric; x = "cvx(1, t)"; y = "cvy(1, t)"; segments = 160; color = #f59e0b; thickness = 2.5 }
new Curve { name = "ell"; type = parametric; x = "3 * cos(2 * pi * t)"; y = "2 * sin(2 * pi * t)"; segments = 160; color = #ef4444; thickness = 3.5 }
new Point { name = "P"; curve = "ell"; t = 0.08; text = true("P"); pauseOnDrag = false; layer = 60 }
new Point { name = "GF"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "GG"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "lf"; pos = (P, GF); color = #3b82f6; thickness = 3; interact = false; layer = 50 }
new Line { name = "lg"; pos = (P, GG); color = #22c55e; thickness = 3; interact = false; layer = 50 }
draw Vector { name = "vf"; edge = "lf"; pos = 1; color = #3b82f6; thickness = 3 }
draw Vector { name = "vg"; edge = "lg"; pos = 1; color = #22c55e; thickness = 3 }
draw Text { name = "tf"; pos = (GF.pos.x + 0.35, GF.pos.y + 0.35); text = "∇f"; color = #3b82f6; size = 1.2 }
draw Text { name = "tg"; pos = (GG.pos.x + 0.35, GG.pos.y + 0.35); text = "∇g"; color = #22c55e; size = 1.2 }

new UI { name = "sF"; type = select; label = "f(x, y)"; variable = fn; options = ("lin", "xy"); labels = ("x + 2y", "x·y"); default = "lin" }

// ---- Логика ----
string fn = "lin";
float px = 3; float py = 0; float c = 0;
string info = "";

Function f(x, y) { if (fn == "lin") { return x + 2 * y; } return x * y; }
// Линии уровня f = cₖ. Для x + 2y — прямые x + 2y = cₖ (k < 9); для xy — две ветви гиперболы xy = cₖ
Function lc(k) { if (fn == "lin") { return 2 * (k - 4); } float j = floor(k / 2); if (j == 0) { return -4; } if (j == 1) { return -1.5; } if (j == 2) { return -0.5; } if (j == 3) { return 0.5; } if (j == 4) { return 1.5; } return 4; }
Function lvx(k, t) {
  if (fn == "lin") { if (k > 8) { return 99; } return -10 + 20 * t; }
  float s = 1; if (k - 2 * floor(k / 2) == 1) { s = -1; }
  return s * (0.05 + 7.95 * t * t);
}
Function lvy(k, t) {
  if (fn == "lin") { if (k > 8) { return 99; } return (lc(k) - (-10 + 20 * t)) / 2; }
  return lc(k) / lvx(k, t);
}
// Линия уровня через P: f = c
Function cvx(b, t) { if (fn == "lin") { if (b == 1) { return 99; } return -10 + 20 * t; } float s = 1; if (b == 1) { s = -1; } return s * (0.02 + 7.98 * t * t); }
Function cvy(b, t) { if (fn == "lin") { if (b == 1) { return 99; } return (c - (-10 + 20 * t)) / 2; } return c / cvx(b, t); }
Function num(v) { if (abs(v) < 0.005) { return "0"; } if (v < 0) { return "−" + format(abs(v), 2); } return format(v, 2); }

Update {
  // Рядом с точкой условного экстремума P «примагничивается» к ней
  float bestT = -1;
  repeat (4) {
    float tt = 0;
    if (fn == "lin") { tt = atan2(0.8, 0.6) / (2 * pi); if (i == 1) { tt = tt + 0.5; } if (i > 1) { tt = -1; } }
    else { tt = 0.125 + 0.25 * i; }
    if (tt >= 0) {
      float ex = 3 * cos(2 * pi * tt); float ey = 2 * sin(2 * pi * tt);
      if ((P.pos.x - ex) ^ 2 + (P.pos.y - ey) ^ 2 < 0.3 * 0.3) { bestT = tt; }
    }
  }
  if (bestT >= 0) { P.t = bestT - floor(bestT); P.pos.x = 3 * cos(2 * pi * bestT); P.pos.y = 2 * sin(2 * pi * bestT); }
  px = P.pos.x; py = P.pos.y; c = f(px, py);
  float fx = 1; float fy = 2; if (fn == "xy") { fx = py; fy = px; }
  float gx = 2 * px / 9; float gy = py / 2;
  // Стрелки нормированы по длине 1.6
  float lf = sqrt(fx * fx + fy * fy) + 0.000001; float lg = sqrt(gx * gx + gy * gy) + 0.000001;
  GF.pos.x = px + 1.6 * fx / lf; GF.pos.y = py + 1.6 * fy / lf;
  GG.pos.x = px + 1.6 * gx / lg; GG.pos.y = py + 1.6 * gy / lg;
  float cr = (fx * gy - fy * gx) / (lf * lg);
  float lam = (fx * gx + fy * gy) / (lg * lg);

  info = "**Метод множителей Лагранжа** ищет экстремумы функции f(x, y) при условии g(x, y) = 0. В точке условного экстремума линия уровня f касается кривой g = 0, поэтому градиенты параллельны: ∇f = λ·∇g. Вместе с условием это даёт систему для x, y и множителя λ — то же, что обнулить все частные производные функции Лагранжа L = f − λg.\n\nУсловие: x²/9 + y²/4 = 1 (красный эллипс).   P = (" + num(px) + "; " + num(py) + "),  f(P) = " + num(c) + ".  ";
  if (abs(cr) < 0.02) { info = info + "**∇f ∥ ∇g — условный экстремум**, λ = " + num(lam) + ". Линия уровня касается эллипса: сдвиг P вдоль эллипса в любую сторону меняет f в одну сторону."; }
  else { info = info + "∇f не параллелен ∇g (синус угла между ними " + num(cr) + "): линия уровня пересекает эллипс, и, сдвигая P вдоль него, можно и увеличить, и уменьшить f."; }
  if (fn == "lin") { info = info + " Ответ: max f = 5 в (9/5; 8/5), min f = −5 в (−9/5; −8/5)."; }
  else { info = info + " Ответ: max f = 3 в (±3/√2; ±√2), min f = −3 в (±3/√2; ∓√2)."; }
}
]
