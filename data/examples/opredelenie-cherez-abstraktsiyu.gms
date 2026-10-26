[
description = "{info}"

field width = 18;
field height = 12;
camera type = fixed;

// ---- Вектор u (A1A2) задаёт класс эквивалентности направленных отрезков — равных по
// длине и направлению. R1R1e и R2R2e — другие представители того же класса (пересчитаны
// от неподвижных начал). Вектор v (B1B2) — отдельный представитель: проверяем, попадает
// ли он в тот же класс. ----
new Point { name = "A1"; pos = (-8, -4); pauseOnDrag = false; text = true("A1") }
new Point { name = "A2"; pos = (-8, 1); pauseOnDrag = false; text = true("A2") }
new Line { name = "uAB"; pos = (A1, A2) }
draw Vector { name = "vU"; edge = "uAB" }

new Point { name = "R1"; pos = (-1, -4); dynamic = false; collision = false }
new Point { name = "R1e"; pos = (-1, 1); dynamic = false; collision = false }
new Line { name = "r1"; pos = (R1, R1e); interact = false }
draw Vector { name = "vR1"; edge = "r1"; color = #22c55e }

new Point { name = "R2"; pos = (4, -3); dynamic = false; collision = false }
new Point { name = "R2e"; pos = (4, 2); dynamic = false; collision = false }
new Line { name = "r2"; pos = (R2, R2e); interact = false }
draw Vector { name = "vR2"; edge = "r2"; color = #22c55e }

new Point { name = "B1"; pos = (2, -5.5); pauseOnDrag = false; text = true("B1") }
new Point { name = "B2"; pos = (6, -5); pauseOnDrag = false; text = true("B2") }
new Line { name = "vAB"; pos = (B1, B2) }
draw Vector { name = "vV"; edge = "vAB"; color = #f59e0b }

string info = "";

// Начало представителя: берём «любимое» положение (px, py), но сдвигаем его так, чтобы и начало,
// и конец (начало + вектор) остались в поле. Тогда представитель всегда равен u по длине и
// направлению — край поля его не обрезает.
Function clampTo(v, lo, hi) { if (v > hi) { return hi; } if (v < lo) { return lo; } return v; }

Update {
  float dx = A2.pos.x - A1.pos.x; float dy = A2.pos.y - A1.pos.y;
  R1.pos.x = clampTo(-1, max(-fieldMaxX, -fieldMaxX - dx), min(fieldMaxX, fieldMaxX - dx));
  R1.pos.y = clampTo(-4, max(-fieldMaxY, -fieldMaxY - dy), min(fieldMaxY, fieldMaxY - dy));
  R2.pos.x = clampTo(4, max(-fieldMaxX, -fieldMaxX - dx), min(fieldMaxX, fieldMaxX - dx));
  R2.pos.y = clampTo(-3, max(-fieldMaxY, -fieldMaxY - dy), min(fieldMaxY, fieldMaxY - dy));
  R1e.pos.x = R1.pos.x + dx; R1e.pos.y = R1.pos.y + dy;
  R2e.pos.x = R2.pos.x + dx; R2e.pos.y = R2.pos.y + dy;

  float bdx = B2.pos.x - B1.pos.x; float bdy = B2.pos.y - B1.pos.y;
  float same = 0; if (abs(dx - bdx) < 0.25 && abs(dy - bdy) < 0.25) { same = 1; }

  info = "**Определение через абстракцию:** на множестве направленных отрезков задаётся отношение эквивалентности — равенство по длине и направлению; вектор отождествляется с классом всех таких отрезков.\n\nu = A1A2 задаёт класс: зелёные отрезки — другие его представители, они равны u по длине и направлению независимо от того, откуда отложены (длина u = " + format(sqrt(dx * dx + dy * dy), 2) + ").\n\n";
  if (same == 1) { info = info + "v = B1B2 равен u по длине и направлению — **представитель того же класса**, то есть тот же вектор."; }
  else { info = info + "v = B1B2 отличается от u по длине или направлению — **представитель другого класса**, другой вектор."; }
}
]
