[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 2; float b = 1.5; string info = "";
func h(x) = b * sqrt(x * x / (a * a) - 1);
func hn(x) = -h(x);
func p(x) = (b / a) * x;
func pn(x) = -(b / a) * x;
draw Function { name = "r1"; f = "h"; xmin = a; xmax = 10; color = #3b82f6; thickness = 3 }
draw Function { name = "r2"; f = "hn"; xmin = a; xmax = 10; color = #3b82f6; thickness = 3 }
draw Function { name = "l1"; f = "h"; xmin = -10; xmax = -a; color = #3b82f6; thickness = 3 }
draw Function { name = "l2"; f = "hn"; xmin = -10; xmax = -a; color = #3b82f6; thickness = 3 }
draw Function { name = "as1"; f = "p"; xmin = -10; xmax = 10; color = #f59e0b; thickness = 1.5 }
draw Function { name = "as2"; f = "pn"; xmin = -10; xmax = 10; color = #f59e0b; thickness = 1.5 }
new UI { type = slider; label = "a"; variable = a; min = 1; max = 4; step = 0.1; default = 2 }
new UI { type = slider; label = "b"; variable = b; min = 1; max = 4; step = 0.1; default = 1.5 }
Update {
  info = "**Асимптоты гиперболы** x²/a² − y²/b² = 1 — прямые y = ±(b/a)x (оранжевые), проходящие через центр и делящие пополам углы между осями. Ветви гиперболы (синие) приближаются к ним, но никогда не касаются.\n\nПри a = " + format(a, 1) + ", b = " + format(b, 1) + ": tg θ = b/a ≈ " + format(b / a, 2) + ".";
}
]
