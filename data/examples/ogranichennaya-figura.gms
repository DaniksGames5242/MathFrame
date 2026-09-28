[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Ограниченная фигура — отрезок AB (обе точки свободны). Он целиком содержится
// в наименьшем описанном круге: центр — середина AB, радиус — половина длины AB. ----
new Point { name = "A"; pos = (-4, -1.5); text = true("A") }
new Point { name = "B"; pos = (3.5, 1.5); text = true("B") }
new Line { name = "ab"; pos = (A, B) }
new Point { name = "O"; construct = median; vertex = A; base = "ab"; dynamic = false; text = true("O"); color = #f59e0b }
new Circle { name = "circ"; center = "O"; radius = r; interact = false }

// ---- Логика ----
float r = 0;
string info = "";

Update {
  r = ab.length / 2;
  info = "**Ограниченная фигура** — отрезок AB — целиком помещается в круге конечного радиуса: наименьший такой круг имеет центром середину O отрезка и радиус r = AB / 2 = " + format(r, 2) + ". Каждая точка отрезка удалена от O не больше чем на r — увеличить AB так, чтобы часть отрезка вышла за круг, невозможно.\n\nДля сравнения: у прямой или луча такого круга не существует ни при каком радиусе — они неограниченны.";
}
]
