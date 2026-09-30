[
description = "{info}"

field width = 16; field height = 10;
camera type = fixed;

// ---- Семейство выбирается списком, параметры n и p — ползунками. Синие столбики (или кривая плотности) — выбранное
// распределение; оранжевые точки — биномиальное B(n, p) с теми же n, p: Пуассон (λ = np) и нормальное (μ = np, σ² = np(1 − p))
// приближают его пределом. Зелёный отрезок под осью — [E − σ; E + σ]. ----
draw Graph { name = "gB"; graph = "gb"; edgeColor = #3b82f6; edgeWidth = 17; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gN"; graph = "gn"; edgeColor = #3b82f6; edgeWidth = 4; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gG"; graph = "gg"; nodeColor = #f59e0b; nodeRadius = 5; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gM"; graph = "gm"; edgeColor = #22c55e; edgeWidth = 3; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 9 }
draw Graph { name = "gA"; graph = "ga"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Text { name = "k0"; pos = (-7.0, -4.35); text = "0"; size = 0.8 }
draw Text { name = "k5"; pos = (-3.5, -4.35); text = "5"; size = 0.8 }
draw Text { name = "k10"; pos = (0.0, -4.35); text = "10"; size = 0.8 }
draw Text { name = "k15"; pos = (3.5, -4.35); text = "15"; size = 0.8 }
draw Text { name = "k20"; pos = (7.0, -4.35); text = "20"; size = 0.8 }

new UI { name = "sF"; type = select; label = "распределение"; variable = fam; options = ("bern", "bin", "geom", "pois", "norm"); labels = ("Бернулли Bern(p)", "биномиальное B(n, p)", "геометрическое Geom(p)", "Пуассона Π(np)", "нормальное N(np, np(1 − p))"); default = "bin" }
new UI { name = "sN"; type = slider; label = "n"; variable = n; min = 1; max = 20; step = 1; default = 10 }
new UI { name = "sP"; type = slider; label = "p"; variable = pp; min = 0.05; max = 0.95; step = 0.05; default = 0.3 }

// ---- Логика ----
string fam = "bin"; float n = 10; float pp = 0.3;
float key = -1; string info = "";
list q = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); list g = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function vx(k) { return -7 + 0.7 * k; }
Function dens(x, mu, s2) { return exp(-(x - mu) * (x - mu) / (2 * s2)) / sqrt(2 * 3.14159265 * s2); }

Update {
  float fc = 0; if (fam == "bin") { fc = 1; } if (fam == "geom") { fc = 2; } if (fam == "pois") { fc = 3; } if (fam == "norm") { fc = 4; }
  float k2 = (fc * 100 + n) * 1000 + round(pp * 100);
  if (k2 != key) {
    key = k2;
    float mu = 0; float s2 = 0; float lam = n * pp;
    // биномиальное — для сравнения и как основное
    g[0] = pow(1 - pp, n); repeat (20) { g[i + 1] = 0; if (i < n) { g[i + 1] = g[i] * (n - i) / (i + 1) * pp / (1 - pp); } }
    repeat (21) { q[i] = 0; }
    if (fam == "bern") { q[0] = 1 - pp; q[1] = pp; mu = pp; s2 = pp * (1 - pp); }
    if (fam == "bin") { repeat (21) { q[i] = g[i]; } mu = n * pp; s2 = n * pp * (1 - pp); }
    if (fam == "geom") { repeat (20) { q[i + 1] = pow(1 - pp, i) * pp; } mu = 1 / pp; s2 = (1 - pp) / (pp * pp); }
    if (fam == "pois") { q[0] = exp(-lam); repeat (20) { q[i + 1] = q[i] * lam / (i + 1); } mu = lam; s2 = lam; }
    if (fam == "norm") { mu = lam; s2 = lam * (1 - pp); }
    float mx = 0.000001;
    repeat (21) { mx = max(mx, q[i]); if (fam != "bin") { mx = max(mx, g[i]); } }
    if (fam == "norm") { mx = max(mx, dens(mu, mu, s2)); }
    float H = 7.6 / mx;
    gb = newGraph(); gn = newGraph(); gg = newGraph(); gm = newGraph(); ga = newGraph();
    if (fam != "norm") { repeat (21) { if (q[i] > 0.00005) { addNode(gb, "a" + format(i, 0), [vx(i), -4]); addNode(gb, "b" + format(i, 0), [vx(i), -4 + H * q[i]]); addEdge(gb, "a" + format(i, 0), "b" + format(i, 0)); } } }
    if (fam == "norm") { repeat (201) { float x = -0.7 + 21.4 * i / 200; addNode(gn, "c" + format(i, 0), [vx(x), -4 + H * dens(x, mu, s2)]); if (i > 0) { addEdge(gn, "c" + format(i - 1, 0), "c" + format(i, 0)); } } }
    if (fam != "bin") { repeat (21) { if (g[i] > 0.00005) { addNode(gg, "g" + format(i, 0), [vx(i), -4 + H * g[i]]); } } }
    float sg = sqrt(s2); float lo = max(-7.4, vx(mu - sg)); float hi = min(7.4, vx(mu + sg)); float xm = min(7.4, vx(mu));
    addNode(gm, "e1", [lo, -4.75]); addNode(gm, "e2", [hi, -4.75]); addEdge(gm, "e1", "e2");
    addNode(gm, "e3", [lo, -4.6]); addNode(gm, "e4", [lo, -4.9]); addEdge(gm, "e3", "e4");
    addNode(gm, "e5", [hi, -4.6]); addNode(gm, "e6", [hi, -4.9]); addEdge(gm, "e5", "e6");
    addNode(gm, "e7", [xm, -4.5]); addNode(gm, "e8", [xm, -5]); addEdge(gm, "e7", "e8");
    addNode(ga, "x1", [-7.5, -4]); addNode(ga, "x2", [7.5, -4]); addEdge(ga, "x1", "x2");
    info = "**Основные распределения** — именованные семейства с небольшим числом параметров: они полностью задают закон, а значит и E X, D X. Дискретные: Бернулли, биномиальное, геометрическое, Пуассона; непрерывное: нормальное.\n\n";
    if (fam == "bern") { info = info + "**Бернулли Bern(p):** один опыт с двумя исходами, P(X = 1) = p = " + format(pp, 2) + ", P(X = 0) = 1 − p = " + format(1 - pp, 2) + "; E X = p, D X = p(1 − p) = " + format(s2, 3) + ". Оранжевые точки — B(n, p) при n = " + format(n, 0) + ": при n = 1 они совпадают со столбиками."; }
    if (fam == "bin") { info = info + "**Биномиальное B(n, p):** число успехов в n = " + format(n, 0) + " независимых опытах с вероятностью успеха p = " + format(pp, 2) + "; P(X = k) = Cⁿₖ·pᵏ(1 − p)ⁿ⁻ᵏ. E X = np = " + format(mu, 2) + ", D X = np(1 − p) = " + format(s2, 3) + ". При n = 1 это Bern(p)."; }
    if (fam == "geom") { info = info + "**Геометрическое Geom(p):** число опытов до первого успеха, P(X = k) = (1 − p)ᵏ⁻¹·p, k = 1, 2, …; p = " + format(pp, 2) + ", E X = 1/p = " + format(mu, 2) + ", D X = (1 − p)/p² = " + format(s2, 2) + ". Показаны k ≤ 20 (правее остаётся масса " + format(pow(1 - pp, 20), 3) + "); оранжевые точки — B(n, p)."; }
    if (fam == "pois") { info = info + "**Пуассона Π(λ):** число редких событий, P(X = k) = λᵏ·e⁻λ/k!, здесь λ = np = " + format(lam, 2) + "; E X = D X = λ. Оранжевые точки — B(n, p): при большом n и малом p биномиальное близко к Пуассону."; }
    if (fam == "norm") { info = info + "**Нормальное N(μ, σ²)** с μ = np = " + format(mu, 2) + ", σ² = np(1 − p) = " + format(s2, 3) + " — плотность 1/(σ√2π)·e^(−(x − μ)²/2σ²). Оранжевые точки — B(n, p): при большом np(1 − p) биномиальное хорошо приближается нормальным (Муавр — Лаплас)."; }
    info = info + "\n\nЗелёный отрезок — [E X − σ; E X + σ], σ = " + format(sg, 2) + ".";
  }
}
]
