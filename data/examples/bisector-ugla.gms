[
description = "{info}"
field width = 14; field height = 10;
camera type = fixed;
float t = 100; string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
new Point { name = "A"; pos = (4.5, 0); dynamic = false; collision = false; text = true("A") }
new Point { name = "B"; pos = (4.5, 0); dynamic = false; collision = false; text = true("B") }
new Point { name = "C"; pos = (4.5, 0); dynamic = false; collision = false; text = true("C") }
new Line { name = "oa"; pos = (O, A) }
new Line { name = "ob"; pos = (O, B) }
new Line { name = "oc"; pos = (O, C); color = #f59e0b }
new Angle { name = "angAOC"; lines = (oa, oc) }
new Angle { name = "angCOB"; lines = (oc, ob) }
draw Angle { name = "arc1"; angle = "angAOC" }
draw Angle { name = "arc2"; angle = "angCOB" }
new UI { type = slider; label = "угол AOB"; variable = t; min = 10; max = 350; step = 1; default = 100 }
Update {
  float rad = t * pi / 180; B.pos.x = 4.5 * cos(rad); B.pos.y = 4.5 * sin(rad);
  C.pos.x = 4.5 * cos(rad / 2); C.pos.y = 4.5 * sin(rad / 2);
  info = "**Биссектриса OC** — луч из вершины O, делящий угол AOB пополам.\n\nAOB = " + format(t, 0) + "°, AOC = " + format(angAOC.measure, 0) + "°, COB = " + format(angCOB.measure, 0) + "° — всегда равны между собой.";
}
]
