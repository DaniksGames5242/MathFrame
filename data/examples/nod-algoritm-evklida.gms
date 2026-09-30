[
description = "{info}"
field width = 12; field height = 7.5;
camera type = fixed;
string info = ""; float a = 21; float b = 13; float pa = 0; float pb = 0;

draw Graph { name = "g1"; graph = "ga"; nodeRadius = 0; edgeWidth = 3; edgeColor = #3b82f6; labels = false; interactive = false; showWeights = false; layer = 2 }
draw Graph { name = "g2"; graph = "gb"; nodeRadius = 0; edgeWidth = 3; edgeColor = #f59e0b; labels = false; interactive = false; showWeights = false; layer = 2 }
draw Graph { name = "g3"; graph = "gc"; nodeRadius = 0; edgeWidth = 4; edgeColor = #22c55e; labels = false; interactive = false; showWeights = false; layer = 3 }
new UI { name = "sa"; type = slider; label = "a"; variable = a; min = 1; max = 30; step = 1; default = 21 }
new UI { name = "sb"; type = slider; label = "b"; variable = b; min = 1; max = 30; step = 1; default = 13 }

Function sq(g, key, x, y, s) {
  addNode(g, key + "a", [x, y]); addNode(g, key + "b", [x + s, y]);
  addNode(g, key + "c", [x + s, y + s]); addNode(g, key + "d", [x, y + s]);
  addEdge(g, key + "a", key + "b", 1); addEdge(g, key + "b", key + "c", 1);
  addEdge(g, key + "c", key + "d", 1); addEdge(g, key + "d", key + "a", 1);
  return 0;
}

Update {
  if (a != pa || b != pb) {
    pa = a; pb = b;
    ga = newGraph(); gb = newGraph(); gc = newGraph();
    float big = max(a, b); float small = min(a, b);
    float sc = min(11.4 / big, 6.9 / small);
    float x0 = 0 - big * sc / 2; float y0 = 0 - small * sc / 2;
    float w = big; float h = small; float step = 0; float cnt = 0; float dummy = 0;
    repeat (12) {
      if (w > 0.5 && h > 0.5) {
        float side = min(w, h);
        float m = 0;
        if (w >= h) { m = floor(w / h); } else { m = floor(h / w); }
        float t = 0;
        repeat (30) {
          if (t < m) {
            float px = x0; float py = y0;
            if (w >= h) { px = x0 + t * side * sc; } else { py = y0 + t * side * sc; }
            cnt = cnt + 1;
            string key = "q" + format(cnt, 0);
            float rem = w - m * side; float rem2 = h - m * side;
            float last = 0;
            if (w >= h) { if (w - m * h < 0.5) { last = 1; } } else { if (h - m * w < 0.5) { last = 1; } }
            if (last > 0.5) { dummy = sq(gc, key, px, py, side * sc); }
            else { if (step - 2 * floor(step / 2) < 0.5) { dummy = sq(ga, key, px, py, side * sc); } else { dummy = sq(gb, key, px, py, side * sc); } }
          }
          t = t + 1;
        }
        if (w >= h) { x0 = x0 + m * side * sc; w = w - m * side; } else { y0 = y0 + m * side * sc; h = h - m * side; }
        step = step + 1;
      }
    }
  }
  float x = max(a, b); float y = min(a, b);
  string chain = "";
  float g = x;
  repeat (12) {
    if (y > 0.5) {
      float q = floor(x / y); float r = x - q * y;
      chain = chain + format(x, 0) + " = " + format(y, 0) + "·" + format(q, 0) + " + " + format(r, 0) + ";  ";
      g = y; x = y; y = r;
    }
  }
  info = "**Алгоритм Евклида**: НОД(a, b) не меняется при замене большего числа остатком от деления на меньшее; последний ненулевой остаток — НОД. Геометрически: прямоугольник a × b режем на наибольшие квадраты, потом то же с остатком; сторона последнего (зелёного) квадрата — НОД.\n\n";
  info = info + chain + "\n\n";
  info = info + "**НОД(" + format(a, 0) + ", " + format(b, 0) + ") = " + format(g, 0) + "**, НОК = a·b / НОД = " + format(a * b / g, 0) + ".";
  if (g < 1.5) { info = info + " Числа взаимно просты."; }
}
]
