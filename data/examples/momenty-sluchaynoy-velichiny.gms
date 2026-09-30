[
description = "{info}"

field width = 16; field height = 12;
camera type = fixed;

// ---- Дискретная величина X на семи значениях. Сверху — вероятности, снизу — слагаемые момента
// (x − c)ᵏ·P(X = x): синие — положительные, оранжевые — отрицательные; момент — их сумма.
// Зелёная черта — центр c: 0 для начальных моментов, E X для центральных. ----
draw Graph { name = "gB"; graph = "gb"; edgeColor = #3b82f6; edgeWidth = 30; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gT"; graph = "gt"; edgeWidth = 30; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gM"; graph = "gm"; edgeColor = #22c55e; edgeWidth = 3; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 9 }
draw Graph { name = "gA"; graph = "ga"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Text { name = "h1"; pos = (-7.6, 4.75); text = "P(X = x)"; size = 0.85; align = left }
draw Text { name = "h2"; pos = (-7.6, -0.45); text = lab; size = 0.85; align = left }
draw Text { name = "h3"; pos = (7.6, -5.55); text = "c = " + num(cc, 2); size = 0.85; align = right; color = #22c55e }
draw Text { name = "z0"; pos = (0, 0.4); text = "0"; size = 0.8 }
draw Text { name = "z1"; pos = (6, 0.4); text = "5"; size = 0.8 }
draw Text { name = "z2"; pos = (-6, 0.4); text = "−5"; size = 0.8 }

new UI { name = "sD"; type = select; label = "распределение"; variable = dist; options = ("sym", "right", "left", "bi"); labels = ("симметричное", "скошенное вправо", "скошенное влево", "два пика"); default = "right" }
new UI { name = "sT"; type = select; label = "момент"; variable = mt; options = ("raw", "central", "abs"); labels = ("начальный E Xᵏ", "центральный E(X − E X)ᵏ", "абсолютный центральный E|X − E X|ᵏ"); default = "central" }
new UI { name = "sK"; type = slider; label = "порядок k"; variable = kk; min = 1; max = 6; step = 1; default = 3 }
new UI { name = "sS"; type = slider; label = "сдвиг значений"; variable = sh; min = -2; max = 2; step = 0.5; default = 0 }

// ---- Логика ----
string dist = "right"; string mt = "central"; float kk = 3; float sh = 0;
list p = (0.3, 0.3, 0.2, 0.1, 0.05, 0.03, 0.02);
float key = -1; float cc = 0; string lab = ""; string info = "";
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function vx(v) { return 1.2 * v; }
Function sup(k) { if (k == 1) { return "¹"; } if (k == 2) { return "²"; } if (k == 3) { return "³"; } if (k == 4) { return "⁴"; } if (k == 5) { return "⁵"; } return "⁶"; }
Function pw(x, k) { float r = 1; repeat (k) { r = r * x; } return r; }

Update {
  float dc = 0; if (dist == "right") { dc = 1; } if (dist == "left") { dc = 2; } if (dist == "bi") { dc = 3; }
  float tc = 0; if (mt == "central") { tc = 1; } if (mt == "abs") { tc = 2; }
  float k2 = ((dc * 3 + tc) * 7 + kk) * 10 + sh * 2;
  if (k2 != key) {
    key = k2;
    if (dist == "sym") { p[0] = 0.05; p[1] = 0.1; p[2] = 0.2; p[3] = 0.3; p[4] = 0.2; p[5] = 0.1; p[6] = 0.05; }
    if (dist == "right") { p[0] = 0.3; p[1] = 0.3; p[2] = 0.2; p[3] = 0.1; p[4] = 0.05; p[5] = 0.03; p[6] = 0.02; }
    if (dist == "left") { p[0] = 0.02; p[1] = 0.03; p[2] = 0.05; p[3] = 0.1; p[4] = 0.2; p[5] = 0.3; p[6] = 0.3; }
    if (dist == "bi") { p[0] = 0.25; p[1] = 0.1; p[2] = 0.05; p[3] = 0.2; p[4] = 0.05; p[5] = 0.1; p[6] = 0.25; }
    float ex = 0; repeat (7) { ex = ex + (i - 3 + sh) * p[i]; }
    float m2 = 0; float m3 = 0; float m4 = 0; repeat (7) { float d = i - 3 + sh - ex; m2 = m2 + d * d * p[i]; m3 = m3 + d * d * d * p[i]; m4 = m4 + d * d * d * d * p[i]; }
    cc = 0; if (tc > 0) { cc = ex; }
    gb = newGraph(); gt = newGraph(); gm = newGraph(); ga = newGraph();
    float mx = 0.000001; repeat (7) { float d = i - 3 + sh - cc; if (tc == 2) { d = abs(d); } mx = max(mx, abs(pw(d, kk) * p[i])); }
    float sc = 2.3 / mx; float mom = 0;
    repeat (7) {
      float x = vx(i - 3 + sh); float d = i - 3 + sh - cc; if (tc == 2) { d = abs(d); } float t = pw(d, kk) * p[i]; mom = mom + t;
      addNode(gb, "a" + format(i, 0), [x, 0.8]); addNode(gb, "b" + format(i, 0), [x, 0.8 + 6 * p[i]]); addEdge(gb, "a" + format(i, 0), "b" + format(i, 0));
      if (abs(t) > 0.0000001) { string c = "#3b82f6"; if (t < 0) { c = "#f59e0b"; } addNode(gt, "a" + format(i, 0), [x, -3.2]); addNode(gt, "b" + format(i, 0), [x, -3.2 + sc * t]); addEdge(gt, "a" + format(i, 0), "b" + format(i, 0), 1, c); }
    }
    addNode(gm, "c1", [vx(cc), -5.6]); addNode(gm, "c2", [vx(cc), 4.6]); addEdge(gm, "c1", "c2");
    addNode(ga, "g1", [-7.5, 0.8]); addNode(ga, "g2", [7.5, 0.8]); addEdge(ga, "g1", "g2");
    addNode(ga, "g3", [-7.5, -3.2]); addNode(ga, "g4", [7.5, -3.2]); addEdge(ga, "g3", "g4");
    string ft = "(x − c)" + sup(kk); string sm = "начальный"; string nk = "E X" + sup(kk);
    if (tc == 1) { nk = "μ" + sup(kk); sm = "центральный"; }
    if (tc == 2) { nk = "E|X − E X|" + sup(kk); sm = "абсолютный центральный"; ft = "|x − c|" + sup(kk); }
    lab = "слагаемые " + ft + " · P(X = x)";
    if (tc == 0) { lab = "слагаемые xᵏ · P(X = x)"; ft = "x" + sup(kk); }
    info = "**Момент порядка k** — среднее значения k-й степени: **начальный** E Xᵏ = Σ xᵏ·P(X = x); **центральный** μₖ = E(X − E X)ᵏ — то же для отклонения от среднего; **абсолютный** — с модулем. E X — начальный момент 1-го порядка, D X = μ₂ — центральный 2-го.\n\n";
    info = info + "**k = " + format(kk, 0) + ", " + sm + ":** Σ " + ft + " · P(X = x) = **" + num(mom, 3) + "** — сумма слагаемых нижней панели.\n\n";
    info = info + "E X = " + num(ex, 2) + ", D X = " + num(m2, 3) + ", асимметрия μ₃/σ³ = " + num(m3 / pow(m2, 1.5), 2) + ", эксцесс μ₄/σ⁴ = " + num(m4 / (m2 * m2), 2) + ". У распределения конечный носитель, поэтому все моменты существуют.";
    if (dist == "sym") { if (tc == 1) { if (kk - 2 * floor(kk / 2) == 1) { info = info + "\n\nРаспределение симметрично относительно E X — центральные моменты нечётных порядков равны нулю."; } } }
    if (sh != 0) { info = info + "\n\nСдвиг значений меняет начальные моменты, но не центральные."; }
  }
}
]
