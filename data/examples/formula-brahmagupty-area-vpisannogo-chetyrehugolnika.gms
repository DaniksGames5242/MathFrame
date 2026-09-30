[
description = "{info}"

field width = 16;
field height = 12;
camera type = fixed;

// ---- Четырёхугольник ABCD, вписанный в окружность: вершины ходят по ней,
// порядок обхода сохраняется, соседние вершины друг через друга не проходят ----
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Circle { name = "w"; center = O; radius = 4.6 }
new Point { name = "A"; circle = "w"; t = 0.40; text = true("A"); pauseOnDrag = false }
new Point { name = "B"; circle = "w"; t = 0.66; text = true("B"); pauseOnDrag = false }
new Point { name = "C"; circle = "w"; t = 0.93; text = true("C"); pauseOnDrag = false }
new Point { name = "D"; circle = "w"; t = 0.14; text = true("D"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "abcd"; elements = (ab, bc, cd, da) }
new Line { name = "ac"; pos = (A, C); active = false; interact = false }
draw Punctir { name = "pac"; edge = "ac" }

string info = "";
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  float a = ab.length; float b = bc.length; float c = cd.length; float d = da.length;
  float p = (a + b + c + d) / 2;
  float pa = p - a; float pb = p - b; float pc = p - c; float pd = p - d;
  float sb = sqrt(max(0, pa * pb * pc * pd));
  // Площадь по координатам (формула шнурков) — независимая проверка
  float sh = abs((A.pos.x * B.pos.y - B.pos.x * A.pos.y) + (B.pos.x * C.pos.y - C.pos.x * B.pos.y) + (C.pos.x * D.pos.y - D.pos.x * C.pos.y) + (D.pos.x * A.pos.y - A.pos.x * D.pos.y)) / 2;
  info = "**Формула Брахмагупты.** Для четырёхугольника, вписанного в окружность, со сторонами a = AB = " + format(a, 2) + ", b = BC = " + format(b, 2) + ", c = CD = " + format(c, 2) + ", d = DA = " + format(d, 2) + " и полупериметром p = (a + b + c + d) / 2 = " + format(p, 2) + ":\n\nS = √((p − a)(p − b)(p − c)(p − d)) = √(" + format(pa, 2) + " · " + format(pb, 2) + " · " + format(pc, 2) + " · " + format(pd, 2) + ") = **" + format(sb, 3) + "**.\n\n**Проверка по координатам вершин:** S = " + format(sh, 3) + ". Площадь определяется одними сторонами: при любом положении вершин на окружности значения совпадают.\n\nКогда одна сторона стягивается к нулю (вершины сближаются), один из множителей стремится к нулю, а формула переходит в формулу Герона для треугольника.";
}
]
