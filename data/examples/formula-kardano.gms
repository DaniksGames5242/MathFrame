[
description = "{info}"

field width = 10;
field height = 8;
camera type = fixed;

// ---- Приведённое кубическое уравнение x³ + px + q = 0 и формула Кардано: x = u + v, где
// u³, v³ = −q/2 ± √Δ, Δ = (q/2)² + (p/3)³, uv = −p/3. Зелёные точки — вещественные корни. ----
float p = -3; float q = 1; float key = -1; string info = "";
Function f(x) { return x * x * x + p * x + q; }
draw Function { name = "gr"; f = "f"; xmin = -5; xmax = 5; grid = true; color = #3b82f6; thickness = 3 }
draw Graph { name = "gRoot"; graph = "groot"; nodeColor = #22c55e; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 8 }
new UI { type = slider; label = "p"; variable = p; min = -6; max = 6; step = 0.1; default = -3 }
new UI { type = slider; label = "q"; variable = q; min = -6; max = 6; step = 0.1; default = 1 }

Function num(x, d) { if (abs(x) < 0.5 * pow(10, -d)) { return format(0, d); } if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function term(c, m) { if (abs(c) < 0.005) { return ""; } if (c < 0) { return " − " + format(-c, 2) + m; } return " + " + format(c, 2) + m; }
Function cr(x) { if (x < 0) { return -pow(-x, 1 / 3); } return pow(x, 1 / 3); }
Function cpl(a, b) { if (b < 0) { return num(a, 3) + " − " + format(-b, 3) + "i"; } return num(a, 3) + " + " + format(b, 3) + "i"; }

Update {
  float D = q * q / 4 + p * p * p / 27;
  float kk = p * 100 + q * 7 + 1000;
  string t = "**Формула Кардано** для x³" + term(p, "x") + term(q, "") + " = 0. Дискриминант Δ = (q/2)² + (p/3)³ = " + num(D, 3) + ".\n\n";
  string rt = "";
  float u = 0; float v = 0;
  if (key != kk) { groot = newGraph(); }
  if (abs(D) < 0.000001) {
    u = cr(-q / 2);
    t = t + "**Δ = 0:** u = v = " + num(u, 3) + ", корни x = 2u = " + num(2 * u, 3) + " и −u = " + num(-u, 3) + " (двойной): кривая касается оси.";
    if (key != kk) { addNode(groot, "a", [2 * u, 0]); addNode(groot, "b", [-u, 0]); }
  } else if (D > 0) {
    float s = sqrt(D);
    u = cr(-q / 2 + s); v = cr(-q / 2 - s);
    t = t + "**Δ > 0:** u³ = " + num(-q / 2 + s, 3) + ", v³ = " + num(-q / 2 - s, 3) + ", u = " + num(u, 3) + ", v = " + num(v, 3) + " (uv = " + num(u * v, 3) + " = −p/3). Вещественный корень x₁ = u + v = " + num(u + v, 3) + ". Остальные — комплексные: ωu + ω²v = " + cpl(-(u + v) / 2, sqrt(3) / 2 * (u - v)) + " и сопряжённый.";
    if (key != kk) { addNode(groot, "a", [u + v, 0]); }
  } else {
    float r = sqrt(-p / 3);
    float ph = acos(max(-1, min(1, -q / (2 * r * r * r))));
    t = t + "**Δ < 0 (случай неприводимости):** u³ и v³ — комплексно сопряжённые числа " + cpl(-q / 2, sqrt(-D)) + " и " + cpl(-q / 2, -sqrt(-D)) + ", хотя все три корня вещественны: x = u + v = 2·Re u = 2r·cos((φ + 2πk)/3), r = √(−p/3) = " + num(r, 3) + ", φ = " + num(ph, 3) + ".\n\n";
    string xs = "";
    repeat (3) { float x = 2 * r * cos((ph + 2 * pi * i) / 3); xs = xs + "x = " + num(x, 3) + "; "; if (key != kk) { addNode(groot, "r" + format(i, 0), [x, 0]); } }
    t = t + "Корни: " + xs;
  }
  key = kk;
  info = t;
}
]
