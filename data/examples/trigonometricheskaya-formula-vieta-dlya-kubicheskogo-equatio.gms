[
description = "{info}"

field width = 10;
field height = 8;
camera type = fixed;

// ---- Уравнение t³ + pt + q = 0 с тремя вещественными корнями: q = −2r³·cos φ, r = √(−p/3).
// Корни tₖ = 2r·cos((φ + 2πk)/3) — проекции на ось трёх точек окружности радиуса 2r с углами
// (φ + 2πk)/3 (оранжевые). ----
float p = -3; float dg = 60; float key = -1; float rr = 1; string info = "";
Function q() { return -2 * pow(-p / 3, 1.5) * cos(dg * pi / 180); }
Function f(t) { return t * t * t + p * t + q(); }
draw Function { name = "gr"; f = "f"; xmin = -5; xmax = 5; grid = true; color = #3b82f6; thickness = 3 }
new Curve { name = "circ"; type = parametric; x = "2 * rr * cos(6.2831853 * t)"; y = "2 * rr * sin(6.2831853 * t)"; thickness = 1.5 }
draw Graph { name = "gLn"; graph = "gln"; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gAng"; graph = "gang"; nodeColor = #f59e0b; nodeRadius = 5; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gRoot"; graph = "groot"; nodeColor = #22c55e; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 9 }
new UI { type = slider; label = "p"; variable = p; min = -6; max = -0.5; step = 0.1; default = -3 }
new UI { type = slider; label = "угол φ (°)"; variable = dg; min = 5; max = 175; step = 1; default = 60 }

Function num(x, d) { if (abs(x) < 0.5 * pow(10, -d)) { return format(0, d); } if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function term(c, m) { if (abs(c) < 0.005) { return ""; } if (c < 0) { return " − " + format(-c, 2) + m; } return " + " + format(c, 2) + m; }

Update {
  float r = sqrt(-p / 3);
  rr = r;
  float qq = q();
  float ph = dg * pi / 180;
  float kk = p * 1000 + dg;
  if (key != kk) {
    gln = newGraph(); gang = newGraph(); groot = newGraph();
    repeat (3) {
      float a = (ph + 2 * pi * i) / 3;
      addNode(gang, "c" + format(i, 0), [2 * r * cos(a), 2 * r * sin(a)]);
      addNode(groot, "r" + format(i, 0), [2 * r * cos(a), 0]);
      addNode(gln, "a" + format(i, 0), [2 * r * cos(a), 2 * r * sin(a)]);
      addNode(gln, "b" + format(i, 0), [2 * r * cos(a), 0]);
      addEdge(gln, "a" + format(i, 0), "b" + format(i, 0));
    }
    key = kk;
  }
  float t1 = 2 * r * cos(ph / 3); float t2 = 2 * r * cos((ph + 2 * pi) / 3); float t3 = 2 * r * cos((ph + 4 * pi) / 3);
  float D = qq * qq / 4 + p * p * p / 27;
  info = "**Тригонометрическая формула Виета:** t³" + term(p, "t") + term(qq, "") + " = 0, Δ = (q/2)² + (p/3)³ = " + num(D, 3) + " < 0 — три различных вещественных корня. Вспомогательная величина r = √(−p/3) = " + num(r, 3) + ", угол φ = arccos(3q/(2p)·√(−3/p)) = " + num(ph, 3) + " (" + format(dg, 0) + "°).\n\n";
  info = info + "**Корни** tₖ = 2√(|p|/3)·cos((φ + 2πk)/3), k = 0, 1, 2: t₁ = " + num(t1, 3) + ", t₂ = " + num(t2, 3) + ", t₃ = " + num(t3, 3) + ".\n\n";
  info = info + "**Проверка по Виету:** t₁ + t₂ + t₃ = " + num(t1 + t2 + t3, 3) + " (нет члена t²); t₁t₂ + t₁t₃ + t₂t₃ = " + num(t1 * t2 + t1 * t3 + t2 * t3, 3) + " = p; t₁t₂t₃ = " + num(t1 * t2 * t3, 3) + " = −q. Основа — тождество cos 3α = 4cos³α − 3cos α.";
}
]
