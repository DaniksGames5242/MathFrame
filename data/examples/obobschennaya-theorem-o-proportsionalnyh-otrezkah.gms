[
description = "{info}"
field width = 16; field height = 12;
camera type = fixed;
float t1 = 0.25; float t2 = 0.5; float t3 = 0.85; string info = "";
new Point { name = "O"; pos = (-7, -5); dynamic = false; collision = false }
new Point { name = "A"; pos = (0, 0); dynamic = false; collision = false; color = #3b82f6 }
new Point { name = "B"; pos = (0, 0); dynamic = false; collision = false; color = #3b82f6 }
new Point { name = "C"; pos = (0, 0); dynamic = false; collision = false; color = #3b82f6 }
new Point { name = "A2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "B2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "C2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Line { name = "ray1"; pos = (O, C) }
new Line { name = "ray2"; pos = (O, C2) }
new Line { name = "aa2"; pos = (A, A2); color = #22c55e }
new Line { name = "bb2"; pos = (B, B2); color = #22c55e }
new Line { name = "cc2"; pos = (C, C2); color = #22c55e }
new UI { type = slider; label = "A"; variable = t1; min = 0.1; max = 0.7; step = 0.02; default = 0.25 }
new UI { type = slider; label = "B"; variable = t2; min = 0.15; max = 0.8; step = 0.02; default = 0.5 }
new UI { type = slider; label = "C"; variable = t3; min = 0.2; max = 0.9; step = 0.02; default = 0.85 }
Update {
  if (t2 - t1 < 0.06) { t2 = t1 + 0.06; } if (t3 - t2 < 0.06) { t3 = t2 + 0.06; }
  A.pos.x = O.pos.x + t1 * 14; A.pos.y = O.pos.y + t1 * 4; A2.pos.x = O.pos.x + t1 * 6; A2.pos.y = O.pos.y + t1 * 10;
  B.pos.x = O.pos.x + t2 * 14; B.pos.y = O.pos.y + t2 * 4; B2.pos.x = O.pos.x + t2 * 6; B2.pos.y = O.pos.y + t2 * 10;
  C.pos.x = O.pos.x + t3 * 14; C.pos.y = O.pos.y + t3 * 4; C2.pos.x = O.pos.x + t3 * 6; C2.pos.y = O.pos.y + t3 * 10;
  info = "Три параллельные прямые AA₂, BB₂, CC₂ пересекают две прямые из точки O. Обобщённая теорема о пропорциональных отрезках: AB/BC = A₂B₂/B₂C₂ = " + format((t2 - t1) / (t3 - t2), 2) + " — при любом числе параллельных прямых отношения отрезков на одной секущей равны отношениям на другой.";
}
]
