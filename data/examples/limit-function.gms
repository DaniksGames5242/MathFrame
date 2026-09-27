[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 2; float dx = 1; string info = "";
func f(x) = x*x - x + 1;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "PA"; pos = (0,0); dynamic = false; collision = false; color = #f59e0b; active = true }
new Point { name = "PX"; pos = (0,0); dynamic = false; collision = false; color = #22c55e; active = true }
new UI { type = slider; label = "точка a"; variable = a; min = -4; max = 4; step = 0.1; default = 2 }
new UI { type = slider; label = "смещение x − a"; variable = dx; min = -3; max = 3; step = 0.05; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(dx) < 0.02) { dx = 0.02; }
  float La = a*a - a + 1; PA.pos.x = a; PA.pos.y = La;
  float x = a + dx; float fx = x*x - x + 1; PX.pos.x = x; PX.pos.y = fx;
  info = "**Предел функции** y = x² − x + 1 при x → a = " + num(a,1) + " равен L = " + format(La,2) + ": точка (x; f(x)) (зелёная) приближается к точке (a; L) (оранжевая) при x → a.\n\nПри x = " + num(x,2) + ": f(x) = " + format(fx,3) + ", |f(x) − L| = " + format(abs(fx - La),3) + ".";
}
]
