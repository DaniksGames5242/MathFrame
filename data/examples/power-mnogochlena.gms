[
description = "{info}"
field width = 10; field height = 6;
camera type = fixed;
float A = 2; float m = 3; float B = -1; float n = 4; string info = ""; float g = 0;
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -2]); addNode(g, k + "1", [x, -2 + v]); addEdge(g, k + "0", k + "1", 1, c); }
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 26; labels = false; interactive = false }
new UI { type = slider; label = "показатель m (при A)"; variable = m; min = 0; max = 4; step = 1; default = 3 }
new UI { type = slider; label = "коэффициент A"; variable = A; min = -3; max = 3; step = 1; default = 2 }
new UI { type = slider; label = "показатель n (при B)"; variable = n; min = 0; max = 4; step = 1; default = 5 }
new UI { type = slider; label = "коэффициент B"; variable = B; min = -3; max = 3; step = 1; default = -1 }
Update {
  g = newGraph();
  if (A != 0) { bar("a", -2, m + 0.5, "#3b82f6"); }
  if (B != 0) { bar("b", 2, n + 0.5, "#f59e0b"); }
  string t1 = "A·x" + format(m, 0); string t2 = "B·x" + format(n, 0);
  info = "**Многочлен** " + t1 + " + " + t2 + " при A = " + format(A, 0) + ", B = " + format(B, 0) + ".\n\n";
  if (A == 0 && B == 0) { info = info + "Все коэффициенты равны нулю — степень не определена."; }
  if (A != 0 && B == 0) { info = info + "Ненулевой только член A·x" + format(m, 0) + ", степень многочлена равна " + format(m, 0) + "."; }
  if (A == 0 && B != 0) { info = info + "Ненулевой только член B·x" + format(n, 0) + ", степень многочлена равна " + format(n, 0) + "."; }
  if (A != 0 && B != 0) { info = info + "Оба члена ненулевые, степень равна наибольшему из показателей: max(" + format(m, 0) + "; " + format(n, 0) + ") = " + format(max(m, n), 0) + "."; }
}
]
