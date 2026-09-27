[
description = "{info}"
field width = 14; field height = 10;
camera type = fixed;
float t = 120; string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
new Point { name = "A"; pos = (4.5, 0); dynamic = false; collision = false; text = true("A") }
new Point { name = "C"; pos = (4.5, 0); dynamic = false; collision = false; text = true("C") }
new Line { name = "oa"; pos = (O, A) }
new Line { name = "oc"; pos = (O, C) }
new Angle { name = "angAOC"; lines = (oa, oc) }
draw Angle { name = "arc1"; angle = "angAOC" }
new UI { type = slider; label = "положение луча OC"; variable = t; min = 5; max = 355; step = 1; default = 120 }
Update {
  float rad = t * pi / 180; C.pos.x = 4.5 * cos(rad); C.pos.y = 4.5 * sin(rad);
  info = "**Угол AOC** = " + format(angAOC.measure, 0) + "°.\n\nПри t = 180° луч OC направлен противоположно OA: OA и OC становятся противоположными лучами одной прямой, и угол AOC — развёрнутый (равен половине полного угла, вдвое больше прямого).";
  if (abs(t - 180) < 3) { info = "**Угол AOC = 180°** — развёрнутый: OA и OC — противоположные лучи одной прямой, вершина O лежит между ними."; }
}
]
