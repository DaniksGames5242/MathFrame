[
description = "{info}"
field width = 12; field height = 10;
camera type = fixed;
string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "A"; pos = (5, 1) }
new Point { name = "B"; pos = (-2, 4) }
new Line { name = "oa"; pos = (O, A) }
new Line { name = "ob"; pos = (O, B) }
new Angle { name = "ang"; lines = (oa, ob) }
draw Angle { name = "da"; angle = "ang" }
Update {
  info = "**Угол** AOB образован двумя лучами OA и OB с общей вершиной O. Величина угла ∠AOB = " + format(ang.measure, 1) + "°.";
}
]
