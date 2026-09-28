[
description = "{info}"

field width = 16;
field height = 12;
camera type = fixed;

// ---- ABCD — произвольный четырёхугольник (все вершины свободны). Внизу — проверка
// признаков явного определения квадрата: род (четырёхугольник) выполнен всегда,
// видовые отличия (равные стороны, прямые углы) — в зависимости от формы. ----
new Point { name = "A"; pos = (-5, -3.5) }
new Point { name = "B"; pos = (5, -3) }
new Point { name = "C"; pos = (4, 4) }
new Point { name = "D"; pos = (-4, 3.5) }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "abcd"; elements = (ab, bc, cd, da) }

new Angle { name = "angA"; lines = (ab, da) }
new Angle { name = "angB"; lines = (ab, bc) }
new Angle { name = "angC"; lines = (bc, cd) }
new Angle { name = "angD"; lines = (cd, da) }
draw Angle { name = "arcA"; angle = "angA" }
draw Angle { name = "arcB"; angle = "angB" }
draw Angle { name = "arcC"; angle = "angC" }
draw Angle { name = "arcD"; angle = "angD" }

string info = "";

Update {
  float s1 = ab.length; float s2 = bc.length; float s3 = cd.length; float s4 = da.length;
  float smax = max(max(s1, s2), max(s3, s4)); float smin = min(min(s1, s2), min(s3, s4));
  float eqSides = 0; if (smax - smin < 0.15) { eqSides = 1; }
  float a1 = angA.measure; float a2 = angB.measure; float a3 = angC.measure; float a4 = angD.measure;
  float rightA = 0; if (abs(a1 - 90) < 3 && abs(a2 - 90) < 3 && abs(a3 - 90) < 3 && abs(a4 - 90) < 3) { rightA = 1; }

  info = "**Явное определение** называет ближайший род и видовое отличие: [квадрат] есть [четырёхугольник] с [равными сторонами] и [прямыми углами].\n\nABCD — четырёхугольник, род выполнен всегда.\n\n";
  if (eqSides == 1) { info = info + "Стороны равны: AB = BC = CD = DA ≈ " + format(s1, 2) + " — первый признак **выполнен**.\n\n"; }
  else { info = info + "Стороны не равны (AB = " + format(s1, 2) + ", BC = " + format(s2, 2) + ", CD = " + format(s3, 2) + ", DA = " + format(s4, 2) + ") — первый признак не выполнен.\n\n"; }
  if (rightA == 1) { info = info + "Все углы прямые — второй признак **выполнен**.\n\n"; }
  else { info = info + "Углы не все прямые (∠A = " + format(a1, 0) + "°, ∠B = " + format(a2, 0) + "°, ∠C = " + format(a3, 0) + "°, ∠D = " + format(a4, 0) + "°) — второй признак не выполнен.\n\n"; }
  if (eqSides == 1 && rightA == 1) { info = info + "Оба видовых отличия выполнены — по определению ABCD **квадрат**."; }
  else { info = info + "Не все видовые отличия выполнены — под определение квадрата ABCD не подходит, это просто четырёхугольник."; }
}
]
