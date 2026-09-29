[
description = "{info}"

field width = 20;
field height = 8;
camera type = fixed;

// Все k-элементные подмножества n-элементного множества: каждое — строка из n кружков (закрашен — элемент выбран).
float n = 6; float k = 3; float key = -1; float cnt = 0; string info = "";
draw Graph { name = "gF"; graph = "gf"; nodeColor = #f59e0b; nodeRadius = 4; labels = false; interactive = false; showWeights = false }
draw Graph { name = "gO"; graph = "go"; nodeColor = #3b82f677; nodeRadius = 2.5; labels = false; interactive = false; showWeights = false }
new UI { type = slider; label = "n (элементов)"; variable = n; min = 1; max = 8; step = 1; default = 6 }
new UI { type = slider; label = "k (в выборке)"; variable = k; min = 0; max = n; step = 1; default = 3 }

Function pc(m, nn) {
  float c = 0;
  repeat (nn) { c = c + floor(m / pow(2, i)) - 2 * floor(m / pow(2, i + 1)); }
  return c;
}
Function big(x) {
  if (x >= 1000000) { return format(x / 1000000, 2) + " млн"; }
  return format(x, 0);
}
Update {
  n = round(n); k = min(round(k), n);
  if (key != n * 10 + k) {
    gf = newGraph(); go = newGraph(); cnt = 0; float rows = ceil(nCr(n, k) / 10);
    repeat (pow(2, n)) {
      float m = i;
      if (pc(m, n) == k) {
        float col = cnt - 10 * floor(cnt / 10); float row = floor(cnt / 10);
        repeat (n) {
          float j = i; float b = floor(m / pow(2, j)) - 2 * floor(m / pow(2, j + 1));
          string id = "n" + format(m, 0) + "_" + format(j, 0);
          float x = -8.55 + 1.9 * col + 0.22 * (j - (n - 1) / 2); float y = (rows - 1) / 2 - 1.0 * row;
          if (b == 1) { addNode(gf, id, [x, y]); } else { addNode(go, id, [x, y]); }
        }
        cnt = cnt + 1;
      }
    }
    key = n * 10 + k;
  }
  float A = factorial(n) / factorial(n - k);
  info = "**Перечислительная комбинаторика** отвечает на вопрос «сколько именно». Для n = **" + format(n, 0) + "** элементов:\n\n";
  info = info + "перестановки: n! = **" + big(factorial(n)) + "**; размещения по k = " + format(k, 0) + " (порядок важен): n!/(n − k)! = **" + big(A) + "**; сочетания (подмножества, порядок не важен): n!/(k!(n − k)!) = **" + big(cnt) + "** — все они на поле, каждое даёт k! = " + big(factorial(k)) + " размещений.\n\n";
  info = info + "Симметрия: C(n, k) = C(n, n − k) = **" + big(nCr(n, n - k)) + "**. Число всех подмножеств 2ⁿ = **" + big(pow(2, n)) + "** — сумма C(n, k) по всем k.";
}
]
