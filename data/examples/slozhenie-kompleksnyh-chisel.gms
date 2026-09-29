[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
show axes = true; show grid = true;
string info = "";
float p1x = 99; float p1y = 99; float p2x = 99; float p2y = 99;

new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "z1"; pos = (3, 1); text = true("z₁"); pauseOnDrag = false; collideWithPoints = false; color = #3b82f6 }
new Point { name = "z2"; pos = (-1, 3); text = true("z₂"); pauseOnDrag = false; collideWithPoints = false; color = #f59e0b }
new Point { name = "s"; pos = (2, 4); text = true("z₁ + z₂"); dynamic = false; collision = false; color = #22c55e }
new Line { name = "o1"; pos = (O, z1); interact = false; color = #3b82f6; thickness = 3 }
new Line { name = "o2"; pos = (O, z2); interact = false; color = #f59e0b; thickness = 3 }
new Line { name = "os"; pos = (O, s); interact = false; color = #22c55e; thickness = 3 }
new Line { name = "e1"; pos = (z1, s); interact = false; color = #f59e0b }
new Line { name = "e2"; pos = (z2, s); interact = false; color = #3b82f6 }
draw Vector { name = "v1"; edge = "o1"; pos = 1; color = #3b82f6; thickness = 3 }
draw Vector { name = "v2"; edge = "o2"; pos = 1; color = #f59e0b; thickness = 3 }
draw Vector { name = "vs"; edge = "os"; pos = 1; color = #22c55e; thickness = 3 }

Function num(v) { if (v < 0) { return "−" + format(-v, 1); } return format(v, 1); }
Function term(v) { if (v < 0) { return " − " + format(-v, 1); } return " + " + format(v, 1); }
Function cl(v, lo, hi) { return max(lo, min(hi, v)); }
Function cx(a, b) { return num(a) + term(b) + "i"; }

Update {
  float Lx = fieldMaxX; float Ly = fieldMaxY;
  // сумма не должна выходить за поле: сдвинутая точка скользит вдоль границы
  float m1 = abs(z1.pos.x - p1x) + abs(z1.pos.y - p1y);
  float m2 = abs(z2.pos.x - p2x) + abs(z2.pos.y - p2y);
  if (m1 >= m2) {
    float nx = cl(z1.pos.x, -Lx - z2.pos.x, Lx - z2.pos.x); float ny = cl(z1.pos.y, -Ly - z2.pos.y, Ly - z2.pos.y);
    if (nx != z1.pos.x) { z1.pos.x = nx; } if (ny != z1.pos.y) { z1.pos.y = ny; }
  } else {
    float nx = cl(z2.pos.x, -Lx - z1.pos.x, Lx - z1.pos.x); float ny = cl(z2.pos.y, -Ly - z1.pos.y, Ly - z1.pos.y);
    if (nx != z2.pos.x) { z2.pos.x = nx; } if (ny != z2.pos.y) { z2.pos.y = ny; }
  }
  if (abs(z1.pos.x - p1x) > 0.00001 || abs(z1.pos.y - p1y) > 0.00001 || abs(z2.pos.x - p2x) > 0.00001 || abs(z2.pos.y - p2y) > 0.00001) {
    p1x = z1.pos.x; p1y = z1.pos.y; p2x = z2.pos.x; p2y = z2.pos.y;
    s.pos.x = p1x + p2x; s.pos.y = p1y + p2y;
  }
  float a = p1x; float b = p1y; float c = p2x; float d = p2y;
  info = "**Сложение комплексных чисел** — покоординатное: (a + bi) + (c + di) = (a + c) + (b + d)i. Геометрически это сложение векторов по правилу параллелограмма.\n\n";
  info = info + "z₁ = " + cx(a, b) + ", z₂ = " + cx(c, d) + ".\n\n";
  info = info + "z₁ + z₂ = (" + num(a) + term(c) + ") + (" + num(b) + term(d) + ")i = " + cx(a + c, b + d) + ".\n\n";
  info = info + "Порядок слагаемых не важен: z₂ + z₁ даёт ту же точку — противоположные стороны параллелограмма O, z₁, z₁ + z₂, z₂ параллельны и равны. Нуль не меняет число: z + 0 = z; противоположное к z₁ — число " + cx(-a, -b) + ", их сумма равна 0.";
}
]
