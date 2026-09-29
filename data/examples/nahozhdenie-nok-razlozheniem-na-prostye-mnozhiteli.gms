[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Таблица показателей простых множителей чисел a и b. Справа полоски: синяя — показатель в a,
// янтарная — в b, зелёная подложка — наибольший из двух (max). ----
draw Graph { name = "gG"; graph = "gg"; edgeColor = #22c55e55; edgeWidth = 30; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gB"; graph = "gb"; edgeWidth = 9; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Text { name = "fa"; pos = (-7.6, 4.3); text = "a = " + fs(a); size = 1.15; align = left }
draw Text { name = "fb"; pos = (-7.6, 3.45); text = "b = " + fs(b); size = 1.15; align = left }
draw Text { name = "h0"; pos = (-6.8, 2.5); text = "простое"; size = 0.85 }
draw Text { name = "h1"; pos = (-5.1, 2.5); text = "в a"; size = 0.85 }
draw Text { name = "h2"; pos = (-3.9, 2.5); text = "в b"; size = 0.85 }
draw Text { name = "h3"; pos = (-2.5, 2.5); text = "max"; size = 0.85; color = #22c55e }
draw Text { name = "p0"; pos = (-6.8, 1.50); text = format(pr[0], 0); size = 1.2; layer = 5; active = 0 < cnt }
draw Text { name = "a0"; pos = (-5.1, 1.50); text = format(ea[0], 0); size = 1.2; layer = 5; active = 0 < cnt }
draw Text { name = "b0"; pos = (-3.9, 1.50); text = format(eb[0], 0); size = 1.2; layer = 5; active = 0 < cnt }
draw Text { name = "m0"; pos = (-2.5, 1.50); text = format(max(ea[0], eb[0]), 0); size = 1.2; color = #22c55e; layer = 5; active = 0 < cnt }
draw Text { name = "p1"; pos = (-6.8, 0.55); text = format(pr[1], 0); size = 1.2; layer = 5; active = 1 < cnt }
draw Text { name = "a1"; pos = (-5.1, 0.55); text = format(ea[1], 0); size = 1.2; layer = 5; active = 1 < cnt }
draw Text { name = "b1"; pos = (-3.9, 0.55); text = format(eb[1], 0); size = 1.2; layer = 5; active = 1 < cnt }
draw Text { name = "m1"; pos = (-2.5, 0.55); text = format(max(ea[1], eb[1]), 0); size = 1.2; color = #22c55e; layer = 5; active = 1 < cnt }
draw Text { name = "p2"; pos = (-6.8, -0.40); text = format(pr[2], 0); size = 1.2; layer = 5; active = 2 < cnt }
draw Text { name = "a2"; pos = (-5.1, -0.40); text = format(ea[2], 0); size = 1.2; layer = 5; active = 2 < cnt }
draw Text { name = "b2"; pos = (-3.9, -0.40); text = format(eb[2], 0); size = 1.2; layer = 5; active = 2 < cnt }
draw Text { name = "m2"; pos = (-2.5, -0.40); text = format(max(ea[2], eb[2]), 0); size = 1.2; color = #22c55e; layer = 5; active = 2 < cnt }
draw Text { name = "p3"; pos = (-6.8, -1.35); text = format(pr[3], 0); size = 1.2; layer = 5; active = 3 < cnt }
draw Text { name = "a3"; pos = (-5.1, -1.35); text = format(ea[3], 0); size = 1.2; layer = 5; active = 3 < cnt }
draw Text { name = "b3"; pos = (-3.9, -1.35); text = format(eb[3], 0); size = 1.2; layer = 5; active = 3 < cnt }
draw Text { name = "m3"; pos = (-2.5, -1.35); text = format(max(ea[3], eb[3]), 0); size = 1.2; color = #22c55e; layer = 5; active = 3 < cnt }
draw Text { name = "p4"; pos = (-6.8, -2.30); text = format(pr[4], 0); size = 1.2; layer = 5; active = 4 < cnt }
draw Text { name = "a4"; pos = (-5.1, -2.30); text = format(ea[4], 0); size = 1.2; layer = 5; active = 4 < cnt }
draw Text { name = "b4"; pos = (-3.9, -2.30); text = format(eb[4], 0); size = 1.2; layer = 5; active = 4 < cnt }
draw Text { name = "m4"; pos = (-2.5, -2.30); text = format(max(ea[4], eb[4]), 0); size = 1.2; color = #22c55e; layer = 5; active = 4 < cnt }
draw Text { name = "p5"; pos = (-6.8, -3.25); text = format(pr[5], 0); size = 1.2; layer = 5; active = 5 < cnt }
draw Text { name = "a5"; pos = (-5.1, -3.25); text = format(ea[5], 0); size = 1.2; layer = 5; active = 5 < cnt }
draw Text { name = "b5"; pos = (-3.9, -3.25); text = format(eb[5], 0); size = 1.2; layer = 5; active = 5 < cnt }
draw Text { name = "m5"; pos = (-2.5, -3.25); text = format(max(ea[5], eb[5]), 0); size = 1.2; color = #22c55e; layer = 5; active = 5 < cnt }

new UI { name = "sA"; type = slider; label = "a"; variable = a; min = 2; max = 120; step = 1; default = 12 }
new UI { name = "sB"; type = slider; label = "b"; variable = b; min = 2; max = 120; step = 1; default = 18 }

float a = 12; float b = 18; float key = -1; float cnt = 0; string info = "";
list pr = (0, 0, 0, 0, 0, 0);
list ea = (0, 0, 0, 0, 0, 0);
list eb = (0, 0, 0, 0, 0, 0);

Function md(u, v) { return u - floor(u / v) * v; }
Function isP(c) { float r = 1; repeat (9) { float d = i + 2; if (d < c && md(c, d) == 0) { r = 0; } } return r; }
Function ex(n, p) { float e = 0; float q = n; repeat (7) { if (md(q, p) == 0) { e = e + 1; q = q / p; } } return e; }
Function sup(e) {
  if (e == 2) { return "²"; } if (e == 3) { return "³"; } if (e == 4) { return "⁴"; }
  if (e == 5) { return "⁵"; } if (e == 6) { return "⁶"; } if (e == 7) { return "⁷"; } return "";
}
// запись n через простые из таблицы (показатель из списка l)
Function fs(n) {
  string s = ""; float first = 1;
  repeat (6) { if (i < cnt) { float e = ex(n, pr[i]); if (e > 0) { if (first < 0.5) { s = s + " · "; } s = s + format(pr[i], 0) + sup(e); first = 0; } } }
  return s;
}
// произведение простых из таблицы в показателях max: строка и значение
Function prodS() {
  string s = ""; float first = 1;
  repeat (6) { if (i < cnt) { float e = max(ea[i], eb[i]); if (e > 0) { if (first < 0.5) { s = s + " · "; } s = s + format(pr[i], 0) + sup(e); first = 0; } } }
  if (first > 0.5) { return "1"; } return s;
}
Function pt() { if (prodS() == "1") { return "1"; } return prodS() + " = " + format(prodV(), 0); }
Function prodV() {
  float v = 1; repeat (6) { if (i < cnt) { v = v * pow(pr[i], max(ea[i], eb[i])); } } return v;
}

Update {
  if (key != a * 1000 + b) {
    key = a * 1000 + b;
    cnt = 0; float c = 0;
    repeat (6) { pr[i] = 0; ea[i] = 0; eb[i] = 0; }
    repeat (119) { c = i + 2; if ((md(a, c) == 0 || md(b, c) == 0) && isP(c) > 0.5) { pr[cnt] = c; cnt = cnt + 1; } }
    gg = newGraph(); gb = newGraph();
    repeat (6) {
      if (i < cnt) {
        ea[i] = ex(a, pr[i]); eb[i] = ex(b, pr[i]);
        float y = 1.5 - 0.95 * i; string k = format(i, 0);
        addNode(gb, "a" + k, [-1.0, y + 0.2]); addNode(gb, "A" + k, [-1.0 + 1.1 * ea[i], y + 0.2]); addEdge(gb, "a" + k, "A" + k, 1, "#3b82f6");
        addNode(gb, "b" + k, [-1.0, y - 0.2]); addNode(gb, "B" + k, [-1.0 + 1.1 * eb[i], y - 0.2]); addEdge(gb, "b" + k, "B" + k, 1, "#f59e0b");
        addNode(gg, "g" + k, [-1.0, y]); addNode(gg, "G" + k, [-1.0 + 1.1 * max(ea[i], eb[i]), y]); addEdge(gg, "g" + k, "G" + k);
      }
    }
  }
  info = "**НОК по разложению на простые множители.** Берём все простые множители, входящие хотя бы в одно из чисел " + format(a, 0) + " и " + format(b, 0) + ", каждый в наибольшей из встречающихся степеней (зелёный столбец):\n\n";
  info = info + "**НОК(" + format(a, 0) + ", " + format(b, 0) + ") = " + pt() + "**.\n\n";
  info = info + "Результат делится на каждое число: " + format(prodV() / a, 0) + " · " + format(a, 0) + " = " + format(prodV() / b, 0) + " · " + format(b, 0) + ". Показатели НОД — минимумы, НОК — максимумы, а min + max = сумме двух показателей, поэтому НОД · НОК = a · b = " + format(a * b, 0) + ".";
}
]
