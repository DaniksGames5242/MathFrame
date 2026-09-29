[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Машина с p десятичными значащими цифрами считает y = √(x² + 1) − 1 двумя способами: «в лоб» (оранжевая)
// и по устойчивой формуле x² / (√(x² + 1) + 1) (зелёная). По вертикали — lg относительной погрешности, по
// горизонтали — s, где x = 10⁻ˢ. Вертикальная линия — выбранное s. ----
draw Graph { name = "gGrid"; graph = "gg"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gN"; graph = "gn"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gS"; graph = "gs"; edgeColor = #22c55e; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gM"; graph = "gm"; edgeColor = #3b82f6; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 7 }
draw Text { name = "y0"; pos = (-7.7, 3.5); text = "1"; size = 0.8; color = #3b82f6; align = left }
draw Text { name = "y1"; pos = (-7.7, 1.625); text = "10⁻²"; size = 0.8; color = #3b82f6; align = left }
draw Text { name = "y2"; pos = (-7.7, -0.25); text = "10⁻⁴"; size = 0.8; color = #3b82f6; align = left }
draw Text { name = "y3"; pos = (-7.7, -2.125); text = "10⁻⁶"; size = 0.8; color = #3b82f6; align = left }
draw Text { name = "y4"; pos = (-7.7, -4); text = "10⁻⁸"; size = 0.8; color = #3b82f6; align = left }
draw Text { name = "x0"; pos = (-7.5, -4.6); text = "x = 1"; size = 0.8; color = #3b82f6 }
draw Text { name = "x3"; pos = (0, -4.6); text = "10⁻³"; size = 0.8; color = #3b82f6 }
draw Text { name = "x6"; pos = (7.5, -4.6); text = "10⁻⁶"; size = 0.8; color = #3b82f6 }
draw Text { name = "lg1"; pos = (-7.7, 4.4); text = "относительная погрешность"; size = 0.85; align = left }

new UI { name = "sP"; type = slider; label = "значащих цифр p"; variable = p; min = 2; max = 8; step = 1; default = 4 }
new UI { name = "sS"; type = slider; label = "s (x = 10⁻ˢ)"; variable = s; min = 0; max = 6; step = 0.1; default = 3 }

// ---- Логика ----
float p = 4; float s = 3; float key = -1; string info = "";

Function rd(v) {
  if (v == 0) { return 0; }
  float q = pow(10, floor(log10(abs(v))) - p + 1);
  return round(v / q) * q;
}
Function ex(x) { return x * x / (sqrt(x * x + 1) + 1); }
Function nv(x) { return rd(rd(sqrt(rd(rd(x * x) + 1))) - 1); }
Function sb(x) { return rd(rd(x * x) / rd(rd(sqrt(rd(rd(x * x) + 1))) + 1)); }
Function ly(v, x) { return -4 + 7.5 * (max(-8, log10(max(abs(v - ex(x)) / ex(x), 1e-16))) + 8) / 8; }
Function px(t) { return -7.5 + 15 * t / 6; }
Function sci(v) { if (v == 0) { return "0"; } return format(v, 8); }

Update {
  if (key != p) {
    key = p; gn = newGraph(); gs = newGraph(); gg = newGraph();
    repeat (5) { addNode(gg, "h" + format(i, 0) + "a", [-7.5, 3.5 - 1.875 * i]); addNode(gg, "h" + format(i, 0) + "b", [7.5, 3.5 - 1.875 * i]); addEdge(gg, "h" + format(i, 0) + "a", "h" + format(i, 0) + "b"); }
    repeat (7) { addNode(gg, "v" + format(i, 0) + "a", [px(i), -4]); addNode(gg, "v" + format(i, 0) + "b", [px(i), 3.5]); addEdge(gg, "v" + format(i, 0) + "a", "v" + format(i, 0) + "b"); }
    repeat (121) {
      float t = i / 20; float x = pow(10, -t);
      addNode(gn, "n" + format(i, 0), [px(t), ly(nv(x), x)]); addNode(gs, "s" + format(i, 0), [px(t), ly(sb(x), x)]);
      if (i > 0) { addEdge(gn, "n" + format(i - 1, 0), "n" + format(i, 0)); addEdge(gs, "s" + format(i - 1, 0), "s" + format(i, 0)); }
    }
  }
  gm = newGraph(); addNode(gm, "a", [px(s), -4]); addNode(gm, "b", [px(s), 3.5]); addEdge(gm, "a", "b");
  float x = pow(10, -s); float e = ex(x); float a = nv(x); float b = sb(x);
  info = "**Погрешность машинных вычислений** неизбежна: каждое число и результат каждой операции округляются до p = " + format(p, 0) + " значащих цифр (относительная погрешность одного округления порядка 10 в степени −p).\n\n";
  info = info + "При x = " + format(x, 6) + " точное y = " + format(e, 10) + ". **Прямая формула** даёт " + sci(a) + ": относительная погрешность " + format(100 * abs(a - e) / e, 2) + " %. **Устойчивая формула** даёт " + sci(b) + ": " + format(100 * abs(b - e) / e, 7) + " %.\n\n";
  info = info + "При малых x число x² + 1 округляется до 1, и вычитание близких чисел √(x² + 1) − 1 уничтожает все верные цифры — **потеря значимости**; преобразованная формула вычитания не содержит, и её погрешность остаётся порядка 10⁻ᵖ.";
}
]
