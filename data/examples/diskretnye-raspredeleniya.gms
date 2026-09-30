[
description = "{info}"

field width = 16; field height = 10;
camera type = fixed;

// ---- Дискретная величина на значениях 0, 1, 2, …, 20 (показаны до 20). Сверху — функция вероятностей p(k), снизу — ступенчатая
// функция распределения F. Две точки на оси задают a и b: янтарные столбики — значения k из (a; b], янтарный отрезок на F — F(b) − F(a). ----
new Point { name = "A"; pos = (-4.62, 0.65); pauseOnDrag = false; color = #f59e0b }
new Point { name = "B"; pos = (-1.96, 0.65); pauseOnDrag = false; color = #f59e0b }
draw Graph { name = "gB"; graph = "gb"; edgeColor = #3b82f6; edgeWidth = 17; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gC"; graph = "gc"; edgeColor = #3b82f6; edgeWidth = 3.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gI"; graph = "gi"; edgeColor = #f59e0b; edgeWidth = 17; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gD"; graph = "gd"; edgeColor = #f59e0b; edgeWidth = 4; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 9 }
draw Graph { name = "gA"; graph = "ga"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Text { name = "h1"; pos = (-7.6, 4.75); text = "p(k) = P(X = k)"; size = 0.85; align = left }
draw Text { name = "h2"; pos = (-7.6, -0.45); text = "F(x) = P(X ≤ x)"; size = 0.85; align = left }
draw Text { name = "k0"; pos = (-7.0, 0.05); text = "0"; size = 0.8 }
draw Text { name = "k5"; pos = (-3.5, 0.05); text = "5"; size = 0.8 }
draw Text { name = "k10"; pos = (0.0, 0.05); text = "10"; size = 0.8 }
draw Text { name = "k15"; pos = (3.5, 0.05); text = "15"; size = 0.8 }
draw Text { name = "k20"; pos = (7.0, 0.05); text = "20"; size = 0.8 }

new UI { name = "sF"; type = select; label = "распределение"; variable = fam; options = ("fin", "geom", "pois"); labels = ("конечное: 1…8, p(k) ∝ sᵏ⁻¹", "бесконечное: геометрическое", "бесконечное: Пуассона"); default = "geom" }
new UI { name = "sT"; type = slider; label = "параметр t"; variable = tt; min = 0.1; max = 0.9; step = 0.1; default = 0.3 }

// ---- Логика ----
string fam = "geom"; float tt = 0.3; float key = -1; string info = "";
list q = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function vx(t) { return -7 + 0.7 * t; }
Function tv(x) { return (x + 7) / 0.7; }
Function fy(f) { return -4.7 + 3.7 * f; }
Function cdf(t) { float s = 0; repeat (21) { if (i <= t) { s = s + q[i]; } } return s; }

Update {
  if (abs(A.pos.y - 0.65) > 0.001) { A.pos.y = 0.65; } if (abs(B.pos.y - 0.65) > 0.001) { B.pos.y = 0.65; }
  float fc = 0; if (fam == "geom") { fc = 1; } if (fam == "pois") { fc = 2; }
  float a = min(tv(A.pos.x), tv(B.pos.x)); float b = max(tv(A.pos.x), tv(B.pos.x));
  float k2 = ((fc * 10 + tt * 10) * 1000 + round(a * 20) + 100) * 1000 + round(b * 20) + 100;
  if (k2 != key) {
    key = k2;
    float s = 2 * tt; float lam = 10 * tt; float mu = 0; float d2 = 0; float tot = 0;
    repeat (21) { q[i] = 0; }
    if (fam == "fin") { repeat (8) { q[i + 1] = pow(s, i); tot = tot + q[i + 1]; } repeat (21) { q[i] = q[i] / tot; } repeat (21) { mu = mu + i * q[i]; } repeat (21) { d2 = d2 + (i - mu) * (i - mu) * q[i]; } }
    if (fam == "geom") { repeat (20) { q[i + 1] = pow(1 - tt, i) * tt; } mu = 1 / tt; d2 = (1 - tt) / (tt * tt); }
    if (fam == "pois") { q[0] = exp(-lam); repeat (20) { q[i + 1] = q[i] * lam / (i + 1); } mu = lam; d2 = lam; }
    float mx = 0.000001; repeat (21) { mx = max(mx, q[i]); }
    float H = 3.0 / mx;
    gb = newGraph(); gc = newGraph(); gi = newGraph(); gd = newGraph(); ga = newGraph();
    float f = 0; float cnt = 0; float shown = 0;
    addNode(gc, "n0", [-7.5, fy(0)]);
    repeat (21) {
      if (q[i] > 0.00005) {
        string c = format(i, 0);
        string gname = "b"; if (i > a && i <= b) { gname = "i"; }
        if (gname == "b") { addNode(gb, "a" + c, [vx(i), 1.2]); addNode(gb, "b" + c, [vx(i), 1.2 + H * q[i]]); addEdge(gb, "a" + c, "b" + c); }
        else { addNode(gi, "a" + c, [vx(i), 1.2]); addNode(gi, "b" + c, [vx(i), 1.2 + H * q[i]]); addEdge(gi, "a" + c, "b" + c); }
        float c1 = cnt; addNode(gc, "n" + format(c1 + 1, 0), [vx(i), fy(f)]); addEdge(gc, "n" + format(c1, 0), "n" + format(c1 + 1, 0));
        f = f + q[i]; addNode(gc, "n" + format(c1 + 2, 0), [vx(i), fy(f)]); addEdge(gc, "n" + format(c1 + 1, 0), "n" + format(c1 + 2, 0)); cnt = c1 + 2;
      }
    }
    shown = f;
    addNode(gc, "n" + format(cnt + 1, 0), [7.5, fy(f)]); addEdge(gc, "n" + format(cnt, 0), "n" + format(cnt + 1, 0));
    float fa = cdf(floor(a)); float fb = cdf(floor(b));
    if (a < 0) { fa = 0; } if (b < 0) { fb = 0; }
    addNode(gd, "d1", [vx(b), fy(fa)]); addNode(gd, "d2", [vx(b), fy(fb)]); if (fb - fa > 0.0005) { addEdge(gd, "d1", "d2"); }
    addNode(gd, "d3", [vx(a), fy(fa)]); addEdge(gd, "d3", "d1");
    addNode(ga, "x1", [-7.5, 1.2]); addNode(ga, "x2", [7.5, 1.2]); addEdge(ga, "x1", "x2");
    addNode(ga, "x3", [-7.5, fy(0)]); addNode(ga, "x4", [7.5, fy(0)]); addEdge(ga, "x3", "x4");
    addNode(ga, "x5", [-7.5, fy(1)]); addNode(ga, "x6", [7.5, fy(1)]); addEdge(ga, "x5", "x6");
    string fn = "Σ p(k) = 1."; if (shown < 0.9999) { fn = "Показаны k ≤ 20 (Σ p(k) по ним = " + format(shown, 3) + "); остальная масса — правее."; }
    string sp = "Носитель конечен: {1, …, 8}, сумма p(k) по нему равна 1."; if (fam == "geom") { sp = "Носитель бесконечен, но счётен: {1, 2, 3, …}; ряд Σ p(k) = p·Σ (1 − p)ᵏ⁻¹ = 1 сходится. p = t = " + format(tt, 1) + "."; }
    if (fam == "pois") { sp = "Носитель бесконечен, но счётен: {0, 1, 2, …}; ряд Σ p(k) = Σ λᵏe⁻λ/k! = 1 сходится. λ = 10t = " + format(lam, 1) + "."; }
    if (fam == "fin") { sp = sp + " Здесь s = 2t = " + format(s, 1) + "."; }
    info = "**Дискретное распределение** сосредоточено на счётном множестве значений и задаётся функцией вероятностей p(k) = P(X = k) ≥ 0 с суммой 1. Функция распределения F(x) = Σ p(k) по k ≤ x — **ступенчатая**: скачки в точках носителя, величина скачка равна p(k).\n\n" + sp + " " + fn + "\n\n";
    string kk = "нет значений носителя в (a; b], и вероятность равна 0"; float lo = floor(a) + 1; float hi = floor(b); lo = max(lo, 0);
    if (hi >= lo) { kk = "сумма p(k) для k = " + format(lo, 0) + " … " + format(hi, 0); if (hi == lo) { kk = "p(" + format(lo, 0) + ")"; } }
    info = info + "**P(a < X ≤ b) = F(b) − F(a)** = " + format(fb, 3) + " − " + format(fa, 3) + " = " + format(fb - fa, 3) + " при a = " + format(a, 2) + ", b = " + format(b, 2) + " — это " + kk + ". Вероятность попадания в отрезок — сумма, а не интеграл.\n\n";
    info = info + "E X = Σ k·p(k) = " + format(mu, 2) + ", D X = " + format(d2, 2) + " (ряды сходятся).";
  }
}
]
