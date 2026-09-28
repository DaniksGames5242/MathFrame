[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Вкладка 1: складывание совмещает две точки — сгиб есть серединный перпендикуляр ----
new Point { name = "P1"; pos = (-5, -2); text = true("P₁"); pauseOnDrag = false }
new Point { name = "P2"; pos = (3, 2.5); text = true("P₂"); pauseOnDrag = false }
new Point { name = "cm1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "cm2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "creaseP"; pos = (cm1, cm2); color = #22c55e; thickness = 3 }
new Line { name = "linkP"; pos = (P1, P2); active = false; interact = false }
draw Punctir { name = "elP"; edge = "linkP" }
new Claster { name = "tabPts"; elements = (P1, P2, creaseP, elP); active = true }

// ---- Вкладка 2: складывание совмещает две прямые — сгиб есть биссектриса угла между ними ----
new Point { name = "E1"; pos = (-6, -3.5); pauseOnDrag = false }
new Point { name = "F1"; pos = (-1, 3.5); pauseOnDrag = false }
new Point { name = "E2"; pos = (6, -3.5); pauseOnDrag = false }
new Point { name = "F2"; pos = (1, 3.5); pauseOnDrag = false }
new Line { name = "l1"; pos = (E1, F1) }
new Line { name = "l2"; pos = (E2, F2) }
new Point { name = "cm3"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "cm4"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "creaseL"; pos = (cm3, cm4); color = #22c55e; thickness = 3 }
new Claster { name = "tabLines"; elements = (E1, F1, E2, F2, l1, l2, creaseL); active = false }

new UI { name = "btnPts"; type = button; label = "Совмещение точек"; action = "tab = 1; tabPts.active = true; tabLines.active = false" }
new UI { name = "btnLines"; type = button; label = "Совмещение прямых"; action = "tab = 2; tabPts.active = false; tabLines.active = true" }

// ---- Логика ----
float tab = 1;
string info = "";

Function inField(x, y) { return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001; }

Update {
  // Крайние точки серединного перпендикуляра к P1P2
  float mx = (P1.pos.x + P2.pos.x) / 2; float my = (P1.pos.y + P2.pos.y) / 2;
  float dx = P2.pos.x - P1.pos.x; float dy = P2.pos.y - P1.pos.y; float len = sqrt(dx * dx + dy * dy) + 0.000001;
  cm1.pos.x = mx - 40 * dy / len; cm1.pos.y = my + 40 * dx / len;
  cm2.pos.x = mx + 40 * dy / len; cm2.pos.y = my - 40 * dx / len;

  // Биссектриса угла между l1 и l2: направление — сумма единичных векторов сторон,
  // точка — их пересечение (если прямые почти параллельны, используем сумму направлений от центра поля)
  float u1x = F1.pos.x - E1.pos.x; float u1y = F1.pos.y - E1.pos.y; float n1 = sqrt(u1x * u1x + u1y * u1y) + 0.000001;
  float u2x = F2.pos.x - E2.pos.x; float u2y = F2.pos.y - E2.pos.y; float n2 = sqrt(u2x * u2x + u2y * u2y) + 0.000001;
  u1x = u1x / n1; u1y = u1y / n1; u2x = u2x / n2; u2y = u2y / n2;
  if (u1x * u2x + u1y * u2y < 0) { u2x = -u2x; u2y = -u2y; }
  float det = u1x * u2y - u1y * u2x;
  float ix = 0; float iy = 0;
  if (abs(det) > 0.02) {
    float k = ((E2.pos.x - E1.pos.x) * u2y - (E2.pos.y - E1.pos.y) * u2x) / det;
    ix = E1.pos.x + k * u1x; iy = E1.pos.y + k * u1y;
  }
  float bx = u1x + u2x; float by = u1y + u2y; float bl = sqrt(bx * bx + by * by) + 0.000001;
  bx = bx / bl; by = by / bl;
  cm3.pos.x = ix - 40 * bx; cm3.pos.y = iy - 40 * by;
  cm4.pos.x = ix + 40 * bx; cm4.pos.y = iy + 40 * by;

  if (tab == 1) {
    info = "**Складывание, совмещающее точки P₁ и P₂**, — сгиб (зелёный) есть их серединный перпендикуляр: геометрическое место точек, равноудалённых от P₁ и P₂. При таком сгибе часть листа с P₁ точно накладывается на часть с P₂ (пунктир — отрезок, который перегибается пополам).";
  } else {
    info = "**Складывание, совмещающее прямые** — сгиб (зелёный) есть биссектриса одного из углов между ними: при отражении относительно него одна прямая переходит в другую. Если прямые параллельны, сгиб — прямая, проходящая посередине между ними.";
  }
}
]
