[
description = "{info}"

field width = 20;
field height = 13;
camera type = fixed;

// ---- Произвольный четырёхугольник ABCD — все вершины свободно перетаскиваются,
// выпуклым или невыпуклым он может быть без ограничения. ----
new Point { name = "A"; pos = (-7, -4); text = true("A") }
new Point { name = "B"; pos = (5, -4.5); text = true("B") }
new Point { name = "C"; pos = (7, 4); text = true("C") }
new Point { name = "D"; pos = (-4, 3.5); text = true("D") }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "abcd"; elements = (ab, bc, cd, da) }

new Line { name = "diagAC"; pos = (A, C); interact = false; active = false }
new Line { name = "diagBD"; pos = (B, D); interact = false; active = false }
draw Punctir { name = "eDiagAC"; edge = "diagAC"; active = tab == 1 }
draw Punctir { name = "eDiagBD"; edge = "diagBD"; active = tab == 1 }

// ---- Вкладка 2: теорема Вариньона — середины сторон образуют параллелограмм ----
new Point { name = "Ma"; pos = (0, 0); dynamic = false; collision = false; color = #3b82f6 }
new Point { name = "Mb"; pos = (0, 0); dynamic = false; collision = false; color = #3b82f6 }
new Point { name = "Mc"; pos = (0, 0); dynamic = false; collision = false; color = #3b82f6 }
new Point { name = "Md"; pos = (0, 0); dynamic = false; collision = false; color = #3b82f6 }
new Line { name = "mab"; pos = (Ma, Mb); interact = false; color = #3b82f6 }
new Line { name = "mbc"; pos = (Mb, Mc); interact = false; color = #3b82f6 }
new Line { name = "mcd"; pos = (Mc, Md); interact = false; color = #3b82f6 }
new Line { name = "mda"; pos = (Md, Ma); interact = false; color = #3b82f6 }
new Claster { name = "tabVar"; elements = (Ma, Mb, Mc, Md, mab, mbc, mcd, mda); active = false }

new UI { name = "btn1"; type = button; label = "Сумма углов"; action = "tab = 1; tabVar.active = false" }
new UI { name = "btn2"; type = button; label = "Параллелограмм Вариньона"; action = "tab = 2; tabVar.active = true" }

float tab = 1;
string info = "";

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  float ax = A.pos.x; float ay = A.pos.y;
  float bx = B.pos.x; float by = B.pos.y;
  float cx = C.pos.x; float cy = C.pos.y;
  float dx = D.pos.x; float dy = D.pos.y;

  Ma.pos.x = (ax + bx) / 2; Ma.pos.y = (ay + by) / 2;
  Mb.pos.x = (bx + cx) / 2; Mb.pos.y = (by + cy) / 2;
  Mc.pos.x = (cx + dx) / 2; Mc.pos.y = (cy + dy) / 2;
  Md.pos.x = (dx + ax) / 2; Md.pos.y = (dy + ay) / 2;

  // Площадь по формуле шнурков (годится и для невыпуклого четырёхугольника).
  float area = abs(ax * by - bx * ay + bx * cy - cx * by + cx * dy - dx * cy + dx * ay - ax * dy) / 2;
  float areaVar = area / 2;

  float d1 = sqrt((ax - cx) * (ax - cx) + (ay - cy) * (ay - cy));
  float d2 = sqrt((bx - dx) * (bx - dx) + (by - dy) * (by - dy));
  float abL = sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by));
  float bcL = sqrt((bx - cx) * (bx - cx) + (by - cy) * (by - cy));
  float cdL = sqrt((cx - dx) * (cx - dx) + (cy - dy) * (cy - dy));
  float daL = sqrt((dx - ax) * (dx - ax) + (dy - ay) * (dy - ay));
  float ptL = abL * cdL + bcL * daL;
  float ptR = d1 * d2;

  if (tab == 1) {
    info = "**Сумма внутренних углов четырёхугольника равна 360°** при любом расположении вершин — диагональ AC разбивает его на два треугольника, каждый даёт 180°.\n\n**Неравенство Птолемея.** Произведение диагоналей не превосходит суммы произведений противоположных сторон: AC · BD = " + format(ptR, 2) + " ≤ AB·CD + BC·DA = " + format(ptL, 2) + ". Равенство достигается только для вписанного четырёхугольника — сейчас разница " + format(ptL - ptR, 2) + ".";
  } else {
    info = "**Теорема Вариньона.** Середины сторон Ma, Mb, Mc, Md всегда образуют параллелограмм, независимо от формы исходного четырёхугольника и его выпуклости. Его площадь равна половине площади исходной фигуры: S_var = " + format(areaVar, 2) + " = ½ · " + format(area, 2) + ".";
  }
}
]
