[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Луч AB — неограниченная фигура: он простирается бесконечно в одну сторону.
// Пробный круг радиуса r с центром A растёт по ползунку; какой бы ни была граница,
// на луче найдётся точка вне круга — она отмечена. ----
new Point { name = "A"; pos = (-4, -1); text = true("A") }
new Point { name = "B"; pos = (-1, 1); text = true("B") }
new Line { name = "ray"; pos = (A, B); dynamic = false; interact = false }
draw Vector { name = "arrow"; edge = "ray" }
new Circle { name = "testCirc"; center = "A"; radius = rTest; interact = false; color = #f59e0b }
new Point { name = "far"; dynamic = false; collision = false; text = true("M"); color = #f59e0b }

new UI { name = "sR"; type = slider; label = "радиус пробного круга"; variable = rTest; min = 0.5; max = 40; step = 0.5; default = 3 }

// ---- Логика ----
float rTest = 3;
string info = "";

Update {
  // Точка M на луче AB дальше центра A, чем rTest — всегда есть, каким бы rTest ни был.
  float ux = B.pos.x - A.pos.x; float uy = B.pos.y - A.pos.y;
  float len = sqrt(ux * ux + uy * uy);
  float d = rTest + 2;
  far.pos.x = A.pos.x + ux / len * d;
  far.pos.y = A.pos.y + uy / len * d;

  info = "**Неограниченная фигура** — луч AB: он не помещается целиком ни в каком круге конечного радиуса. Пробный круг с центром A и радиусом r = " + format(rTest, 1) + " растёт по ползунку, но на луче всегда находится точка M на расстоянии r + 2 = " + format(d, 1) + " от A — вне круга, каким бы большим ни был r.\n\nДля сравнения: отрезок или треугольник всегда помещаются в достаточно большой круг — они ограниченны.";
}
]
