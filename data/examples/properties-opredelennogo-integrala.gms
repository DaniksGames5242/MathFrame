[
description = "{info}"
field width = 6.28; field height = 10;
camera type = fixed;
float a = 1; float b = 0.5; string info = "";
func f(x) = sin(x);
func g(x) = x / 2;
func h(x) = a * sin(x) + b * x / 2;
draw Function { name = "gf"; f = "f"; xmin = 0; xmax = 3.14; grid = true; color = #3b82f6; thickness = 2 }
draw Function { name = "gg"; f = "g"; xmin = 0; xmax = 3.14; color = #f59e0b; thickness = 2 }
draw Function { name = "gh"; f = "h"; xmin = 0; xmax = 3.14; color = #22c55e; thickness = 3 }
new UI { type = slider; label = "a"; variable = a; min = -2; max = 2; step = 0.1; default = 1 }
new UI { type = slider; label = "b"; variable = b; min = -2; max = 2; step = 0.1; default = 0.5 }
Update {
  float Ih = a * 2 + b * 2.467;
  info = "**Свойство линейности определённого интеграла:** ∫ от 0 до π (a·f + b·g)dx = a·∫ от 0 до π f dx + b·∫ от 0 до π g dx.\n\nСиний — f(x) = sin x, оранжевый — g(x) = x/2, зелёный — h(x) = a·f(x) + b·g(x) при a = " + format(a, 1) + ", b = " + format(b, 1) + ".\n\n∫ от 0 до π f dx = 2, ∫ от 0 до π g dx = π²/4 ≈ 2,467. По свойству ∫ от 0 до π h dx = " + format(Ih, 3) + " (совпадает с a×2 + b×2,467).";
}
]
