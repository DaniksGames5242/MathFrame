[
description = "{info}"
field width = 14; field height = 6;
camera type = fixed;
float a = 1; string info = "";
func f(x) = 2 * sin(x) * cos(x);
func g(x) = sin(2 * x);
draw Function { name = "gf"; f = "f"; xmin = -6.29; xmax = 6.29; grid = true; color = #f59e0b; thickness = 5 }
draw Function { name = "gg"; f = "g"; xmin = -6.29; xmax = 6.29; color = #3b82f6; thickness = 2 }
new Point { name = "P"; graph = "gg"; t = 0.65; pauseOnDrag = false; collideWithPoints = false; color = #22c55e }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  a = P.pos.x;
  info = "Формула двойного угла sin(2α) = 2·sin(α)·cos(α): графики левой и правой части (оранжевый и синий) совпадают при любом α — точку можно тянуть по кривой. При α = " + num(a, 2) + ": 2·sin(α)·cos(α) = " + num(2 * sin(a) * cos(a), 2) + ", sin(2α) = " + num(sin(2 * a), 2) + " — одно и то же число.";
}
]
