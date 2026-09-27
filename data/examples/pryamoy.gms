[
description = "{info}"
field width = 12; field height = 10;
camera type = fixed;
string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "A"; pos = (4, 0) }
new Point { name = "B"; pos = (0, 4) }
new Line { name = "oa"; pos = (O, A) }
new Line { name = "ob"; pos = (O, B) }
new Angle { name = "ang"; lines = (oa, ob); lock = true }
draw Angle { name = "da"; angle = "ang" }
Update {
  info = "**Прямой угол** AOB равен половине развёрнутого угла — ровно 90°: ∠AOB = " + format(ang.measure, 1) + "°. Такой угол образуется при перпендикулярном пересечении прямых OA и OB.";
}
]
