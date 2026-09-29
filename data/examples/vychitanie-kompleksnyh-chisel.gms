[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
show axes = true; show grid = true;
string info = "";
float p1x = 99; float p1y = 99; float p2x = 99; float p2y = 99;

new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "z1"; pos = (3, 2); text = true("z₁"); pauseOnDrag = false; collideWithPoints = false; color = #3b82f6 }
new Point { name = "z2"; pos = (1, -1); text = true("z₂"); pauseOnDrag = false; collideWithPoints = false; color = #f59e0b }
new Point { name = "m2"; pos = (-1, 1); text = true("−z₂"); dynamic = false; collision = false; color = #f59e0b; active = act > 0.5 }
new Point { name = "d"; pos = (2, 3); text = true("z₁ − z₂"); dynamic = false; collision = false; color = #22c55e }
new Line { name = "o1"; pos = (O, z1); interact = false; color = #3b82f6; thickness = 3 }
new Line { name = "o2"; pos = (O, z2); interact = false; color = #f59e0b; thickness = 3 }
new Line { name = "om"; pos = (O, m2); interact = false; color = #f59e0b; active = act > 0.5 }
new Line { name = "od"; pos = (O, d); interact = false; color = #22c55e; thickness = 3 }
new Line { name = "md"; pos = (m2, d); interact = false; color = #3b82f6; active = act > 0.5 }
new Line { name = "z21"; pos = (z2, z1); interact = false; color = #22c55e; thickness = 2 }
draw Vector { name = "v1"; edge = "o1"; pos = 1; color = #3b82f6; thickness = 3 }
draw Vector { name = "v2"; edge = "o2"; pos = 1; color = #f59e0b; thickness = 3 }
draw Vector { name = "vd"; edge = "od"; pos = 1; color = #22c55e; thickness = 3 }
draw Vector { name = "vz"; edge = "z21"; pos = 1; color = #22c55e; thickness = 2 }
new UI { name = "sA"; type = slider; label = "показать −z₂ (0/1)"; variable = act; min = 0; max = 1; step = 1; default = 1 }

float act = 1;
Function num(v) { if (v < 0) { return "−" + format(-v, 1); } return format(v, 1); }
Function term(v) { if (v < 0) { return " − " + format(-v, 1); } return " + " + format(v, 1); }
Function cl(v, lo, hi) { return max(lo, min(hi, v)); }
Function cx(a, b) { return num(a) + term(b) + "i"; }

Update {
  float Lx = fieldMaxX; float Ly = fieldMaxY;
  // разность z₁ − z₂ не должна выходить за поле
  float m1 = abs(z1.pos.x - p1x) + abs(z1.pos.y - p1y);
  float mm2 = abs(z2.pos.x - p2x) + abs(z2.pos.y - p2y);
  if (m1 >= mm2) {
    float nx = cl(z1.pos.x, z2.pos.x - Lx, z2.pos.x + Lx); float ny = cl(z1.pos.y, z2.pos.y - Ly, z2.pos.y + Ly);
    if (nx != z1.pos.x) { z1.pos.x = nx; } if (ny != z1.pos.y) { z1.pos.y = ny; }
  } else {
    float nx = cl(z2.pos.x, z1.pos.x - Lx, z1.pos.x + Lx); float ny = cl(z2.pos.y, z1.pos.y - Ly, z1.pos.y + Ly);
    if (nx != z2.pos.x) { z2.pos.x = nx; } if (ny != z2.pos.y) { z2.pos.y = ny; }
  }
  if (abs(z1.pos.x - p1x) > 0.00001 || abs(z1.pos.y - p1y) > 0.00001 || abs(z2.pos.x - p2x) > 0.00001 || abs(z2.pos.y - p2y) > 0.00001) {
    p1x = z1.pos.x; p1y = z1.pos.y; p2x = z2.pos.x; p2y = z2.pos.y;
    m2.pos.x = -p2x; m2.pos.y = -p2y;
    d.pos.x = p1x - p2x; d.pos.y = p1y - p2y;
  }
  float a = p1x; float b = p1y; float c = p2x; float e = p2y;
  info = "**Вычитание комплексных чисел** — действие, обратное сложению: разность z₁ − z₂ — такое число, которое в сумме с z₂ даёт z₁. Покоординатно: (a + bi) − (c + di) = (a − c) + (b − d)i.\n\n";
  info = info + "z₁ = " + cx(a, b) + ", z₂ = " + cx(c, e) + ".\n\n";
  info = info + "z₁ − z₂ = (" + num(a) + " − " + (c < 0 ? "(" + num(c) + ")" : num(c)) + ") + (" + num(b) + " − " + (e < 0 ? "(" + num(e) + ")" : num(e)) + ")i = " + cx(a - c, b - e) + ".\n\n";
  info = info + "Проверка: (z₁ − z₂) + z₂ = " + cx(a - c + c, b - e + e) + " = z₁. Разность равна сумме z₁ + (−z₂), где −z₂ = " + cx(-c, -e) + "; на плоскости это вектор от z₂ к z₁, перенесённый в начало координат.";
}
]
