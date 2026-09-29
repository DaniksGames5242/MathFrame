[
description = "{info}"

field width = 16;
field height = 12;
camera type = fixed;

// Прямоугольник с центром в начале координат: угловая точка C свободна, три
// остальные вершины — её отражения. Прямые углы обеспечены осевой симметрией.
new Point { name = "C"; pos = (4, 3); text = true("C"); pauseOnDrag = false }
new Point { name = "A"; dynamic = false; collision = false; interact = false; text = true("A") }
new Point { name = "B"; dynamic = false; collision = false; interact = false; text = true("B") }
new Point { name = "D"; dynamic = false; collision = false; interact = false; text = true("D") }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "abcd"; elements = (ab, bc, cd, da) }

new Line { name = "ac"; pos = (A, C) }
new Line { name = "bd"; pos = (B, D) }

// Диагонали прямоугольника с центром в начале координат всегда пересекаются
// в точке O = (0, 0) — угол между ними меряем через луч OC и луч OB, у них
// общая вершина O (сама угловая точка не годится, у ac и bd её нет).
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; interact = false }
new Line { name = "oc"; pos = (O, C); active = false; interact = false }
new Line { name = "ob"; pos = (O, B); active = false; interact = false }
new Angle { name = "angDiag"; lines = (oc, ob) }
draw Angle { name = "arcDiag"; angle = "angDiag"; measure = false }

string info = "";

Update {
  // Угловая точка не подпускается ближе 1.2 к центру (иначе прямоугольник
  // вырождается в отрезок) и не выпускается за поле.
  float px = C.pos.x; float py = C.pos.y;
  if (px < 1.2) { px = 1.2; }
  if (py < 1.2) { py = 1.2; }
  if (px > fieldMaxX) { px = fieldMaxX; }
  if (py > fieldMaxY) { py = fieldMaxY; }
  C.pos.x = px; C.pos.y = py;
  A.pos.x = -px; A.pos.y = -py;
  B.pos.x = px; B.pos.y = -py;
  D.pos.x = -px; D.pos.y = py;

  float w = px * 2; float h = py * 2;
  if (abs(w - h) < 0.05) {
    info = "**Стороны равны:** AB = CD = " + format(w, 2) + ", BC = DA = " + format(h, 2) + " — прямоугольник стал квадратом.\n\n**Диагонали равны и перпендикулярны:** AC = BD = " + format(ac.length, 2) + ", угол между ними " + format(angDiag.measure, 0) + "°.";
  } else {
    info = "**Стороны прямоугольника:** AB = CD = " + format(w, 2) + ", BC = DA = " + format(h, 2) + ".\n\n**Диагонали равны, но не перпендикулярны:** AC = BD = " + format(ac.length, 2) + ", угол между ними " + format(angDiag.measure, 0) + "°. Угол становится 90° ровно тогда, когда стороны равны.";
  }
}
]
