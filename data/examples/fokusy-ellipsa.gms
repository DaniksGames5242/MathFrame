[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float a = 6; float c = 3; float b = 5; string info = "";
new Curve { name = "el"; type = parametric; x = "a * cos(t * 6.2832)"; y = "b * sin(t * 6.2832)"; color = #3b82f6; thickness = 3 }
new Point { name = "F1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; text = true("F₁") }
new Point { name = "F2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; text = true("F₂") }
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "B"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e; text = true("B") }
new Point { name = "P"; curve = "el"; t = 0.12; text = true("M"); pauseOnDrag = false; layer = 60 }
new Line { name = "m1"; pos = (F1, P); color = #f59e0b }
new Line { name = "m2"; pos = (F2, P); color = #f59e0b }
new Line { name = "ob"; pos = (O, B); color = #22c55e }
new Line { name = "bf"; pos = (B, F2); color = #22c55e }
new Line { name = "of"; pos = (O, F2); color = #22c55e }
new UI { type = slider; label = "большая полуось a"; variable = a; min = 2; max = 7.5; step = 0.1; default = 6 }
new UI { type = slider; label = "расстояние до фокуса c"; variable = c; min = 0; max = min(a - 0.5, 6.5); step = 0.1; default = 3 }
Update {
  b = sqrt(a * a - c * c);
  F1.pos.x = -c; F1.pos.y = 0; F2.pos.x = c; F2.pos.y = 0;
  B.pos.x = 0; B.pos.y = b;
  float d1 = sqrt((P.pos.x + c) * (P.pos.x + c) + P.pos.y * P.pos.y);
  float d2 = sqrt((P.pos.x - c) * (P.pos.x - c) + P.pos.y * P.pos.y);
  info = "**Фокусы эллипса** F₁ и F₂ лежат на большой оси симметрично относительно центра O, на расстоянии c = " + format(c, 1) + " от него, и сумма расстояний до них от любой точки эллипса постоянна: MF₁ + MF₂ = " + format(d1, 2) + " + " + format(d2, 2) + " = " + format(d1 + d2, 2) + " = 2a.\n\nДля вершины B малой оси BF₂ = a (расстояния до фокусов равны, а сумма 2a), и из прямоугольного треугольника OBF₂ (зелёный): b = √(a² − c²) = √(" + format(a * a, 2) + " − " + format(c * c, 2) + ") = " + format(b, 2) + ".";
}
]
