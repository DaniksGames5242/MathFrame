[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;

// ---- Выборка (точки на оси) из выбранного семейства с истинными параметрами. Теоретические моменты
// приравниваются к выборочным, из уравнений находятся параметры. Синий контур — гистограмма
// выборки, зелёная кривая — истинная плотность, жёлтая — плотность с параметрами по методу моментов. ----
draw Graph { name = "gH"; graph = "gh"; edgeColor = #3b82f6; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gT"; graph = "gt"; edgeColor = #22c55e; edgeWidth = 2.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gF"; graph = "gf"; edgeColor = #f59e0b; edgeWidth = 2.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 9 }
draw Graph { name = "gR"; graph = "gr"; nodeColor = #3b82f688; nodeRadius = 2.5; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gAx"; graph = "gax"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 2 }
draw Text { name = "t0"; pos = (-7.5, -4.85); text = "0"; size = 0.9 }
draw Text { name = "t1"; pos = (0, -4.85); text = "5"; size = 0.9 }
draw Text { name = "t2"; pos = (7.5, -4.85); text = "10"; size = 0.9 }

new UI { name = "sF"; type = select; label = "семейство"; variable = fam; options = ("exp", "uni", "norm"); labels = ("показательное Exp(λ)", "равномерное U(0; θ)", "нормальное N(μ; σ²)"); default = "exp" }
new UI { name = "sL"; type = slider; label = "λ"; variable = lam; min = 0.2; max = 1; step = 0.05; default = 0.5; active = fam == "exp" }
new UI { name = "sT"; type = slider; label = "θ"; variable = th; min = 2; max = 9; step = 0.5; default = 6; active = fam == "uni" }
new UI { name = "sM"; type = slider; label = "μ"; variable = mu; min = 2; max = 8; step = 0.5; default = 5; active = fam == "norm" }
new UI { name = "sG"; type = slider; label = "σ"; variable = sg; min = 0.5; max = 2; step = 0.1; default = 1.2; active = fam == "norm" }
new UI { name = "sN"; type = slider; label = "объём выборки n"; variable = n; min = 5; max = 200; step = 1; default = 40 }
new UI { name = "sS"; type = slider; label = "выборка"; variable = seed; min = 1; max = 30; step = 1; default = 1 }

string fam = "exp"; float lam = 0.5; float th = 6; float mu = 5; float sg = 1.2; float n = 40; float seed = 1;
float key = -1; string info = "";
float m1 = 0; float m2 = 0; float ea = 0; float eb = 0;
list cnt = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

Function rnd(k) { float v = sin(k * 12.9898 + 4.1) * 43758.5453; return v - floor(v); }
Function nrm(k) { return sqrt(-2 * log(rnd(2 * k) + 0.000001)) * cos(2 * pi * rnd(2 * k + 1)); }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function vx(v) { return -7.5 + 1.5 * v; }
Function dens(x, a, b) {
  if (fam == "exp") { if (x < 0) { return 0; } return a * exp(-a * x); }
  if (fam == "uni") { if (x < 0 || x > a) { return 0; } return 1 / a; }
  return normalPdf(x, a, b);
}
Function dy(d) { return min(4.7, -4.5 + 8 * d); }
Function curve(g, a, b) {
  repeat (201) { addNode(g, "c" + format(i, 0), [vx(i * 0.05), dy(dens(i * 0.05, a, b))]); }
  repeat (200) { addEdge(g, "c" + format(i, 0), "c" + format(i + 1, 0)); }
}

Update {
  float kf = 0; if (fam == "uni") { kf = 1; } if (fam == "norm") { kf = 2; }
  float pa = lam; float pb = 0; if (fam == "uni") { pa = th; } if (fam == "norm") { pa = mu; pb = sg; }
  if (key != (((seed * 300 + n) * 3 + kf) * 100 + pa * 10) * 100 + pb * 10) {
    key = (((seed * 300 + n) * 3 + kf) * 100 + pa * 10) * 100 + pb * 10;
    repeat (20) { cnt[i] = 0; }
    gr = newGraph(); float s1 = 0; float s2 = 0;
    repeat (n) {
      float x = 0; float u = rnd(seed * 100000 + i * 2 + 0.5);
      if (fam == "exp") { x = -log(u + 0.000001) / lam; }
      if (fam == "uni") { x = th * u; }
      if (fam == "norm") { x = mu + sg * nrm(seed * 100000 + i); }
      s1 = s1 + x; s2 = s2 + x * x;
      float bi = max(0, min(19, floor(x / 0.5)));
      cnt[bi] = cnt[bi] + 1;
      addNode(gr, "r" + format(i, 0), [vx(max(0, min(10, x))), -4.7]);
    }
    m1 = s1 / n; m2 = s2 / n;
    float fa = 1 / m1; float fb = 0;
    if (fam == "uni") { fa = 2 * m1; }
    if (fam == "norm") { fa = m1; fb = sqrt(max(0.0001, m2 - m1 * m1)); }
    ea = fa; eb = fb;
    gh = newGraph(); gt = newGraph(); gf = newGraph(); gax = newGraph();
    addNode(gh, "s", [-7.5, -4.5]);
    repeat (20) { float b = i; addNode(gh, "u" + format(b, 0), [vx(0.5 * b), dy(cnt[b] / (n * 0.5))]); addNode(gh, "v" + format(b, 0), [vx(0.5 * (b + 1)), dy(cnt[b] / (n * 0.5))]); }
    addNode(gh, "e", [7.5, -4.5]);
    addEdge(gh, "s", "u0");
    repeat (20) { float b = i; addEdge(gh, "u" + format(b, 0), "v" + format(b, 0)); if (b < 19) { addEdge(gh, "v" + format(b, 0), "u" + format(b + 1, 0)); } }
    addEdge(gh, "v19", "e");
    curve(gt, pa, pb); curve(gf, ea, eb);
    addNode(gax, "p", [-7.5, -4.5]); addNode(gax, "q", [7.5, -4.5]); addEdge(gax, "p", "q");
  }
  info = "**Метод моментов:** теоретические моменты, выраженные через параметры, приравниваются к выборочным; из полученной системы находятся оценки. Число уравнений равно числу параметров. Выборка объёма n = **" + format(n, 0) + "**, выборочные моменты: m₁ = X̄ = **" + format(m1, 3) + "**, m₂ = (X₁² + … + Xₙ²)/n = **" + format(m2, 3) + "**.\n\n";
  if (fam == "exp") { info = info + "**Exp(λ):** E X = 1/λ. Уравнение 1/λ = X̄ даёт λ̂ = 1/X̄ = **" + format(ea, 3) + "** (истинное λ = " + format(lam, 2) + ")."; }
  if (fam == "uni") { info = info + "**U(0; θ):** E X = θ/2. Уравнение θ/2 = X̄ даёт θ̂ = 2X̄ = **" + format(ea, 3) + "** (истинное θ = " + format(th, 1) + "). Оценка может оказаться меньше наибольшего наблюдения."; }
  if (fam == "norm") { info = info + "**N(μ; σ²):** E X = μ, D(X) = E X² − (E X)². Уравнения μ = m₁ и σ² = m₂ − m₁² дают μ̂ = **" + format(ea, 3) + "**, σ̂² = **" + format(eb * eb, 3) + "** (истинные μ = " + format(mu, 1) + ", σ² = " + format(sg * sg, 2) + ")."; }
}
]
