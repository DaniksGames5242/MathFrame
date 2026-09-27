[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Описанная окружность и треугольник ABC (вершины и P ходят по окружности) ----
new Point { name = "O"; pos = (0, 0); dynamic = false; size = 0.6; collision = false }
new Circle { name = "w"; center = O; radius = 4 }
new Point { name = "A"; circle = "w"; t = 0.62; text = true("A"); pauseOnDrag = false }
new Point { name = "B"; circle = "w"; t = 0.83; text = true("B"); pauseOnDrag = false }
new Point { name = "C"; circle = "w"; t = 0.03; text = true("C"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca); interact = false }

// Основания перпендикуляров (вычисляются в Update) — общие для обеих вкладок
new Point { name = "F1"; pos = (0, 0); dynamic = false; collision = false; size = 0.7; color = #f59e0b }
new Point { name = "F2"; pos = (0, 0); dynamic = false; collision = false; size = 0.7; color = #f59e0b }
new Point { name = "F3"; pos = (0, 0); dynamic = false; collision = false; size = 0.7; color = #f59e0b }
// Продолжения сторон до оснований — пунктиром под сторонами
new Line { name = "e1"; pos = (B, F1); active = false }
new Line { name = "e2"; pos = (C, F2); active = false }
new Line { name = "e3"; pos = (A, F3); active = false }
draw Punctir { name = "pe1"; edge = "e1"; layer = 1 }
draw Punctir { name = "pe2"; edge = "e2"; layer = 1 }
draw Punctir { name = "pe3"; edge = "e3"; layer = 1 }

// ---- Вкладка 1: P на окружности — основания на одной прямой ----
new Point { name = "P"; circle = "w"; t = 0.28; text = true("P"); pauseOnDrag = false }
new Point { name = "H"; pos = (0, 0); dynamic = false; collision = false; text = true("H"); size = 0.7 }
new Point { name = "MH"; pos = (0, 0); dynamic = false; collision = false; size = 0.6 }
new Point { name = "S1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "S2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "simson"; pos = (S1, S2); color = #3b82f6; thickness = 3; interact = false }
new Line { name = "ph"; pos = (P, H); interact = false; active = false }
draw Punctir { name = "pph"; edge = "ph" }
new Line { name = "pf1"; pos = (P, F1); active = false }
new Line { name = "pf2"; pos = (P, F2); active = false }
new Line { name = "pf3"; pos = (P, F3); active = false }
draw Punctir { name = "ppf1"; edge = "pf1" }
draw Punctir { name = "ppf2"; edge = "pf2" }
draw Punctir { name = "ppf3"; edge = "pf3" }
new Line { name = "hm"; pos = (H, MH); active = false }
new Line { name = "mp"; pos = (MH, P); active = false }
draw EquallySing { name = "eqPH"; edges = (hm, mp); type = 1 }
new Claster { name = "tabOn"; elements = (P, H, MH, simson, pph, ppf1, ppf2, ppf3, eqPH); active = true }

// ---- Вкладка 2: Q не на окружности — основания образуют треугольник ----
new Point { name = "Q"; pos = (1.5, 1); text = true("Q"); pauseOnDrag = false }
new Line { name = "qf1"; pos = (Q, F1); active = false }
new Line { name = "qf2"; pos = (Q, F2); active = false }
new Line { name = "qf3"; pos = (Q, F3); active = false }
draw Punctir { name = "pqf1"; edge = "qf1" }
draw Punctir { name = "pqf2"; edge = "qf2" }
draw Punctir { name = "pqf3"; edge = "qf3" }
new Line { name = "g12"; pos = (F1, F2); color = #3b82f6; thickness = 3; interact = false }
new Line { name = "g23"; pos = (F2, F3); color = #3b82f6; thickness = 3; interact = false }
new Line { name = "g31"; pos = (F3, F1); color = #3b82f6; thickness = 3; interact = false }
new Claster { name = "tabOff"; elements = (Q, pqf1, pqf2, pqf3, g12, g23, g31); active = false }

new UI { name = "btnOn"; type = button; label = "Точка на окружности"; action = "tab = 1; tabOn.active = true; tabOff.active = false" }
new UI { name = "btnOff"; type = button; label = "Точка вне окружности"; action = "tab = 2; tabOn.active = false; tabOff.active = true" }

// ---- Логика ----
float tab = 1;
string info = "";
float fx = 0; float fy = 0;

// Основание перпендикуляра из (px, py) на прямую через (ax, ay), (bx, by) → (fx, fy)
Function foot(px, py, ax, ay, bx, by) {
  float dx = bx - ax; float dy = by - ay;
  float k = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy + 0.000000001);
  fx = ax + k * dx; fy = ay + k * dy;
  return 0;
}
Function setFeet(X) {
  foot(X.pos.x, X.pos.y, B.pos.x, B.pos.y, C.pos.x, C.pos.y); F1.pos.x = fx; F1.pos.y = fy;
  foot(X.pos.x, X.pos.y, C.pos.x, C.pos.y, A.pos.x, A.pos.y); F2.pos.x = fx; F2.pos.y = fy;
  foot(X.pos.x, X.pos.y, A.pos.x, A.pos.y, B.pos.x, B.pos.y); F3.pos.x = fx; F3.pos.y = fy;
  return 0;
}

Update {
  // Q не заходит на окружность вплотную (иначе треугольник оснований вырождается) и в поле
  float rq = sqrt(Q.pos.x ^ 2 + Q.pos.y ^ 2);
  if (abs(rq - 4) < 0.4 && rq > 0.001) {
    float rt = 3.6; if (rq > 4) { rt = 4.4; }
    Q.pos.x = Q.pos.x * rt / rq; Q.pos.y = Q.pos.y * rt / rq;
  }
  if (tab == 1) { setFeet(P); } else { setFeet(Q); }

  // Ортоцентр: H = A + B + C − 2O (O — центр описанной окружности, здесь начало координат)
  H.pos.x = A.pos.x + B.pos.x + C.pos.x; H.pos.y = A.pos.y + B.pos.y + C.pos.y;
  MH.pos.x = (P.pos.x + H.pos.x) / 2; MH.pos.y = (P.pos.y + H.pos.y) / 2;

  // Отрезок прямой Симсона: от крайнего основания до крайнего, с запасом 1
  float dx = F3.pos.x - F1.pos.x; float dy = F3.pos.y - F1.pos.y;
  if (dx * dx + dy * dy < 0.0001) { dx = F2.pos.x - F1.pos.x; dy = F2.pos.y - F1.pos.y; }
  float l = sqrt(dx * dx + dy * dy) + 0.000001; dx = dx / l; dy = dy / l;
  float t2 = (F2.pos.x - F1.pos.x) * dx + (F2.pos.y - F1.pos.y) * dy;
  float t3 = (F3.pos.x - F1.pos.x) * dx + (F3.pos.y - F1.pos.y) * dy;
  float tm = (MH.pos.x - F1.pos.x) * dx + (MH.pos.y - F1.pos.y) * dy;
  float lo = min(0, t2, t3, tm) - 1; float hi = max(0, t2, t3, tm) + 1;
  S1.pos.x = F1.pos.x + dx * lo; S1.pos.y = F1.pos.y + dy * lo;
  S2.pos.x = F1.pos.x + dx * hi; S2.pos.y = F1.pos.y + dy * hi;

  if (tab == 1) {
    info = "**Прямая Симсона:** основания перпендикуляров, опущенных из точки P описанной окружности на прямые, содержащие стороны треугольника, лежат на одной прямой.\n\nЭта прямая делит пополам отрезок PH, где H — ортоцентр треугольника.";
  } else {
    float s = abs((F2.pos.x - F1.pos.x) * (F3.pos.y - F1.pos.y) - (F2.pos.y - F1.pos.y) * (F3.pos.x - F1.pos.x)) / 2;
    info = "**Для точки не на описанной окружности** основания перпендикуляров не лежат на одной прямой — они образуют треугольник.\n\nOQ = " + format(rq, 2) + " (радиус 4), площадь треугольника оснований " + format(s, 2) + ". Чем ближе Q к окружности, тем он площе.";
  }
}
]
