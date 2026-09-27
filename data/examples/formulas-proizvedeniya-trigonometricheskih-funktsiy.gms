[
description = "{info}"
field width = 14; field height = 6;
camera type = fixed;
float a = 1; float b = 0.7; string info = "";
func f(x) = sin(x) * cos(b);
func g(x) = 0.5 * (sin(x + b) + sin(x - b));
draw Function { name = "gf"; f = "f"; xmin = -6.29; xmax = 6.29; grid = true; color = #f59e0b; thickness = 5 }
draw Function { name = "gg"; f = "g"; xmin = -6.29; xmax = 6.29; color = #3b82f6; thickness = 2 }
new Point { name = "P"; graph = "gg"; t = 0.65; pauseOnDrag = false; collideWithPoints = false; color = #22c55e }
new UI { type = slider; label = "β (рад)"; variable = b; min = 0; max = 6.28; step = 0.1; default = 0.7 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  a = P.pos.x;
  info = "Произведение в сумму sin α·cos β = ½[sin(α+β) + sin(α−β)]: графики левой и правой части (оранжевый и синий) совпадают при любых α, β — точку тяните по кривой, β меняйте ползунком. При α = " + num(a, 2) + ", β = " + num(b, 2) + ": sin α·cos β = " + num(sin(a) * cos(b), 2) + ", ½[sin(α+β)+sin(α−β)] = " + num(0.5 * (sin(a + b) + sin(a - b)), 2) + " — одно и то же число.";
}
]
