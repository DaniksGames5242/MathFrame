[
description = "{info}"
field width = 16; field height = 12;
camera type = fixed;
float t1 = 0.35; float t2 = 0.7; string info = "";
new Point { name = "O"; pos = (-7, -5); dynamic = false; collision = false }
new Point { name = "A"; pos = (0, 0); dynamic = false; collision = false; color = #3b82f6 }
new Point { name = "B"; pos = (0, 0); dynamic = false; collision = false; color = #3b82f6 }
new Point { name = "A2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "B2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Line { name = "ray1"; pos = (O, B) }
new Line { name = "ray2"; pos = (O, B2) }
new Line { name = "aa2"; pos = (A, A2); color = #22c55e }
new Line { name = "bb2"; pos = (B, B2); color = #22c55e }
new UI { type = slider; label = "точка A на луче"; variable = t1; min = 0.15; max = 0.85; step = 0.02; default = 0.35 }
new UI { type = slider; label = "точка B на луче"; variable = t2; min = 0.15; max = 0.85; step = 0.02; default = 0.7 }
Update {
  if (t2 - t1 < 0.08) { t2 = t1 + 0.08; }
  A.pos.x = O.pos.x + t1 * 14; A.pos.y = O.pos.y + t1 * 4;
  B.pos.x = O.pos.x + t2 * 14; B.pos.y = O.pos.y + t2 * 4;
  A2.pos.x = O.pos.x + t1 * 6; A2.pos.y = O.pos.y + t1 * 10;
  B2.pos.x = O.pos.x + t2 * 6; B2.pos.y = O.pos.y + t2 * 10;
  info = "Прямые AA₂ и BB₂ параллельны и пересекают две прямые, выходящие из точки O. По теореме Фалеса отношения отрезков на одной прямой равны отношениям на другой: OA/OB = " + format(t1 / t2, 2) + " и OA₂/OB₂ = " + format(t1 / t2, 2) + " — равны при любом положении A и B.";
}
]
