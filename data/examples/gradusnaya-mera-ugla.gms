[
description = "{info}"
field width = 12; field height = 10;
camera type = fixed;
string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "A"; pos = (5, 0) }
new Point { name = "B"; pos = (1, 4) }
new Line { name = "oa"; pos = (O, A) }
new Line { name = "ob"; pos = (O, B) }
new Angle { name = "ang"; lines = (oa, ob) }
draw Angle { name = "da"; angle = "ang" }
Update {
  float frac = ang.measure / 360;
  info = "**Градусная мера** угла AOB — часть полного оборота в 360°: ∠AOB = " + format(ang.measure, 1) + "° = " + format(frac, 3) + " полного угла. Для сравнения: прямой угол — 90°, развёрнутый — 180°.";
}
]
