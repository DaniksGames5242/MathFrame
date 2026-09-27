[
description = "{info}"
field width = 14; field height = 6;
camera type = fixed;
float a = 1; string info = "";
func f(x) = sin(x);
func g(x) = -sin(3.14159265 + x);
draw Function { name = "gf"; f = "f"; xmin = -6.29; xmax = 6.29; grid = true; color = #f59e0b; thickness = 5 }
draw Function { name = "gg"; f = "g"; xmin = -6.29; xmax = 6.29; color = #3b82f6; thickness = 2 }
new Point { name = "P"; graph = "gg"; t = 0.65; pauseOnDrag = false; collideWithPoints = false; color = #22c55e }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  a = P.pos.x;
  info = "Формула приведения sin(π + α) = −sin(α): графики левой и правой части (оранжевый и синий) совпадают при любом α — точку можно тянуть по кривой. При α = " + num(a, 2) + ": sin(α) = " + num(sin(a), 2) + ", −sin(π+α) = " + num(-sin(3.14159265 + a), 2) + " — одно и то же число.";
}
]
