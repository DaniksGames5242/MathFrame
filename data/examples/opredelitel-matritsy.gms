[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;
show axes = true;
show grid = true;

// ---- Столбцы матрицы — векторы a = (a₁₁, a₂₁) и b = (a₁₂, a₂₂) из начала координат ----
// Концы векторов перетаскиваются (с шагом 0.5). Определитель — ориентированная площадь
// параллелограмма, натянутого на столбцы: положительный — синий, отрицательный — оранжевый.
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; size = 0.6 }
new Point { name = "A"; pos = (3, 1); text = true("a"); pauseOnDrag = false; color = #3b82f6 }
new Point { name = "B"; pos = (1, 2.5); text = true("b"); pauseOnDrag = false; color = #22c55e }
new Point { name = "AB"; pos = (4, 3.5); dynamic = false; collision = false; size = 0.5 }
new Line { name = "oa"; pos = (O, A); color = #3b82f6; thickness = 3; interact = false; layer = 12 }
new Line { name = "ob"; pos = (O, B); color = #22c55e; thickness = 3; interact = false; layer = 12 }
draw Vector { name = "va"; edge = "oa"; pos = 1; color = #3b82f6; thickness = 3 }
draw Vector { name = "vb"; edge = "ob"; pos = 1; color = #22c55e; thickness = 3 }
new Line { name = "a_ab"; pos = (A, AB); interact = false }
new Line { name = "b_ab"; pos = (B, AB); interact = false }
new Line { name = "o_a"; pos = (O, A); color = "transparent"; interact = false }
new Line { name = "o_b"; pos = (O, B); color = "transparent"; interact = false }
new Figure { name = "par"; elements = (o_a, a_ab, b_ab, o_b); interact = false }
draw Filling { name = "parFill"; figure = "par"; color = fillColor; opacity = 0.3 }

// ---- Логика ----
string info = "";
string fillColor = "#3b82f6";

Function num(v) { if (v < 0) { return "−" + format(abs(v), 1); } return format(v, 1); }

Update {
  A.pos.x = round(A.pos.x * 2) / 2; A.pos.y = round(A.pos.y * 2) / 2;
  B.pos.x = round(B.pos.x * 2) / 2; B.pos.y = round(B.pos.y * 2) / 2;
  AB.pos.x = A.pos.x + B.pos.x; AB.pos.y = A.pos.y + B.pos.y;
  float det = A.pos.x * B.pos.y - B.pos.x * A.pos.y;
  fillColor = "#3b82f6";
  if (det < 0) { fillColor = "#f59e0b"; }

  info = "**Определитель матрицы 2×2** — ориентированная площадь параллелограмма, натянутого на её столбцы a и b: det = a₁₁a₂₂ − a₁₂a₂₁.\n\ndet [[" + num(A.pos.x) + ", " + num(B.pos.x) + "], [" + num(A.pos.y) + ", " + num(B.pos.y) + "]] = " + num(A.pos.x) + "·" + num(B.pos.y) + " − " + num(B.pos.x) + "·" + num(A.pos.y) + " = **" + num(det) + "**.";
  if (det > 0) { info = info + " Знак «+»: поворот от a к b — против часовой стрелки."; }
  if (det < 0) { info = info + " Знак «−»: поворот от a к b — по часовой стрелке (ориентация сменилась)."; }
  if (det == 0) { info = info + " Столбцы коллинеарны — параллелограмм вырождается в отрезок, матрица вырожденная (необратимая)."; }
}
]
