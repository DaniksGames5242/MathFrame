[
description = "{info}"

field width = 18; field height = 12;
camera type = fixed;

// ---- Прямоугольный треугольник: угол при A заблокирован в 90° (движок сам держит его
// перпендикулярным при перетаскивании любой вершины). M — середина гипотенузы BC,
// AM — медиана к гипотенузе; она же радиус окружности, описанной около треугольника. ----
new Point { name = "A"; pos = (-6, -4); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5, -4); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (-6, 4); text = true("C"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }

new Angle { name = "angA"; lines = (ab, ca); lock = true }
draw Angle { name = "arcA"; angle = "angA" }

new Point { name = "M"; construct = median; vertex = A; base = "bc"; dynamic = false; collision = false; text = true("M") }
new Line { name = "am"; pos = (A, M); interact = false }
new Line { name = "bm"; pos = (B, M); interact = false; color = "transparent" }
new Line { name = "mc"; pos = (M, C); interact = false; color = "transparent" }
draw EquallySing { name = "eqM"; edges = (am, bm, mc); type = 1 }

new Circle { name = "circ"; center = M; radius = B; color = #3b82f6; thickness = 2 }

// ---- Логика ----
string info = "";

Update {
  info = "**Медиана к гипотенузе:** AM = " + format(am.length, 2) + ", а половина гипотенузы BM = MC = " + format(bc.length / 2, 2) + " — равны, поэтому M равноудалена от всех трёх вершин и является центром окружности, описанной около треугольника ABC (её радиус R = " + format(am.length, 2) + ").";
}
]
