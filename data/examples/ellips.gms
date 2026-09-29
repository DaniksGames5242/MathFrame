[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float a = 6; float b = 3.5; float c = 0; float bg = 6; string info = "";
new Curve { name = "el"; type = parametric; x = "a * cos(t * 6.2832)"; y = "b * sin(t * 6.2832)"; color = #3b82f6; thickness = 3 }
new Point { name = "F1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; text = true("F₁") }
new Point { name = "F2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; text = true("F₂") }
new Point { name = "P"; curve = "el"; t = 0.12; text = true("M"); pauseOnDrag = false; layer = 60 }
new Line { name = "m1"; pos = (F1, P); color = #f59e0b }
new Line { name = "m2"; pos = (F2, P); color = #22c55e }
new UI { type = slider; label = "полуось a"; variable = a; min = 1; max = 7.5; step = 0.1; default = 6 }
new UI { type = slider; label = "полуось b"; variable = b; min = 1; max = 4.5; step = 0.1; default = 3.5 }
Update {
  bg = max(a, b); c = sqrt(abs(a * a - b * b));
  if (a >= b) { F1.pos.x = -c; F1.pos.y = 0; F2.pos.x = c; F2.pos.y = 0; }
  if (a < b) { F1.pos.x = 0; F1.pos.y = -c; F2.pos.x = 0; F2.pos.y = c; }
  float d1 = sqrt((P.pos.x - F1.pos.x) * (P.pos.x - F1.pos.x) + (P.pos.y - F1.pos.y) * (P.pos.y - F1.pos.y));
  float d2 = sqrt((P.pos.x - F2.pos.x) * (P.pos.x - F2.pos.x) + (P.pos.y - F2.pos.y) * (P.pos.y - F2.pos.y));
  info = "**Эллипс** — замкнутая кривая второго порядка x²/a² + y²/b² = 1 с двумя осями симметрии; полуоси a = " + format(a, 1) + " и b = " + format(b, 1) + ", большая полуось " + format(bg, 1) + ".\n\nСумма расстояний от точки M кривой до фокусов F₁ и F₂ постоянна и равна длине большой оси: MF₁ + MF₂ = " + format(d1, 2) + " + " + format(d2, 2) + " = " + format(d1 + d2, 2) + " = 2 · " + format(bg, 1) + ".";
  if (c < 0.05) { info = info + " Фокусы слились в центре — эллипс стал окружностью."; }
}
]
