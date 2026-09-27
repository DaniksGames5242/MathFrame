[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float t = 40; string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "A"; pos = (-6, 0); dynamic = false; collision = false }
new Point { name = "B"; pos = (6, 0); dynamic = false; collision = false }
new Point { name = "C"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "D"; pos = (0, 0); dynamic = false; collision = false }
new Line { name = "oa"; pos = (O, A) }
new Line { name = "ob"; pos = (O, B) }
new Line { name = "oc"; pos = (O, C) }
new Line { name = "od"; pos = (O, D) }
new Angle { name = "angAOC"; lines = (oa, oc) }
new Angle { name = "angBOD"; lines = (ob, od) }
draw Angle { name = "arc1"; angle = "angAOC" }
draw Angle { name = "arc2"; angle = "angBOD" }
new UI { type = slider; label = "наклон второй прямой"; variable = t; min = 10; max = 170; step = 1; default = 40 }
Update {
  float rad = t * pi / 180;
  C.pos.x = 4.5 * cos(rad); C.pos.y = 4.5 * sin(rad); D.pos.x = -4.5 * cos(rad); D.pos.y = -4.5 * sin(rad);
  info = "**Вертикальные углы AOC и BOD** образованы пересечением прямых AB и CD: стороны каждого — продолжения сторон другого.\n\nAOC = " + format(angAOC.measure, 0) + "°, BOD = " + format(angBOD.measure, 0) + "° — они равны при любом наклоне второй прямой.";
}
]
