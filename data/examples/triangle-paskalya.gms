[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float N = 6; float R = 3; float key = -1; string info = "";
draw Graph { name = "gp"; graph = "g"; nodeRadius = 13; labels = true; interactive = false; showWeights = false }
draw Graph { name = "gR"; graph = "gr"; nodeRadius = 13; nodeColor = #f59e0b; labels = true; interactive = false; showWeights = false }
new UI { type = slider; label = "число строк N"; variable = N; min = 1; max = 7; step = 1; default = 6 }
new UI { type = slider; label = "строка R"; variable = R; min = 0; max = N; step = 1; default = 3 }
Function C(n, k) { float r = 1; repeat (8) { if (i < k) { r = r * (n - i) / (i + 1); } } return r; }
Update {
  if (key != N * 10 + R) {
    g = newGraph(); gr = newGraph();
    repeat (36) {
      float t = i; float row = floor((sqrt(8 * t + 1) - 1) / 2); float col = t - row * (row + 1) / 2;
      if (row <= N) {
        float val = C(row, col); float x = (col - row / 2) * 1.8; float y = 4.2 - row * 1.3;
        if (row == R) { addNode(gr, "k" + format(t,0), [x, y], format(val,0)); }
        if (row != R) { addNode(g, "k" + format(t,0), [x, y], format(val,0)); }
      }
    }
    key = N * 10 + R;
  }
  info = "**Треугольник Паскаля**: в строке n стоят числа C(n,0), …, C(n,n); каждое — сумма двух чисел над ним (C(n,k) = C(n−1,k−1) + C(n−1,k)). Строка R = " + format(R,0) + " выделена оранжевым.";
}
]
