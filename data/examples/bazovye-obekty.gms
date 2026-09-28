[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Точки A, B задают прямую (единственную, проходящую через обе). Точка P свободна:
// прямая делит поле на две полуплоскости, и Update определяет, в какой из них P. ----
new Point { name = "A"; pos = (-5, -1); text = true("A") }
new Point { name = "B"; pos = (4, 1.5); text = true("B") }
new Line { name = "l"; pos = (A, B); dynamic = false; interact = false }
new Point { name = "P"; pos = (-1, 3); text = true("P"); color = #f59e0b }

draw Text { name = "side"; pos = (P.pos.x, P.pos.y - 0.9); text = sideText; size = 0.9; color = #f59e0b }

// ---- Логика ----
string info = "";
string sideText = "";
float s = 0;

Update {
  // Знак векторного произведения AB × AP определяет полуплоскость.
  float ux = B.pos.x - A.pos.x; float uy = B.pos.y - A.pos.y;
  float vx = P.pos.x - A.pos.x; float vy = P.pos.y - A.pos.y;
  s = ux * vy - uy * vx;
  sideText = "полуплоскость " + iif(s > 0, "I", "II");

  info = "**Прямая** AB — бесконечное множество точек, однозначно определённое двумя точками A и B: через них проходит ровно одна прямая. Она делит плоскость на две полуплоскости.\n\n**Точка** P не имеет измерений — она лишь указывает положение. Сейчас P лежит в " + sideText + " (перетащите P через прямую AB, чтобы увидеть смену полуплоскости).";
}

Function iif(c, a, b) { if (c) { return a; } return b; }
]
