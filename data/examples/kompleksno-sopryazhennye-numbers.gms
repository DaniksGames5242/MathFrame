[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
show axes = true; show grid = true;
string info = "";
float pa = 99; float pb = 99; float rad = 3.6;

new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "z"; pos = (3, 2); text = true("z"); pauseOnDrag = false; collideWithPoints = false; color = #3b82f6 }
new Point { name = "zc"; pos = (3, -2); text = true("z̄"); dynamic = false; collision = false; color = #f59e0b; active = act > 0.5 }
new Point { name = "ra"; pos = (3, 0); dynamic = false; collision = false; active = false }
new Line { name = "oz"; pos = (O, z); interact = false; color = #3b82f6; thickness = 3 }
new Line { name = "ozc"; pos = (O, zc); interact = false; color = #f59e0b; thickness = 3; active = act > 0.5 }
new Line { name = "zz"; pos = (z, zc); interact = false; active = act > 0.5 }
new Circle { name = "cir"; center = O; radius = rad; interact = false }
new UI { name = "sA"; type = slider; label = "сопряжение (0/1)"; variable = act; min = 0; max = 1; step = 1; default = 1 }

float act = 1;
Function num(v) { if (v < 0) { return "−" + format(-v, 1); } return format(v, 1); }
Function term(v) { if (v < 0) { return " − " + format(-v, 1); } return " + " + format(v, 1); }
Function cx(a, b) { return num(a) + term(b) + "i"; }

Update {
  // прилипание к действительной оси: действительное число совпадает со своим сопряжённым
  if (abs(z.pos.y) < 0.15 && z.pos.y != 0) { z.pos.y = 0; }
  float a = z.pos.x; float b = z.pos.y;
  if (abs(a - pa) > 0.00001 || abs(b - pb) > 0.00001) {
    pa = a; pb = b; rad = hypot(a, b);
    zc.pos.x = a; zc.pos.y = -b;
  }
  info = "**Сопряжённое число** к z = a + bi — число z̄ = a − bi: та же действительная часть, противоположная мнимая. На плоскости это отражение точки относительно действительной оси.\n\n";
  info = info + "z = " + cx(a, b) + ", z̄ = " + cx(a, -b) + ".\n\n";
  if (b == 0) { info = info + "Мнимая часть равна нулю: **действительное число неподвижно**, z̄ = z."; }
  else { info = info + "Для сопряжённых чисел z + z̄ = 2a = " + num(2 * a) + " (действительное), z·z̄ = a² + b² = |z|² = " + format(a * a + b * b, 2) + " (действительное, неотрицательное). Обе точки лежат на окружности радиуса |z| = " + format(hypot(a, b), 2) + " с центром в начале координат. Сопряжение ещё раз возвращает z."; }
}
]
