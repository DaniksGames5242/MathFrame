[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Приближённые a ± Δa и b ± Δb — отрезки на числовых осях; снизу — отрезок всех значений
// результата (крайние комбинации). Ось результата шире: сумма до 20, произведение до 120. ----
draw Graph { name = "gAx"; graph = "gx"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gIn"; graph = "gi"; edgeWidth = 9; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gMid"; graph = "gm"; nodeColor = #f59e0b; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Text { name = "la"; pos = (-7.7, 3.0); text = "a"; size = 1; align = left }
draw Text { name = "lb"; pos = (-7.7, 0.9); text = "b"; size = 1; align = left }
draw Text { name = "lr"; pos = (-7.7, -1.9); text = "a " + sym + " b"; size = 1; align = left }
draw Text { name = "r0"; pos = (-6.5, -3.4); text = format(rlo, 0); size = 0.8 }
draw Text { name = "r1"; pos = (6.5, -3.4); text = format(rhi, 0); size = 0.8 }
draw Text { name = "a0"; pos = (-6.5, 2.0); text = "0"; size = 0.8 }
draw Text { name = "a1"; pos = (6.5, 2.0); text = "10"; size = 0.8 }

new UI { name = "sO"; type = select; label = "действие"; variable = op; options = ("add", "sub", "mul", "div"); labels = ("a + b", "a − b", "a · b", "a : b"); default = "add" }
new UI { name = "sA"; type = slider; label = "a"; variable = a; min = 1; max = 10; step = 0.1; default = 6.4 }
new UI { name = "sDA"; type = slider; label = "Δa"; variable = da; min = 0.01; max = 0.5; step = 0.01; default = 0.2 }
new UI { name = "sB"; type = slider; label = "b"; variable = b; min = 1; max = 10; step = 0.1; default = 2.5 }
new UI { name = "sDB"; type = slider; label = "Δb"; variable = db; min = 0.01; max = 0.5; step = 0.01; default = 0.2 }

// ---- Логика ----
string op = "add"; float a = 6.4; float da = 0.2; float b = 2.5; float db = 0.2;
string sym = "+"; float rlo = 0; float rhi = 20; float key = -1;
string info = "";

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function dg(e) { if (e >= 1) { return 0; } if (e >= 0.1) { return 1; } if (e >= 0.01) { return 2; } if (e >= 0.001) { return 3; } return 4; }
Function mx(v, lo, hi) { return -6.5 + 13 * (v - lo) / (hi - lo); }
Function seg(g, k, y, lo, hi, c, x0, x1) { addNode(g, k + "1", [mx(lo, x0, x1), y]); addNode(g, k + "2", [mx(hi, x0, x1), y]); addEdge(g, k + "1", k + "2", 1, c); }

Update {
  float lo = a - da + b - db; float hi = a + da + b + db; sym = "+"; rlo = 0; rhi = 20;
  if (op == "sub") { lo = a - da - b - db; hi = a + da - b + db; sym = "−"; rlo = -10; rhi = 10; }
  if (op == "mul") { lo = (a - da) * (b - db); hi = (a + da) * (b + db); sym = "·"; rlo = 0; rhi = 120; }
  if (op == "div") { lo = (a - da) / (b + db); hi = (a + da) / (b - db); sym = ":"; rlo = 0; rhi = 12; }
  float r = a + b; if (op == "sub") { r = a - b; } if (op == "mul") { r = a * b; } if (op == "div") { r = a / b; }
  float dr = max(r - lo, hi - r);
  if (key != a * 1 + b * 37 + da * 1001 + db * 4099 + rlo * 7) {
    gx = newGraph(); gi = newGraph(); gm = newGraph();
    addNode(gx, "p1", [-6.5, 2.4]); addNode(gx, "p2", [6.5, 2.4]); addEdge(gx, "p1", "p2");
    addNode(gx, "q1", [-6.5, 0.3]); addNode(gx, "q2", [6.5, 0.3]); addEdge(gx, "q1", "q2");
    addNode(gx, "s1", [-6.5, -2.9]); addNode(gx, "s2", [6.5, -2.9]); addEdge(gx, "s1", "s2");
    seg(gi, "a", 2.4, a - da, a + da, "#3b82f6", 0, 10); seg(gi, "b", 0.3, b - db, b + db, "#3b82f6", 0, 10);
    seg(gi, "r", -2.9, lo, hi, "#22c55e", rlo, rhi);
    addNode(gm, "ma", [mx(a, 0, 10), 2.4]); addNode(gm, "mb", [mx(b, 0, 10), 0.3]); addNode(gm, "mr", [mx(r, rlo, rhi), -2.9]);
    key = a * 1 + b * 37 + da * 1001 + db * 4099 + rlo * 7;
  }
  float int_d = dg(dr);
  info = "**Приближённые числа:** a = " + format(a, 1) + " ± " + format(da, 2) + ", b = " + format(b, 1) + " ± " + format(db, 2) + " (отрезки на осях — все значения, совместимые с данными). ";
  info = info + "Результат a " + sym + " b лежит в отрезке [" + num(lo, 3) + "; " + num(hi, 3) + "], то есть **a " + sym + " b = " + num(r, int_d) + " ± " + format(dr, int_d + 1) + "** — цифры, лежащие за погрешностью, не значимы.\n\n";
  if (op == "add" || op == "sub") { info = info + "**Сложение и вычитание:** абсолютные погрешности складываются: Δ = Δa + Δb = " + format(da + db, 2) + " (найдено по крайним значениям: " + format(dr, 3) + "). Сохраняется столько десятичных знаков, сколько у числа с наименьшим их количеством."; }
  else { info = info + "**Умножение и деление:** относительные погрешности складываются: δ = δa + δb = " + format(100 * da / a, 2) + "% + " + format(100 * db / b, 2) + "% = " + format(100 * (da / a + db / b), 2) + "% (найдено по крайним значениям: " + format(100 * dr / abs(r), 2) + "%)."; }
}
]
