[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 2; float N = 10; string info = "";
func f(x) = x*x;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
draw Graph { name = "gX"; graph = "gx"; nodeRadius = 4; edgeWidth = 0; labels = false; interactive = false; color = #f59e0b }
draw Graph { name = "gY"; graph = "gy"; nodeRadius = 4; edgeWidth = 0; labels = false; interactive = false; color = #22c55e }
new UI { type = slider; label = "точка a"; variable = a; min = -3; max = 3; step = 0.1; default = 2 }
new UI { type = slider; label = "членов N"; variable = N; min = 1; max = 15; step = 1; default = 10 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  gx = newGraph(); gy = newGraph();
  float La = a*a;
  repeat (N) { float k = i + 1; float xk = a + 1 / k; float fk = xk*xk;
    addNode(gx, "x" + format(k,0), [xk, -5.5]); addNode(gy, "y" + format(k,0), [xk, fk]);
  }
  float xN = a + 1 / N; float fN = xN*xN;
  info = "**Определение по Гейне:** предел f(x) = x² при x → a = " + num(a,1) + " равен L = " + format(La,2) + ", если для ЛЮБОЙ последовательности xₙ → a (здесь xₙ = a + 1/n — оранжевые точки на оси) значения f(xₙ) (зелёные точки на графике) стремятся к L.\n\nПри n = " + format(N,0) + ": xₙ = " + num(xN,3) + ", f(xₙ) = " + format(fN,3) + ".";
}
]
