[
description = "{info}"

field width = 18;
field height = 11;
camera type = fixed;

// ---- Прямая l = AB и точка P вне неё (обе свободны). Через P проходит прямая с
// направлением, отличным от AB на угол δ (ползунок): при δ = 0 она параллельна AB
// и не пересекает её, при любом δ ≠ 0 пересекает — ровно одна прямая через P не
// пересекает l. ----
new Point { name = "A"; pos = (-7, -2); text = true("A") }
new Point { name = "B"; pos = (6, 1); text = true("B") }
new Line { name = "l"; pos = (A, B); dynamic = false; interact = false }
new Point { name = "P"; pos = (-2, 3.5); text = true("P"); color = #f59e0b }

new Point { name = "Q1"; dynamic = false; collision = false; active = false }
new Point { name = "Q2"; dynamic = false; collision = false; active = false }
new Line { name = "m"; pos = (Q1, Q2); dynamic = false; interact = false; color = #f59e0b }
new Point { name = "X"; dynamic = false; collision = false; text = true("X"); color = #22c55e; active = hasX > 0.5 }

new UI { name = "sD"; type = slider; label = "угол δ°"; variable = delta; min = -35; max = 35; step = 1; default = 0 }

// ---- Логика ----
float delta = 0;
float hasX = 0;
string info = "";

Update {
  float ux = B.pos.x - A.pos.x; float uy = B.pos.y - A.pos.y;
  float r = radians(delta);
  // Направление прямой через P: направление AB, повёрнутое на δ.
  float vx = ux * cos(r) - uy * sin(r); float vy = ux * sin(r) + uy * cos(r);
  Q1.pos.x = P.pos.x - vx; Q1.pos.y = P.pos.y - vy;
  Q2.pos.x = P.pos.x + vx; Q2.pos.y = P.pos.y + vy;

  // Пересечение прямых l (A + t·u) и m (P + s·v): решаем t·ux − s·vx = Px − Ax, t·uy − s·vy = Py − Ay.
  float det = -ux * vy + uy * vx;
  hasX = 0;
  if (abs(det) > 0.00001) {
    float t = ((P.pos.x - A.pos.x) * (-vy) - (P.pos.y - A.pos.y) * (-vx)) / det;
    X.pos.x = A.pos.x + t * ux; X.pos.y = A.pos.y + t * uy;
    hasX = 1;
  }

  info = "**Аксиома параллельных:** через точку P, не лежащую на прямой l = AB, проходит не более одной прямой, не пересекающей l. Прямая через P сейчас отклонена от направления l на δ = " + format(delta, 0) + "°.\n\n" + iif(hasX > 0.5, "При δ ≠ 0 она пересекает l — точка пересечения X найдена.", "При δ = 0 прямая через P параллельна l — они не пересекаются, и это единственное такое направление.");
}

Function iif(c, s1, s2) { if (c) { return s1; } return s2; }
]
