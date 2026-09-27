[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float t = 60; string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
new Point { name = "A"; pos = (-7, 0); dynamic = false; collision = false; text = true("A") }
new Point { name = "B"; pos = (7, 0); dynamic = false; collision = false; text = true("B") }
new Point { name = "C"; pos = (0, 4); dynamic = false; collision = false; text = true("C") }
new Line { name = "oa"; pos = (O, A) }
new Line { name = "ob"; pos = (O, B) }
new Line { name = "oc"; pos = (O, C) }
new Angle { name = "angAOC"; lines = (oa, oc) }
new Angle { name = "angCOB"; lines = (oc, ob) }
draw Angle { name = "arc1"; angle = "angAOC" }
draw Angle { name = "arc2"; angle = "angCOB" }
new UI { type = slider; label = "положение луча OC"; variable = t; min = 5; max = 175; step = 1; default = 60 }
Update {
  float rad = t * pi / 180; C.pos.x = 4.2 * cos(rad); C.pos.y = 4.2 * sin(rad);
  string vid = "один острый, другой тупой"; if (abs(angAOC.measure - 90) < 2) { vid = "оба прямые (тогда это один развёрнутый угол)"; }
  info = "**Смежные углы AOC и COB**: общая вершина O, общая сторона OC, а необщие стороны OA и OB лежат на одной прямой.\n\nAOC = " + format(angAOC.measure, 0) + "°, COB = " + format(angCOB.measure, 0) + "° — в сумме всегда 180°: " + vid + ".";
}
]
