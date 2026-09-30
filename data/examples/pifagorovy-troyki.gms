[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Точка (a, b) — катеты пифагоровой тройки: все тройки с гипотенузой c ≤ N лежат на
// окружностях целого радиуса c. Синие — примитивные, жёлтые — кратные им. Зелёный
// треугольник — тройка, заданная формулами Евклида. ----
draw Graph { name = "gP"; graph = "gp"; nodeColor = #3b82f6; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gK"; graph = "gk"; nodeColor = #f59e0b; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gT"; graph = "gt"; nodeColor = #22c55e; nodeRadius = 7; edgeColor = #22c55e; edgeWidth = 2; labels = false; interactive = false; showWeights = false; layer = 12 }
draw Graph { name = "gA"; graph = "ga"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }

new UI { type = slider; label = "m"; variable = m; min = 2; max = 7; step = 1; default = 2 }
new UI { type = slider; label = "n"; variable = n; min = 1; max = m - 1; step = 1; default = 1 }
new UI { type = slider; label = "k"; variable = k; min = 1; max = 3; step = 1; default = 1 }
new UI { type = slider; label = "c ≤ N"; variable = N; min = 25; max = 100; step = 5; default = 65 }

float m = 2; float n = 1; float k = 1; float N = 65;
float key = -1; float cnt = 0; float prim = 0; string info = "";

Function gcd(x, y) {
  float u = abs(x); float v = abs(y);
  repeat (30) { if (v > 0) { float t = u - v * floor(u / v); u = v; v = t; } }
  return u;
}
Function md(x, q) { return x - q * floor(x / q); }

Update {
  float a = k * (m * m - n * n); float b = 2 * k * m * n; float c = k * (m * m + n * n);
  float R = max(N, c); float s = 9 / R;
  float kk = ((m * 10 + n) * 10 + k) * 200 + N;
  if (key != kk) {
    gp = newGraph(); gk = newGraph(); gt = newGraph(); ga = newGraph(); cnt = 0; prim = 0;
    addNode(ga, "o1", [-7.5, -4.5]); addNode(ga, "o2", [7.5, -4.5]); addEdge(ga, "o1", "o2");
    addNode(ga, "o3", [-7.5, 4.5]); addEdge(ga, "o1", "o3");
    repeat (2000) {
      float mm = floor(i / 200) + 1; float nn = floor(i / 20) - 10 * floor(i / 200) + 1; float kq = md(i, 20) + 1;
      if (nn < mm && gcd(mm, nn) == 1 && md(mm - nn, 2) == 1 && kq * (mm * mm + nn * nn) <= N) {
        float pa = kq * (mm * mm - nn * nn); float pb = 2 * kq * mm * nn;
        if (kq == 1) { prim = prim + 1; addNode(gp, "u" + format(i, 0), [-7.5 + s * pa, -4.5 + s * pb]); addNode(gp, "v" + format(i, 0), [-7.5 + s * pb, -4.5 + s * pa]); }
        if (kq > 1) { addNode(gk, "u" + format(i, 0), [-7.5 + s * pa, -4.5 + s * pb]); addNode(gk, "v" + format(i, 0), [-7.5 + s * pb, -4.5 + s * pa]); }
        cnt = cnt + 1;
      }
    }
    // выбранная тройка: треугольник и дуга радиуса c
    addNode(gt, "t0", [-7.5, -4.5]); addNode(gt, "t1", [-7.5 + s * a, -4.5]); addNode(gt, "t2", [-7.5 + s * a, -4.5 + s * b]);
    addEdge(gt, "t0", "t1"); addEdge(gt, "t1", "t2"); addEdge(gt, "t2", "t0");
    repeat (24) { addNode(ga, "r" + format(i, 0), [-7.5 + s * c * cos(i * 1.5708 / 23), -4.5 + s * c * sin(i * 1.5708 / 23)]); if (i > 0) { addEdge(ga, "r" + format(i - 1, 0), "r" + format(i, 0)); } }
    key = kk;
  }
  float g = gcd(gcd(a, b), c);
  string P = "(" + format(a, 0) + ", " + format(b, 0) + ", " + format(c, 0) + ")";
  info = "**Пифагорова тройка " + P + "**: " + format(a, 0) + "² + " + format(b, 0) + "² = " + format(a * a, 0) + " + " + format(b * b, 0) + " = " + format(c * c, 0) + " = " + format(c, 0) + "². Она получена из формул a = k(m² − n²), b = 2kmn, c = k(m² + n²) при m = " + format(m, 0) + ", n = " + format(n, 0) + ", k = " + format(k, 0) + ".\n\n";
  if (g == 1) { info = info + "Тройка **примитивная** (НОД = 1): ровно одно из чисел чётно, и это катет " + format(2 * k * m * n, 0) + "."; }
  if (g > 1) { info = info + "Тройка **непримитивная**: все числа кратны " + format(g, 0) + ", она получается из примитивной (" + format(a / g, 0) + ", " + format(b / g, 0) + ", " + format(c / g, 0) + ") умножением на " + format(g, 0) + "."; }
  info = info + " Произведение катетов " + format(a * b, 0) + " делится на 12 (" + format(a * b / 12, 0) + "·12), произведение всех трёх чисел — на 60.\n\n";
  info = info + "На поле: троек с гипотенузой c ≤ " + format(N, 0) + " всего **" + format(cnt, 0) + "**, из них примитивных " + format(prim, 0) + " (для каждой показаны обе точки (a, b) и (b, a)).";
}
]
