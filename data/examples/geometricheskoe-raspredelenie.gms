[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Столбики — P(X = k) = p·qᵏ⁻¹, k = 1…20. Жёлтые — значения k > s (X > s). Зелёные точки — условное
// распределение при X > s: P(X = s + j | X > s), лежат на «сдвинутом» исходном распределении — отсутствие последействия. ----
draw Graph { name = "gGr"; graph = "gg"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gB"; graph = "gb"; edgeWidth = 13; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gM"; graph = "gm"; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gN"; graph = "gn"; nodeColor = #22c55e; nodeRadius = 5; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Text { name = "t1"; pos = (px(1), -5.7); text = "1"; size = 0.9 }
draw Text { name = "t5"; pos = (px(5), -5.7); text = "5"; size = 0.9 }
draw Text { name = "t10"; pos = (px(10), -5.7); text = "10"; size = 0.9 }
draw Text { name = "t15"; pos = (px(15), -5.7); text = "15"; size = 0.9 }
draw Text { name = "t20"; pos = (px(20), -5.7); text = "20"; size = 0.9 }
draw Text { name = "tk"; pos = (9.6, -5.7); text = "k"; size = 0.9 }
draw Text { name = "ty"; pos = (-9.6, 5.5); text = "линии сетки — через " + format(gstep, 2); size = 0.9; align = left }

new UI { name = "sP"; type = slider; label = "p"; variable = ps; min = 0.05; max = 0.95; step = 0.01; default = 0.3 }
new UI { name = "sS"; type = slider; label = "s"; variable = sh; min = 0; max = 10; step = 1; default = 3 }
new UI { name = "sT"; type = slider; label = "t"; variable = tt; min = 1; max = 8; step = 1; default = 2 }

// ---- Логика ----
float ps = 0.3; float sh = 3; float tt = 2; float key = -1; float gstep = 0.1;
string info = "";
Function px(u) { return -9.4 + 18.8 * (u - 0.5) / 20; }

Update {
  if (key != ps * 10000 + sh * 10 + tt) {
    gg = newGraph(); gb = newGraph(); gm = newGraph(); gn = newGraph();
    float qf = 1 - ps;
    gstep = 0.1; if (ps < 0.2) { gstep = 0.05; }
    float tp = gstep * ceil(ps / gstep);
    float sy = 10 / tp;
    addNode(gg, "x1", [-9.6, -5]); addNode(gg, "x2", [9.6, -5]); addEdge(gg, "x1", "x2");
    repeat (round(tp / gstep)) {
      string s = format(i + 1, 0);
      addNode(gg, "l" + s, [-9.6, -5 + gstep * sy * (i + 1)]); addNode(gg, "r" + s, [9.6, -5 + gstep * sy * (i + 1)]); addEdge(gg, "l" + s, "r" + s);
    }
    repeat (20) {
      float k = i + 1; string s = format(k, 0);
      string c = "#3b82f6"; if (k > sh) { c = "#f59e0b"; }
      addNode(gb, "a" + s, [px(k), -5]); addNode(gb, "b" + s, [px(k), -5 + sy * ps * pow(qf, k - 1)]); addEdge(gb, "a" + s, "b" + s, 1, c);
      if (k > sh) { addNode(gn, "n" + s, [px(k), -5 + sy * ps * pow(qf, k - sh - 1)]); }
    }
    addNode(gm, "m1", [px(1 / ps), -5.4]); addNode(gm, "m2", [px(1 / ps), -4.6]); addEdge(gm, "m1", "m2");
    info = "**Геометрическое распределение:** число испытаний до первого успеха включительно, p = " + format(ps, 2) + ", q = " + format(qf, 2) + ". P(X = k) = p·qᵏ⁻¹, k = 1, 2, 3, … Математическое ожидание E[X] = 1/p = " + format(1 / ps, 2) + " (отметка на оси), дисперсия D[X] = q/p² = " + format(qf / (ps * ps), 2) + ".\n\n**Отсутствие последействия.** P(X > s) = qˢ = " + format(pow(qf, sh), 4) + ". Условная вероятность P(X > s + t | X > s) = qˢ⁺ᵗ/qˢ = " + format(pow(qf, sh + tt), 4) + " / " + format(pow(qf, sh), 4) + " = " + format(pow(qf, tt), 4) + " = qᵗ = P(X > t): множитель qˢ сокращается.";
    if (sh > 0) { info = info + " Зелёные точки: P(X = s + j | X > s) = p·qʲ⁻¹ = P(X = j) — жёлтая часть (X > s), поделённая на qˢ, повторяет всё распределение, сдвинутое на s = " + format(sh, 0) + "."; }
    key = ps * 10000 + sh * 10 + tt;
  }
}
]
