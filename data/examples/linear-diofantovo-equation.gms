[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;
show axes = true;

// ---- Прямая ax + by = c и целочисленная решётка. Зелёные точки — целые решения (они
// идут с постоянным шагом (b/g, −a/g)), жёлтая — частное решение с наименьшим x ≥ 0. ----
draw Function { name = "ln"; f = "fl"; xmin = -10; xmax = 10; color = #3b82f6; thickness = 2 }
draw Graph { name = "gL"; graph = "gl"; nodeColor = #3b82f688; nodeRadius = 3; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gS"; graph = "gs"; nodeColor = #22c55e; nodeRadius = 8; edgeColor = #22c55e; edgeWidth = 2; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gP"; graph = "gp"; nodeColor = #f59e0b; nodeRadius = 10; labels = false; interactive = false; showWeights = false; layer = 12 }

new UI { type = slider; label = "a"; variable = a; min = -9; max = 9; step = 1; default = 4 }
new UI { type = slider; label = "b"; variable = b; min = 1; max = 9; step = 1; default = 6 }
new UI { type = slider; label = "c"; variable = c; min = -20; max = 20; step = 1; default = 10 }

float a = 4; float b = 6; float c = 10;
float key = -1; float cnt = 0; string info = "";
func fl(x) = (c - a * x) / b;

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function term(x, v) {
  if (x < 0) { return " − " + format(-x, 0) + v; }
  return " + " + format(x, 0) + v;
}
Function gcd(x, y) {
  float u = abs(x); float v = abs(y);
  repeat (30) { if (v > 0) { float t = u - v * floor(u / v); u = v; v = t; } }
  return u;
}
// коэффициент s расширенного алгоритма Евклида: |a|·s + b·t = НОД
Function bez(x, y) {
  float r0 = abs(x); float r1 = y; float s0 = 1; float s1 = 0;
  repeat (30) { if (r1 > 0) { float q = floor(r0 / r1); float r2 = r0 - q * r1; float s2 = s0 - q * s1; r0 = r1; r1 = r2; s0 = s1; s1 = s2; } }
  return s0;
}

Update {
  float kk = ((a + 10) * 10 + b) * 50 + c + 25;
  float g = gcd(a, b);
  float ok = 0; if (c - g * floor(c / g) == 0) { ok = 1; }
  float st = b / g;
  float x0 = 0; float y0 = 0;
  if (ok > 0) {
    float s = bez(a, b); if (a < 0) { s = -s; }
    x0 = s * c / g; x0 = x0 - st * floor(x0 / st); y0 = (c - a * x0) / b;
  }
  if (key != kk) {
    gs = newGraph(); gp = newGraph(); gl = newGraph(); cnt = 0;
    repeat (273) { addNode(gl, "p" + format(i, 0), [i - 21 * floor(i / 21) - 10, floor(i / 21) - 6]); }
    float prev = -99;
    repeat (21) {
      float x = i - 10; float y = (c - a * x) / b;
      if (abs(y - round(y)) < 0.0001 && abs(y) <= 6) {
        addNode(gs, "s" + format(i, 0), [x, round(y)]); cnt = cnt + 1;
        if (prev >= 0) { addEdge(gs, "s" + format(prev, 0), "s" + format(i, 0)); }
        prev = i;
      }
    }
    if (ok > 0 && x0 <= 10 && abs(y0) <= 6) { addNode(gp, "q", [x0, y0]); }
    key = kk;
  }
  string eq = num(a, 0) + "x" + term(b, "y") + " = " + num(c, 0);
  if (a == 0) { eq = "0x" + term(b, "y") + " = " + num(c, 0); }
  info = "**Уравнение " + eq + ".** НОД(" + num(a, 0) + ", " + num(b, 0) + ") = **" + num(g, 0) + "**.\n\n";
  if (ok > 0) {
    info = info + "Свободный член " + num(c, 0) + " делится на " + num(g, 0) + " — решение существует. Расширенный алгоритм Евклида даёт частное решение (x₀, y₀) = (" + num(x0, 0) + ", " + num(y0, 0) + "), а все решения: (x₀ + " + num(st, 0) + "t, y₀ " + term(-a / g, "t") + "), t ∈ ℤ — на поле они идут с постоянным шагом по прямой. В окне решений: **" + format(cnt, 0) + "**.";
  }
  if (ok < 1) {
    info = info + "Свободный член " + num(c, 0) + " не делится на " + num(g, 0) + ", а левая часть ax + by всегда кратна " + num(g, 0) + " — целых решений нет: прямая проходит между узлами решётки.";
  }
}
]
