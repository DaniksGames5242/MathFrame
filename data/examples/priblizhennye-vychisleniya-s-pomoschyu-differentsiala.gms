[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Синий график — функция f, жёлтая прямая — касательная в точке x₀ (её ордината при x₀ + Δx —
// приближённое значение f(x₀) + f′(x₀)·Δx). Зелёная точка — точное f(x₀ + Δx), отрезок между ними — погрешность.
// Оси поля растянуты (шаг по x — sx, по y — ky), поэтому подписаны значениями, а не сеткой. ----
draw Function { name = "gF"; f = "fl"; xmin = -8; xmax = 8; color = #3b82f6; thickness = 3; layer = 5 }
draw Function { name = "gT"; f = "tg"; xmin = -8; xmax = 8; color = #f59e0b; thickness = 2; layer = 6 }
draw Graph { name = "gE"; graph = "ge"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gA"; graph = "ga"; nodeColor = #3b82f6; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gB"; graph = "gb"; nodeColor = #22c55e; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gC"; graph = "gc"; nodeColor = #f59e0b; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Text { name = "l0"; pos = (px0, -4.6); text = "x₀"; size = 0.9 }
draw Text { name = "l1"; pos = (px1, -4.1); text = "x₀ + Δx"; size = 0.9 }

new UI { name = "sF"; type = select; label = "f(x)"; variable = cs; options = ("sin", "exp", "log", "sqrt"); labels = ("sin x", "eˣ", "ln x", "√x"); default = "sin" }
new UI { name = "sX"; type = slider; label = "x₀"; variable = x0; min = ceil((lo() + 0.3) * 20) / 20; max = floor((hi() - 0.3) * 20) / 20; step = 0.05; default = 2 }
new UI { name = "sD"; type = slider; label = "Δx"; variable = dx; min = max(-1, ceil((lo() - x0) * 20) / 20); max = min(1, floor((hi() - x0) * 20) / 20); step = 0.05; default = 0.5 }

// ---- Логика ----
string cs = "sin"; float x0 = 2; float dx = 0.5; float px0 = 0; float px1 = 0;
string key = ""; string info = ""; string nm = "sin x";
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
// окно: t = tc + s·X, y = (f(t) − yc) / k
Function tc() { if (cs == "sin") { return 3.2; } if (cs == "exp") { return 0; } if (cs == "log") { return 2.05; } return 4; }
Function sx() { if (cs == "sin") { return 0.4; } if (cs == "exp") { return 0.25; } if (cs == "log") { return 0.25; } return 0.5; }
Function yc() { if (cs == "sin") { return 0; } if (cs == "exp") { return 3; } if (cs == "log") { return 0.3; } return 1.4; }
Function ky() { if (cs == "sin") { return 0.25; } if (cs == "exp") { return 1; } if (cs == "log") { return 0.55; } return 0.5; }
Function lo() { if (cs == "sin") { return 0.1; } if (cs == "exp") { return -1.9; } if (cs == "log") { return 0.1; } return 0.1; }
Function hi() { if (cs == "sin") { return 6.2; } if (cs == "exp") { return 1.9; } if (cs == "log") { return 4; } return 7.8; }
Function F(t) { if (cs == "sin") { return sin(t); } if (cs == "exp") { return exp(t); } if (cs == "log") { return log(t); } return sqrt(t); }
Function F1(t) { if (cs == "sin") { return cos(t); } if (cs == "exp") { return exp(t); } if (cs == "log") { return 1 / t; } return 0.5 / sqrt(t); }
Function F2(t) { if (cs == "sin") { return -sin(t); } if (cs == "exp") { return exp(t); } if (cs == "log") { return -1 / (t * t); } return -0.25 / (t * sqrt(t)); }
Function fl(X) { float t = tc() + sx() * X; if (t < 0.02 && cs == "log") { return -100; } if (t < 0.02 && cs == "sqrt") { return -100; } return (F(t) - yc()) / ky(); }
Function tg(X) { return (F(x0) + F1(x0) * (tc() + sx() * X - x0) - yc()) / ky(); }
Function X(t) { return (t - tc()) / sx(); }
Function Y(v) { return (v - yc()) / ky(); }

Update {
  if (key != cs) { key = cs; if (x0 < lo() + 0.3) { x0 = lo() + 0.3; } if (x0 > hi() - 0.3) { x0 = hi() - 0.3; } }
  float f0 = F(x0); float d1 = F1(x0); float d2 = F2(x0);
  float xb = x0 + dx; float df = d1 * dx; float ap = f0 + df; float tr = F(xb);
  px0 = X(x0); px1 = X(xb);
  ga = newGraph(); gb = newGraph(); gc = newGraph(); ge = newGraph();
  addNode(ga, "a", [X(x0), Y(f0)]);
  addNode(gb, "b", [X(xb), Y(tr)]);
  addNode(gc, "c", [X(xb), Y(ap)]);
  addNode(ge, "e1", [X(xb), Y(tr)]); addNode(ge, "e2", [X(xb), Y(ap)]); addEdge(ge, "e1", "e2");
  if (cs == "sin") { nm = "sin x"; } if (cs == "exp") { nm = "eˣ"; } if (cs == "log") { nm = "ln x"; } if (cs == "sqrt") { nm = "√x"; }
  info = "**Приближённые вычисления с помощью дифференциала.** Приращение функции заменяют дифференциалом: f(x₀ + Δx) ≈ f(x₀) + f′(x₀)·Δx. Синий график — f(x) = " + nm + ", жёлтая прямая — касательная в точке x₀.\n\n";
  info = info + "**x₀ = " + num(x0, 2) + ", Δx = " + num(dx, 2) + ":** f(x₀) = " + num(f0, 4) + ", f′(x₀) = " + num(d1, 4) + ", df = f′(x₀)·Δx = " + num(df, 4) + ". Приближённое значение " + num(ap, 4) + ", точное f(x₀ + Δx) = " + num(tr, 4) + ".\n\n";
  info = info + "**Погрешность** Δf − df = " + num(tr - ap, 5) + "; она равна f″(ξ)/2·(Δx)², а f″(x₀)/2·(Δx)² = " + num(d2 * dx * dx / 2, 5) + ". Относительная погрешность " + num(100 * (tr - ap) / ap, 3) + " %. ";
  if (d2 > 0.005) { info = info + "Здесь f″(x₀) = " + num(d2, 3) + " > 0, график выпуклый вниз и лежит выше касательной — приближение занижает."; }
  if (d2 < -0.005) { info = info + "Здесь f″(x₀) = " + num(d2, 3) + " < 0, график выпуклый вверх и лежит ниже касательной — приближение завышает."; }
  if (abs(d2) <= 0.005) { info = info + "Здесь f″(x₀) ≈ 0, касательная почти не отходит от графика — погрешность очень мала."; }
}
]
