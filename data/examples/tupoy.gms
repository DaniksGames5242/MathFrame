[
description = "{info}"
field width = 12; field height = 10;
camera type = fixed;
float deg = 120; string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "A"; pos = (4, 0); dynamic = false; collision = false }
new Point { name = "B"; pos = (-2, 3.46); dynamic = false; collision = false; color = #f59e0b }
new Line { name = "oa"; pos = (O, A) }
new Line { name = "ob"; pos = (O, B) }
new Angle { name = "ang"; lines = (oa, ob) }
draw Angle { name = "da"; angle = "ang" }
new UI { type = slider; label = "величина угла"; variable = deg; min = 91; max = 179; step = 1; default = 120 }
Update {
  B.pos.x = 4 * cos(deg * 3.14159 / 180); B.pos.y = 4 * sin(deg * 3.14159 / 180);
  info = "**Тупой угол** AOB строго больше прямого и меньше развёрнутого: 90° < ∠AOB < 180°. Сейчас ∠AOB = " + format(deg, 0) + "°.";
}
]
