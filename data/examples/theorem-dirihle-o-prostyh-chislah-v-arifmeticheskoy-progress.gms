[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Числа 1, 2, 3, … записаны строками по d. Столбец — арифметическая прогрессия a + nd. Простые числа — кружки с номерами. ----
draw Graph { name = "gC"; graph = "gc"; nodeColor = #888888; nodeRadius = 2; labels = false; interactive = false; showWeights = false; layer = 2 }
draw Graph { name = "gP"; graph = "gp"; nodeColor = #3b82f6; nodeRadius = 13; labels = true; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gA"; graph = "ga"; edgeColor = #f59e0b; edgeWidth = 3; nodeColor = #f59e0b; nodeRadius = 13; labels = true; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gB"; graph = "gb"; nodeColor = #f59e0b; nodeRadius = 2; labels = false; interactive = false; showWeights = false; layer = 9 }

new UI { name = "sD"; type = slider; label = "разность d"; variable = d; min = 2; max = 12; step = 1; default = 6 }
new UI { name = "sA"; type = slider; label = "первый член a"; variable = a; min = 1; max = d; step = 1; default = 5 }

// ---- Логика ----
float d = 6; float a = 5; float key = -1; float rows = 9; float np = 0; float tot = 0; float g = 1; float ph = 2;
string info = "";
Function md(x, m) { return x - m * floor(x / m); }
Function isp(x) {
  if (x < 2) { return 0; }
  float r = 1;
  repeat (10) { float q = i + 2; if (q * q <= x && md(x, q) == 0) { r = 0; } }
  return r;
}
Function gcd(x, y) { repeat (14) { if (y > 0) { float t = md(x, y); x = y; y = t; } } return x; }

Update {
  float kk = d * 100 + a;
  if (key != kk) {
    key = kk; np = 0; tot = 0; ph = 0;
    g = gcd(a, d);
    repeat (d) { if (gcd(i + 1, d) == 1) { ph = ph + 1; } }
    gc = newGraph(); gp = newGraph(); ga = newGraph(); gb = newGraph();
    float sx = min(1.15, 14 / d);
    repeat (rows) {
      float r = i;
      repeat (d) {
        float c = i;
        float n = r * d + c + 1;
        float x = (c - (d - 1) / 2) * sx; float y = 4.2 - r * 0.95;
        string s = format(n, 0);
        float inC = 0; if (md(n - a, d) == 0) { inC = 1; }
        if (isp(n) > 0.5 && inC < 0.5) { addNode(gp, s, [x, y], s); }
        if (isp(n) > 0.5 && inC > 0.5) { addNode(ga, s, [x, y], s); np = np + 1; }
        if (isp(n) < 0.5 && inC < 0.5) { addNode(gc, s, [x, y]); }
        if (isp(n) < 0.5 && inC > 0.5) { addNode(gb, s, [x, y]); }
        if (inC > 0.5) { tot = tot + 1; }
      }
    }
  }
  info = "**Теорема Дирихле:** если a и d взаимно просты, то прогрессия a + nd содержит бесконечно много простых чисел.\n\n";
  info = info + "**Прогрессия " + format(a, 0) + " + n·" + format(d, 0) + "** (оранжевый столбец): НОД(a, d) = " + format(g, 0) + ". В таблице до " + format(rows * d, 0) + " в ней простых чисел: " + format(np, 0) + " из " + format(tot, 0) + " членов.\n\n";
  if (g == 1) { info = info + "Числа a и d взаимно просты, поэтому простых в столбце бесконечно много; их доля среди всех простых стремится к 1/φ(d) = 1/" + format(ph, 0) + ": все " + format(ph, 0) + " «взаимно простых» столбцов содержат простые поровну в пределе."; }
  if (g > 1) { info = info + "Здесь a и d имеют общий делитель " + format(g, 0) + ", поэтому все члены прогрессии делятся на " + format(g, 0) + ": простым может быть самое большее один член. Условие теоремы существенно."; }
}
]
