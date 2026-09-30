[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Дискретные случайные величины: конечная (кубик) и счётные (геометрическая,
// Пуассона). Сверху — вероятности pₖ (атомы), снизу — ступенчатая функция
// распределения F. ----
string tp = "geom"; float q = 0.6; float lam = 3; string info = "";
draw Graph { name = "vB"; graph = "gB"; edgeColor = #3b82f6; edgeWidth = 16; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "vF"; graph = "gF"; edgeColor = #22c55e; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "vX"; graph = "gX"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "vL"; graph = "gL"; nodeRadius = 0; labels = true; interactive = false; showWeights = false; layer = 6 }
draw Text { name = "t1"; pos = (-9.7, 5.6); text = "pₖ = P(X = xₖ)"; size = 0.9; align = left }
draw Text { name = "t2"; pos = (-9.7, -0.5); text = "F(x) = P(X ≤ x)"; size = 0.9; align = left }
new UI { name = "sT"; type = select; label = "величина"; variable = tp; options = ("die", "geom", "pois"); labels = ("кубик, xₖ = 1…6", "геометрическая, xₖ = 1, 2, …", "Пуассона, xₖ = 0, 1, …"); default = "geom" }
new UI { name = "sQ"; type = slider; label = "q"; variable = q; min = 0.2; max = 0.9; step = 0.05; default = 0.6 }
new UI { name = "sL"; type = slider; label = "λ"; variable = lam; min = 0.5; max = 6; step = 0.5; default = 3 }

Function pk(j) {
  if (tp == "die") { if (j < 5.5) { return 1 / 6; } return 0; }
  if (tp == "geom") { return (1 - q) * pow(q, j); }
  float p = exp(-lam); repeat (j) { p = p * lam / (i + 1); } return p;
}
Function px(j) { return -8.5 + 17 * (j + 0.5) / 12; }

Update {
  float n = 12; if (tp == "die") { n = 6; }
  float k0 = 1; if (tp == "pois") { k0 = 0; }
  float pm = 0; repeat (n) { pm = max(pm, pk(i)); }
  gB = newGraph(); gF = newGraph(); gX = newGraph(); gL = newGraph();
  addNode(gX, "a", [-9.7, 0.8]); addNode(gX, "b", [9.7, 0.8]); addEdge(gX, "a", "b");
  addNode(gX, "c", [-9.7, -5.0]); addNode(gX, "d", [9.7, -5.0]); addEdge(gX, "c", "d");
  addNode(gX, "e", [-9.7, -1.0]); addNode(gX, "f", [9.7, -1.0]); addEdge(gX, "e", "f");
  float s = 0; float dx = 17 / 12;
  repeat (n) {
    float p = pk(i); string js = format(i, 0);
    addNode(gB, "p" + js, [px(i), 0.8]); addNode(gB, "q" + js, [px(i), 0.8 + 4.4 * p / pm]); addEdge(gB, "p" + js, "q" + js);
    addNode(gL, "l" + js, [px(i), -5.7], format(k0 + i, 0));
    addNode(gF, "a" + js, [px(i) - dx / 2, -5.0 + 4 * s]);
    s = s + p;
    addNode(gF, "b" + js, [px(i) - dx / 2, -5.0 + 4 * s]); addNode(gF, "c" + js, [px(i) + dx / 2, -5.0 + 4 * s]);
    addEdge(gF, "a" + js, "b" + js); addEdge(gF, "b" + js, "c" + js);
    if (i > 0.5) { addEdge(gF, "c" + format(i - 1, 0), "a" + js); }
  }
  string what = "**Дискретная случайная величина** — случайная величина с не более чем счётным множеством значений; каждое значение xₖ — атом, то есть имеет положительную вероятность pₖ, а вся вероятность сосредоточена в этих точках.\n\n";
  if (tp == "die") { info = what + "Кубик: 6 значений, p₁ = … = p₆ = 1/6, ∑ pₖ = " + format(s, 3) + " = 1 (носитель конечен). F — ступенчатая функция: скачок в точке xₖ равен pₖ, между скачками F постоянна."; }
  if (tp == "geom") { info = what + "Геометрическая: pₖ = (1 − q)·qᵏ⁻¹, q = " + format(q, 2) + ", значений бесконечно много, но счётно. На экране 12 значений: ∑ = " + format(s, 4) + ", остаток " + format(1 - s, 4) + " = q¹² — ряд вероятностей сходится к 1. F поднимается ступеньками к 1, не достигая её."; }
  if (tp == "pois") { info = what + "Пуассона: pₖ = e⁻λ·λᵏ/k!, λ = " + format(lam, 1) + ", k = 0, 1, 2, … На экране 12 значений: ∑ = " + format(s, 4) + ", остаток " + format(1 - s, 4) + ". Вероятности убывают так быстро, что ряд сходится к 1."; }
}
]
