[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Дерево выбора: первый элемент выбирают n способами, второй — (n − 1), … Каждый лист — одна
// перестановка, листьев ровно n!. Оранжевый путь — перестановка с выбранным номером. ----
draw Graph { name = "gT"; graph = "gt"; edgeColor = #3b82f6; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gH"; graph = "gh"; edgeColor = #f59e0b; nodeColor = #f59e0b; edgeWidth = 3; nodeRadius = 5; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Text { name = "pl"; pos = (0, -4.6); text = ps; size = 1.3 }

new UI { name = "sN"; type = slider; label = "n"; variable = n; min = 0; max = 6; step = 1; default = 4 }
new UI { name = "sP"; type = slider; label = "перестановка №"; variable = p; min = 1; max = fct(n); step = 1; default = 9 }

// ---- Логика ----
float n = 4; float p = 9; float nkey = -1; float pkey = -1;
list u = (0, 0, 0, 0, 0, 0, 0);
string ps = ""; string info = ""; string tab = "";

Function fct(k) { float r = 1; repeat (k) { r = r * (i + 1); } return r; }
Function ty(l) { if (n == 0) { return 4.2; } return 4.2 - l * 8.4 / n; }
Function tx(l, j) { return -7.6 + 15.2 * (j + 0.5) * fct(n - l) / fct(n); }

Update {
  float nf = fct(n);
  if (p > nf) { p = nf; }
  float pp = p - 1;
  if (n != nkey) {
    nkey = n; pkey = -1;
    gt = newGraph();
    addNode(gt, "n0_0", [tx(0, 0), ty(0)]);
    repeat (n) {
      float l = i + 1;
      float cnt = nf / fct(n - l);
      repeat (cnt) { addNode(gt, "n" + format(l, 0) + "_" + format(i, 0), [tx(l, i), ty(l)]); addEdge(gt, "n" + format(l - 1, 0) + "_" + format(floor(i / (n - l + 1)), 0), "n" + format(l, 0) + "_" + format(i, 0)); }
    }
  }
  if (p != pkey) {
    pkey = p;
    // перестановка № p (по порядку): на каждом шаге берём d-й из ещё не взятых элементов
    repeat (7) { u[i] = 0; }
    ps = "";
    repeat (n) {
      float l = i + 1;
      float d = floor(pp / fct(n - l)) - floor(pp / fct(n - l + 1)) * (n - l + 1);
      float cf = -1; float e = 0;
      repeat (n) { if (u[i] == 0) { cf = cf + 1; if (cf == d) { e = i; } } }
      u[e] = 1;
      if (l > 1) { ps = ps + " "; }
      ps = ps + format(e + 1, 0);
    }
    if (n == 0) { ps = "∅"; }
    gh = newGraph();
    repeat (n + 1) { float l = i; addNode(gh, "h" + format(l, 0), [tx(l, floor(pp / fct(n - l))), ty(l)]); if (l > 0) { addEdge(gh, "h" + format(l - 1, 0), "h" + format(l, 0)); } }
  }
  tab = "";
  repeat (n + 1) { tab = tab + format(i, 0) + "! = " + format(fct(i), 0); if (i < n) { tab = tab + ", "; } }
  info = "**Факториал** n! — произведение всех натуральных чисел от 1 до n; 0! = 1 (пустое произведение). Первый элемент перестановки выбирают n способами, второй — n − 1, … , последний — одним, поэтому листьев в дереве ровно n! — число перестановок n-элементного множества.";
  info = info + "\n\n**n = " + format(n, 0) + ":** " + tab + ". Перестановка № " + format(p, 0) + " из " + format(nf, 0) + " — это " + ps + ".";
  info = info + "\n\nРекурсия: n! = n · (n − 1)!";
  if (n >= 1) { info = info + " — здесь " + format(nf, 0) + " = " + format(n, 0) + " · " + format(fct(n - 1), 0) + ": дерево состоит из n одинаковых поддеревьев, по (n − 1)! листьев в каждом."; }
}
]
