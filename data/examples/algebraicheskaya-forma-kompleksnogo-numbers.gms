[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
show axes = true; show grid = true;
string info = "";
float pa = 99; float pb = 99;

new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "z"; pos = (3, 2); text = true("z"); pauseOnDrag = false; collideWithPoints = false; color = #3b82f6 }
new Point { name = "w"; pos = (-4, -2); text = true("w"); pauseOnDrag = false; collideWithPoints = false; color = #f59e0b }
new Point { name = "ra"; pos = (3, 0); text = true("a"); dynamic = false; collision = false; color = #22c55e }
new Point { name = "ib"; pos = (0, 2); text = true("bi"); dynamic = false; collision = false; color = #22c55e }
new Line { name = "oa"; pos = (O, ra); interact = false; color = #22c55e; thickness = 3 }
new Line { name = "ob"; pos = (O, ib); interact = false; color = #22c55e; thickness = 3 }
new Line { name = "az"; pos = (ra, z); interact = false; color = #22c55e }
new Line { name = "bz"; pos = (ib, z); interact = false; color = #22c55e }
new Line { name = "oz"; pos = (O, z); interact = false; color = #3b82f6; thickness = 3 }
new Line { name = "ow"; pos = (O, w); interact = false; color = #f59e0b; thickness = 3 }

Function num(v) { if (v < 0) { return "−" + format(-v, 1); } return format(v, 1); }
Function cx(a, b) {
  if (abs(b) < 0.05) { return num(a); }
  if (abs(a) < 0.05) { return num(b) + "i"; }
  if (b < 0) { return num(a) + " − " + format(-b, 1) + "i"; }
  return num(a) + " + " + format(b, 1) + "i";
}

Update {
  // прилипание к осям: чисто действительное / чисто мнимое число
  if (abs(z.pos.y) < 0.12 && z.pos.y != 0) { z.pos.y = 0; }
  if (abs(z.pos.x) < 0.12 && z.pos.x != 0) { z.pos.x = 0; }
  // w прилипает к z: равные числа
  if (hypot(w.pos.x - z.pos.x, w.pos.y - z.pos.y) < 0.25 && (w.pos.x != z.pos.x || w.pos.y != z.pos.y)) { w.pos.x = z.pos.x; w.pos.y = z.pos.y; }
  if (abs(z.pos.x - pa) > 0.00001 || abs(z.pos.y - pb) > 0.00001) {
    pa = z.pos.x; pb = z.pos.y;
    ra.pos.x = pa; ra.pos.y = 0; ib.pos.x = 0; ib.pos.y = pb;
  }
  // выводы делаются по тем же значениям, что показаны в тексте (с точностью 0,1):
  // иначе «b = 0.0» могло соседствовать с «число не действительное»
  float a = round(10 * z.pos.x) / 10; float b = round(10 * z.pos.y) / 10;
  info = "**Алгебраическая форма** — запись z = a + bi, где a = Re z — действительная часть, b = Im z — мнимая. Точка (a; b) плоскости однозначно задаёт число: a·1 + b·i — разложение вектора по 1 и i.\n\n";
  info = info + "z = " + cx(a, b) + ": a = " + num(a) + ", b = " + num(b) + ".";
  if (b == 0) { info = info + " Мнимая часть равна нулю — число **действительное**."; }
  if (a == 0 && b != 0) { info = info + " Действительная часть равна нулю — число **чисто мнимое**."; }
  float c = round(10 * w.pos.x) / 10; float d = round(10 * w.pos.y) / 10;
  info = info + "\n\nw = " + cx(c, d) + ". ";
  if (c == a && d == b) { info = info + "**z = w**: совпали и действительные, и мнимые части."; }
  else { info = info + "**z ≠ w**: равенство комплексных чисел — это два действительных равенства a = c и b = d; здесь a " + "− c = " + num(a - c) + ", b − d = " + num(b - d) + "."; }
}
]
