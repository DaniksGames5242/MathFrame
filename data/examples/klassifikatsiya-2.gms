[
description = "{info}"

field width = 22;
field height = 14;
camera type = fixed;

// ---- Слева — четырёхугольник ABCD, все вершины свободно перетаскиваются. Справа —
// решётка классов: подсвечивается тот узел, которому фигура соответствует прямо сейчас. ----
new Point { name = "A"; pos = (-9.5, -5); text = true("A") }
new Point { name = "B"; pos = (-2.5, -5.5); text = true("B") }
new Point { name = "C"; pos = (-1, 1.5); text = true("C") }
new Point { name = "D"; pos = (-8, 2); text = true("D") }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "abcd"; elements = (ab, bc, cd, da) }

// ---- Решётка классов: общий четырёхугольник → трапеция → параллелограмм → {ромб, прямоугольник} → квадрат.
draw Graph { name = "lattice"; graph = "g"; nodeRadius = 0; edgeWidth = 2 }
draw Text { name = "n0"; pos = (3.5, -5.2); text = "четырёхугольник"; size = 0.85; color = clr(0) }
draw Text { name = "n1"; pos = (3.5, -3); text = "трапеция"; size = 0.85; color = clr(1) }
draw Text { name = "n2"; pos = (3.5, -0.8); text = "параллелограмм"; size = 0.85; color = clr(2) }
draw Text { name = "n3"; pos = (1.8, 1.4); text = "ромб"; size = 0.85; color = clr(3) }
draw Text { name = "n4"; pos = (5.2, 1.4); text = "прямоугольник"; size = 0.85; color = clr(4) }
draw Text { name = "n5"; pos = (3.5, 3.6); text = "квадрат"; size = 0.85; color = clr(5) }

string info = "";
float cls = 0; // 0..5 по номерам узлов выше
float eps = 0;

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function clr(k) { if (cls == k) { return "#3b82f6"; } return "#9ca3af"; }

Update {
  float ax = A.pos.x; float ay = A.pos.y;
  float bx = B.pos.x; float by = B.pos.y;
  float cx = C.pos.x; float cy = C.pos.y;
  float dx = D.pos.x; float dy = D.pos.y;

  float abx = bx - ax; float aby = by - ay;
  float dcx = cx - dx; float dcy = cy - dy;
  float bcx = cx - bx; float bcy = cy - by;
  float adx = dx - ax; float ady = dy - ay;

  float abL = sqrt(abx * abx + aby * aby);
  float dcL = sqrt(dcx * dcx + dcy * dcy);
  float bcL = sqrt(bcx * bcx + bcy * bcy);
  float adL = sqrt(adx * adx + ady * ady);

  eps = 0.06 * (abL + dcL + bcL + adL) / 4 + 0.01;
  // Параллельность через векторное произведение направлений (нормировано длинами).
  float parAbDc = abs(abx * dcy - aby * dcx) / (abL * dcL) < eps;
  float parBcAd = abs(bcx * ady - bcy * adx) / (bcL * adL) < eps;
  float eqAbDc = abs(abL - dcL) < eps * 3;
  float eqBcAd = abs(bcL - adL) < eps * 3;
  float isPar = parAbDc == 1 && parBcAd == 1;
  float isTrap = (parAbDc == 1 || parBcAd == 1) && isPar == 0;
  float eqSides = abs(abL - bcL) < eps * 3 && abs(bcL - dcL) < eps * 3;
  float isRhomb = isPar == 1 && eqSides == 1;
  float dotAbBc = abx * bcx + aby * bcy;
  float isRight = isPar == 1 && abs(dotAbBc) / (abL * bcL) < eps;
  float isRect = isPar == 1 && isRight == 1;
  float isSquare = isRhomb == 1 && isRect == 1;

  if (isSquare == 1) { cls = 5; }
  else if (isRect == 1) { cls = 4; }
  else if (isRhomb == 1) { cls = 3; }
  else if (isPar == 1) { cls = 2; }
  else if (isTrap == 1) { cls = 1; }
  else { cls = 0; }

  g = newGraph();
  addNode(g, "n0", [3.5, -5.4], "");
  addNode(g, "n1", [3.5, -3.2], "");
  addNode(g, "n2", [3.5, -1], "");
  addNode(g, "n3", [2, 1.2], "");
  addNode(g, "n4", [5, 1.2], "");
  addNode(g, "n5", [3.5, 3.4], "");
  addEdge(g, "n0", "n1");
  addEdge(g, "n1", "n2");
  addEdge(g, "n2", "n3");
  addEdge(g, "n2", "n4");
  addEdge(g, "n3", "n5");
  addEdge(g, "n4", "n5");

  string name = "общий четырёхугольник";
  if (cls == 1) { name = "трапеция (ровно одна пара сторон параллельна)"; }
  if (cls == 2) { name = "параллелограмм (обе пары сторон параллельны)"; }
  if (cls == 3) { name = "ромб (параллелограмм с равными сторонами)"; }
  if (cls == 4) { name = "прямоугольник (параллелограмм с прямыми углами)"; }
  if (cls == 5) { name = "квадрат (и ромб, и прямоугольник)"; }

  info = "**Сейчас фигура — " + name + ".** Классификация строится по отношениям сторон: параллельность даёт трапецию и параллелограмм, дополнительное равенство сторон — ромб, дополнительная прямоугольность углов — прямоугольник, а оба условия вместе — квадрат.\n\n**Решётка по включению:** квадрат лежит на пересечении ромба и прямоугольника, которые вместе с общим параллелограммом — частный случай трапеции (условно, если считать параллельность обеих пар «трапецией в широком смысле»), а трапеция — частный случай произвольного четырёхугольника. Двигайте вершины, чтобы увидеть, как фигура поднимается и опускается по решётке.";
}
]
