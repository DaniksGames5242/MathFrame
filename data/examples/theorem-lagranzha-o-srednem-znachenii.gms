[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float k = 0.4; float a = -3; float b = 2; string info = "";
func f(x) = k * x * x;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; thickness = 3 }
new Point { name = "A"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "B"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Line { name = "sec"; pos = (A, B); color = #f59e0b }
new Point { name = "C"; pos = (0, 0); dynamic = false; collision = false; color = #3b82f6 }
new Point { name = "T1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "T2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "tg"; pos = (T1, T2); color = #3b82f6 }
new UI { type = slider; label = "левый конец a"; variable = a; min = -3.5; max = -0.5; step = 0.1; default = -3 }
new UI { type = slider; label = "правый конец b"; variable = b; min = 0.5; max = 3.5; step = 0.1; default = 2 }
Update {
  A.pos.x = a; A.pos.y = k * a * a;
  B.pos.x = b; B.pos.y = k * b * b;
  float m = k * (a + b);
  float c = (a + b) / 2;
  float fc = k * c * c;
  C.pos.x = c; C.pos.y = fc;
  float norm = sqrt(1 + m * m);
  T1.pos.x = c - 3 / norm; T1.pos.y = fc - 3 * m / norm;
  T2.pos.x = c + 3 / norm; T2.pos.y = fc + 3 * m / norm;
  info = "**Теорема Лагранжа**: f(x) = " + format(k, 2) + "x² непрерывна на [a; b] и дифференцируема внутри (a = " + format(a, 1) + ", b = " + format(b, 1) + ").\n\nСуществует точка c = " + format(c, 2) + " ∈ (a; b), в которой касательная (синяя) параллельна секущей AB (оранжевая): f′(c) = " + format(m, 2) + " = (f(b) − f(a))/(b − a).";
}
]
