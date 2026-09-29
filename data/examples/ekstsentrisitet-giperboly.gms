[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float a = 2.5; float e = 1.6; float b = 3; float c = 4; float sm = 1.5; string info = "";
func as1(x) = (b / a) * x;
func as2(x) = -(b / a) * x;
new Curve { name = "hr"; type = parametric; x = "a * (exp(sm * (2 * t - 1)) + exp(-sm * (2 * t - 1))) / 2"; y = "b * (exp(sm * (2 * t - 1)) - exp(-sm * (2 * t - 1))) / 2"; color = #3b82f6; thickness = 3 }
new Curve { name = "hl"; type = parametric; x = "-a * (exp(sm * (2 * t - 1)) + exp(-sm * (2 * t - 1))) / 2"; y = "b * (exp(sm * (2 * t - 1)) - exp(-sm * (2 * t - 1))) / 2"; color = #3b82f6; thickness = 3 }
draw Function { name = "s1"; f = "as1"; xmin = -8; xmax = 8; color = #3b82f6; thickness = 1 }
draw Function { name = "s2"; f = "as2"; xmin = -8; xmax = 8; color = #3b82f6; thickness = 1 }
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
new Point { name = "V"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e; text = true("A") }
new Point { name = "F"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; text = true("F₂") }
new Line { name = "oa"; pos = (O, V); color = #22c55e; thickness = 3 }
new Line { name = "of"; pos = (O, F); color = #f59e0b; thickness = 1.5 }
new UI { type = slider; label = "действительная полуось a"; variable = a; min = 1; max = 3; step = 0.1; default = 2.5 }
new UI { type = slider; label = "эксцентриситет ε"; variable = e; min = 1.05; max = 3; step = 0.05; default = 1.6 }
Update {
  c = a * e; b = a * sqrt(e * e - 1);
  float z = 4.9 / b; float w = 7.9 / a;
  sm = min(ln(z + sqrt(z * z + 1)), ln(w + sqrt(w * w - 1)));
  V.pos.x = a; V.pos.y = 0; F.pos.x = c; F.pos.y = 0;
  float ang = 2 * atan(b / a) * 57.29578;
  info = "**Эксцентриситет гиперболы** — отношение расстояния между фокусами к длине действительной оси: ε = 2c/2a = c/a = " + format(c, 2) + " / " + format(a, 1) + " = " + format(e, 2) + " > 1. Через полуоси ε = √(1 + b²/a²), откуда мнимая полуось b = a√(ε² − 1) = " + format(b, 2) + ".\n\nЧем больше ε, тем шире раскрыт угол между асимптотами y = ±(b/a)x: сейчас он равен " + format(ang, 1) + "°, и ветви прижимаются к мнимой оси. При ε → 1 мнимая полуось стремится к нулю, асимптоты сливаются с действительной осью, и кривая вырождается.";
}
]
