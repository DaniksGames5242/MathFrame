[
description = "{info}"

field width = 16; field height = 10;
camera type = fixed;

// ---- Отрезок AB (концы свободны). M — его середина. Перпендикулярная прямая через M
// строится как полная прямая (концы E1, E2 далеко за полем в обе стороны, чтобы прямая
// была видна целиком), поскольку серединный перпендикуляр — не отрезок, а прямая.
// P — точка на этой прямой (line = "perp"), движок сам держит её в поле. Отрезки PA и PB
// равны при любом положении P — в этом всё геометрическое место точек. ----
new Point { name = "A"; pos = (-6, -2); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5, 1); text = true("B"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }

new Point { name = "M"; construct = median; vertex = A; base = "ab"; dynamic = false; collision = false; text = true("M") }
new Point { name = "E1"; pos = (0, 5); dynamic = false; collision = false }
new Point { name = "E2"; pos = (0, -5); dynamic = false; collision = false }
new Line { name = "perp"; pos = (E1, E2); interact = false }
// Невидимые лучи из M — только чтобы отметить прямой угол между перпендикуляром и AB
// (углу нужна общая вершина у обеих линий, а у "perp" и "ab" общих точек-объектов нет).
new Line { name = "mUp"; pos = (M, E1); color = "transparent"; interact = false; layer = 1 }
new Line { name = "mA"; pos = (M, A); color = "transparent"; interact = false; layer = 1 }
new Angle { name = "angM"; lines = (mUp, mA) }
draw Angle { name = "arcM"; angle = "angM"; measure = false }

new Point { name = "P"; line = "perp"; t = 0.65; text = true("P"); collideWithPoints = false }
new Line { name = "pa"; pos = (P, A); interact = false }
new Line { name = "pb"; pos = (P, B); interact = false }
draw EquallySing { name = "eqPaPb"; edges = (pa, pb); type = 1 }

// ---- Логика ----
string info = "";

Update {
  float mx = (A.pos.x + B.pos.x) / 2; float my = (A.pos.y + B.pos.y) / 2;
  float dx = -(B.pos.y - A.pos.y); float dy = B.pos.x - A.pos.x;
  float len = sqrt(dx * dx + dy * dy);
  dx = dx / len; dy = dy / len;
  E1.pos.x = mx + dx * 15; E1.pos.y = my + dy * 15;
  E2.pos.x = mx - dx * 15; E2.pos.y = my - dy * 15;

  float pa2 = pa.length; float pb2 = pb.length;
  float half = ab.length / 2;
  float h = sqrt(max(pa2 * pa2 - half * half, 0));

  info = "**Каждая точка серединного перпендикуляра равноудалена от концов отрезка:** PA = " + format(pa2, 2) + ", PB = " + format(pb2, 2) + " — равны при любом положении P на прямой.\n\n**По теореме Пифагора:** PA = √(AM² + PM²) = √(" + format(half, 2) + "² + " + format(h, 2) + "²) = " + format(pa2, 2) + ".";
}
]
