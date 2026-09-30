[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// Чёрная кривая — плотность t(ν), жёлтая — стандартная нормальная. Ось x: 1 единица = 5/3 поля (x от −6 до 6).
// Синие столбики — хвосты |x| > c под плотностью Стьюдента; точка A задаёт c.
float nu = 3; float sx = 1.6667; float y0 = -4.5; float ky = 18;
float key = -99; float cv = 2; float pt = 0; float pn = 0;
string info = "";

func tdens(X) = y0 + ky * gamma((nu + 1) / 2) / (sqrt(nu * pi) * gamma(nu / 2)) * pow(1 + X / sx * X / sx / nu, -(nu + 1) / 2);
func nrm(X) = y0 + ky * exp(-(X / sx) * (X / sx) / 2) / sqrt(2 * pi);
draw Function { name = "gd"; f = "tdens"; xmin = -10; xmax = 10; thickness = 3; layer = 30 }
draw Function { name = "gn"; f = "nrm"; xmin = -10; xmax = 10; thickness = 2; color = #f59e0b; layer = 25 }
draw Graph { name = "gB"; graph = "gb"; nodeRadius = 0; edgeWidth = 4.2; edgeCap = butt; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gA"; graph = "ga"; nodeRadius = 0; edgeWidth = 1; edgeColor = #3b82f677; labels = false; interactive = false; showWeights = false; layer = 5 }
new Point { name = "A"; pos = (3.3, -4.5); pauseOnDrag = false; collideWithPoints = false; color = #3b82f6 }
draw Text { name = "tC"; pos = (A.pos.x, y0 - 0.6); text = "c"; size = 0.95; color = #3b82f6 }
draw Text { name = "tM"; pos = (-A.pos.x, y0 - 0.6); text = "−c"; size = 0.95; color = #3b82f6 }
draw Text { name = "x0"; pos = (0, y0 - 1.1); text = "0"; size = 0.7 }
draw Text { name = "x2"; pos = (2 * sx, y0 - 1.1); text = "2"; size = 0.7 }
draw Text { name = "x4"; pos = (4 * sx, y0 - 1.1); text = "4"; size = 0.7 }
draw Text { name = "x6"; pos = (-2 * sx, y0 - 1.1); text = "−2"; size = 0.7 }
draw Text { name = "x8"; pos = (-4 * sx, y0 - 1.1); text = "−4"; size = 0.7 }

new UI { type = slider; label = "ν (степени свободы)"; variable = nu; min = 1; max = 30; step = 1; default = 3 }

Function ft(x) { return gamma((nu + 1) / 2) / (sqrt(nu * pi) * gamma(nu / 2)) * pow(1 + x * x / nu, -(nu + 1) / 2); }
// P(|T| > c) = 1 − 2·∫ от 0 до c плотности (Симпсон)
Function tail(c) {
  float h = c / 100; float s = ft(0) + ft(c);
  repeat (99) { float k = i + 1; float w = 4; if (k - 2 * floor(k / 2) == 0) { w = 2; } s = s + w * ft(h * k); }
  return 1 - 2 * s * h / 3;
}
Function num(x, d) { if (x < -0.00001) { return "−" + format(-x, d); } return format(abs(x), d); }
Update {
  if (abs(A.pos.y - y0) > 0.0001) { A.pos.y = y0; }
  if (A.pos.x < 0.4) { A.pos.x = 0.4; }
  if (A.pos.x > 9.2) { A.pos.x = 9.2; }
  cv = A.pos.x / sx;
  if (key != A.pos.x * 100 + nu) {
    gb = newGraph(); ga = newGraph();
    addNode(ga, "l", [-10, y0]); addNode(ga, "r", [10, y0]); addEdge(ga, "l", "r");
    addNode(ga, "v1", [0, y0]); addNode(ga, "v2", [0, y0 + 9.5]); addEdge(ga, "v1", "v2");
    repeat (13) { float tx = -10 + sx * i; addNode(ga, "t" + format(i, 0), [tx, y0 - 0.15]); addNode(ga, "u" + format(i, 0), [tx, y0 + 0.15]); addEdge(ga, "t" + format(i, 0), "u" + format(i, 0)); }
    repeat (100) {
      float x = 0.05 + 0.1 * i; string id = format(i, 0);
      if (x > A.pos.x && x < 10) {
        float hh = ky * ft(x / sx);
        addNode(gb, "a" + id, [x, y0]); addNode(gb, "b" + id, [x, y0 + hh]); addEdge(gb, "a" + id, "b" + id, 1, "#3b82f6");
        addNode(gb, "c" + id, [-x, y0]); addNode(gb, "d" + id, [-x, y0 + hh]); addEdge(gb, "c" + id, "d" + id, 1, "#3b82f6");
      }
    }
    pt = tail(cv); pn = 1 - erf(cv / sqrt(2));
    key = A.pos.x * 100 + nu;
  }
  info = "**Распределение Стьюдента** с ν = **" + format(nu, 0) + "** степенями свободы — закон отношения стандартной нормальной величины к √(χ²/ν) с независимой χ²(ν). Плотность ∝ (1 + x²/ν)^(−(ν+1)/2), чётная — симметрична относительно 0.\n\n";
  string mv = "существует и равно 0"; if (nu == 1) { mv = "не существует (распределение Коши)"; }
  string dv = "ν/(ν − 2) = " + format(nu / (nu - 2), 3); if (nu <= 2) { dv = "бесконечна"; if (nu == 1) { dv = "не существует"; } }
  info = info + "**Моменты:** среднее " + mv + "; дисперсия " + dv + " (конечна только при ν > 2, при больших ν стремится к 1).\n\n";
  info = info + "**Тяжёлые хвосты.** Для c = **" + format(cv, 2) + "**: P(|T| > c) = **" + format(pt, 4) + "** (синие столбики), а у нормальной (жёлтая) P(|Z| > c) = **" + format(pn, 4) + "**, то есть в " + format(pt / pn, 1) + " раз меньше. При росте ν хвосты Стьюдента приближаются к нормальным.";
}
]
