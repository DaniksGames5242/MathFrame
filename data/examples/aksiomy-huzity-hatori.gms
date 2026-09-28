[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- O1: совмещение двух точек — сгиб есть серединный перпендикуляр (линейное уравнение) ----
new Point { name = "P1"; pos = (-5, -2); text = true("P₁"); pauseOnDrag = false }
new Point { name = "P2"; pos = (3, 2.5); text = true("P₂"); pauseOnDrag = false }
new Point { name = "c1a"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "c1b"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "cr1"; pos = (c1a, c1b); color = #22c55e; thickness = 3 }
new Claster { name = "tabO1"; elements = (P1, P2, cr1); active = true }

// ---- O2: совмещение двух прямых — сгиб есть биссектриса (тоже линейное уравнение) ----
new Point { name = "E1"; pos = (-6, -3.5); pauseOnDrag = false }
new Point { name = "F1"; pos = (-1, 3.5); pauseOnDrag = false }
new Point { name = "E2"; pos = (6, -3.5); pauseOnDrag = false }
new Point { name = "F2"; pos = (1, 3.5); pauseOnDrag = false }
new Line { name = "l1"; pos = (E1, F1) }
new Line { name = "l2"; pos = (E2, F2) }
new Point { name = "c2a"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "c2b"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "cr2"; pos = (c2a, c2b); color = #22c55e; thickness = 3 }
new Claster { name = "tabO2"; elements = (E1, F1, E2, F2, l1, l2, cr2); active = false }

// ---- O3: совмещение точки с прямой — сгиб касается параболы (фокус P, директриса d): квадратное уравнение ----
new Point { name = "P3"; pos = (-3, 1); text = true("P"); pauseOnDrag = false }
new Point { name = "D1"; pos = (-7, -3); dynamic = false; collision = false; active = false }
new Point { name = "D2"; pos = (7, -3); dynamic = false; collision = false; active = false }
new Line { name = "dline"; pos = (D1, D2); color = #f59e0b }
new Point { name = "Q"; pos = (2, -3); text = true("Q"); pauseOnDrag = false }
new Point { name = "F3"; pos = (0, 0); dynamic = false; collision = false; size = 0.5 }
new Point { name = "c3a"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "c3b"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "cr3"; pos = (c3a, c3b); color = #22c55e; thickness = 3 }
new Line { name = "toQ"; pos = (P3, F3); active = false; interact = false }
draw Punctir { name = "eQ"; edge = "toQ" }
new Claster { name = "tabO3"; elements = (P3, D1, D2, dline, Q, F3, cr3, toQ, eQ); active = false }

new UI { name = "bO1"; type = button; label = "O1: точка → точка"; action = "tab = 1; tabO1.active = true; tabO2.active = false; tabO3.active = false" }
new UI { name = "bO2"; type = button; label = "O2: прямая → прямая"; action = "tab = 2; tabO1.active = false; tabO2.active = true; tabO3.active = false" }
new UI { name = "bO3"; type = button; label = "O3: точка → прямая"; action = "tab = 3; tabO1.active = false; tabO2.active = false; tabO3.active = true" }

// ---- Логика ----
float tab = 1;
string info = "";

Update {
  float mx = (P1.pos.x + P2.pos.x) / 2; float my = (P1.pos.y + P2.pos.y) / 2;
  float dx = P2.pos.x - P1.pos.x; float dy = P2.pos.y - P1.pos.y; float len = sqrt(dx * dx + dy * dy) + 0.000001;
  c1a.pos.x = mx - 40 * dy / len; c1a.pos.y = my + 40 * dx / len;
  c1b.pos.x = mx + 40 * dy / len; c1b.pos.y = my - 40 * dx / len;

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
  c2a.pos.x = ix - 40 * bx; c2a.pos.y = iy - 40 * by;
  c2b.pos.x = ix + 40 * bx; c2b.pos.y = iy + 40 * by;

  // O3: сгиб — касательная к параболе (фокус P3, директриса dline) при условии прохождения через Q.
  // Точка касания F3 на директрисе такая, что сгиб — серединный перпендикуляр к P3F3, проходящий через Q:
  // из |QP3| = |QF3| и F3 на прямой dline решаем квадратное уравнение на x координату F3.
  float ddy = dline.length; // не используется, оставлено для читаемости
  float dyLine = D2.pos.y - D1.pos.y; float dxLine = D2.pos.x - D1.pos.x; float dl = sqrt(dxLine * dxLine + dyLine * dyLine) + 0.000001;
  // параметризация директрисы: X(t) = D1 + t*(D2-D1)
  float ax = D1.pos.x; float ay = D1.pos.y; float ex = dxLine; float ey = dyLine;
  float qx = Q.pos.x; float qy = Q.pos.y; float px = P3.pos.x; float py = P3.pos.y;
  // |Q - (A+tE)|^2 = |Q - P3|^2  →  квадратное по t
  float A2 = ex * ex + ey * ey;
  float B2 = -2 * (ex * (qx - ax) + ey * (qy - ay));
  float C2 = (qx - ax) ^ 2 + (qy - ay) ^ 2 - ((qx - px) ^ 2 + (qy - py) ^ 2);
  float Disc = B2 * B2 - 4 * A2 * C2;
  float t = -B2 / (2 * A2 + 0.000001);
  if (Disc >= 0) { t = (-B2 + sqrt(Disc)) / (2 * A2 + 0.000001); }
  F3.pos.x = ax + t * ex; F3.pos.y = ay + t * ey;
  float mmx = (P3.pos.x + F3.pos.x) / 2; float mmy = (P3.pos.y + F3.pos.y) / 2;
  float ddx = F3.pos.x - P3.pos.x; float ddy2 = F3.pos.y - P3.pos.y; float dlen = sqrt(ddx * ddx + ddy2 * ddy2) + 0.000001;
  c3a.pos.x = mmx - 40 * ddy2 / dlen; c3a.pos.y = mmy + 40 * ddx / dlen;
  c3b.pos.x = mmx + 40 * ddy2 / dlen; c3b.pos.y = mmy - 40 * ddx / dlen;

  if (tab == 1) {
    info = "**Аксиома O1.** Для любых двух точек P₁, P₂ существует единственный сгиб (зелёный) — их серединный перпендикуляр, совмещающий точки при перегибе. Уравнение на линию сгиба — линейное.";
  } else if (tab == 2) {
    info = "**Аксиома O2.** Для двух прямых существует сгиб — биссектриса угла между ними, совмещающая прямые. Тоже линейное уравнение (при параллельных прямых сгиб проходит посередине).";
  } else {
    info = "**Аксиома O3 (частный случай O4: сгиб дополнительно проходит через Q).** Точка P совмещается с прямой d — сгиб касается параболы с фокусом P и директрисой d (жёлтая), то есть равноудалён от P и от точки F на d. Условие прохождения сгиба через Q даёт квадратное уравнение на положение F. Аксиомы O6–O7 (совмещение сразу двух пар «точка–прямая») сводятся к кубическому уравнению и дают трисекцию угла и удвоение куба — на плоском рисунке их не показать одной прямой.";
  }
}
]
