[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = -1.5; float b = 1.5; string info = "";
func f(x) = -(x - a) * (x - b);
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "Ra"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "Rb"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "C"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "T1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "T2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "tg"; pos = (T1, T2) }
new UI { type = slider; label = "левый конец a"; variable = a; min = -2; max = -1; step = 0.1; default = -1.5 }
new UI { type = slider; label = "правый конец b"; variable = b; min = 1; max = 2; step = 0.1; default = 1.5 }
Update {
  float c = (a + b) / 2;
  float fc = -(c - a) * (c - b);
  Ra.pos.x = a; Rb.pos.x = b; C.pos.x = c; C.pos.y = fc;
  T1.pos.x = c - 2; T1.pos.y = fc; T2.pos.x = c + 2; T2.pos.y = fc;
  info = "**Теорема Ролля**: f(x) = −(x − a)(x − b) непрерывна на [a; b], дифференцируема внутри и f(a) = f(b) = 0 (a = " + format(a, 1) + ", b = " + format(b, 1) + ", корни — оранжевые точки на Ox).\n\nСуществует точка c = " + format(c, 2) + " ∈ (a; b), в которой f′(c) = 0 — касательная в точке C горизонтальна.";
}
]
