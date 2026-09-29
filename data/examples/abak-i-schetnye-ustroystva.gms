[
description = "{info}"

field width = 24;
field height = 10;
camera type = fixed;

// ---- Три абака: слагаемые N и k и сумма. Каждый стержень — разряд, число костяшек на нём — цифра.
// Оранжевая костяшка — перенос: полный набор костяшек младшего разряда заменён одной старшего. ----
draw Graph { name = "gR"; graph = "gr"; edgeColor = #3b82f688; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gB"; graph = "gb"; nodeColor = #3b82f6; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gC"; graph = "gc"; nodeColor = #f59e0b; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Text { name = "h0"; pos = (-8, 3.4); text = "N = " + format(N, 0); size = 1.1 }
draw Text { name = "h1"; pos = (0, 3.4); text = "k = " + format(K, 0); size = 1.1 }
draw Text { name = "h2"; pos = (8, 3.4); text = "N + k = " + format(N + K, 0); size = 1.1 }
draw Text { name = "p0"; pos = (-4, 0); text = "+"; size = 2 }
draw Text { name = "p1"; pos = (4, 0); text = "="; size = 2 }

new UI { name = "sB"; type = select; label = "система"; variable = bsel; options = ("2", "5", "8", "10", "12", "16"); labels = ("двоичная", "пятеричная", "восьмеричная", "десятичная", "двенадцатеричная", "шестнадцатеричная"); default = "10" }
new UI { name = "sN"; type = slider; label = "N"; variable = N; min = 0; max = min(pow(bs, 4) - 1, 9999); step = 1; default = 478 }
new UI { name = "sK"; type = slider; label = "k"; variable = K; min = 0; max = min(pow(bs, 4) - 1, 9999); step = 1; default = 356 }

// ---- Логика ----
string bsel = "10"; float bs = 10; float N = 478; float K = 356; float key = -1; string info = "";

Function dg(x, k) { float q = floor(x / pow(bs, k)); return q - bs * floor(q / bs); }
Function px(a, r) { return -8 + 8 * a + (r - 2) * 1.3; }
Function cin(r) { float c = 0; repeat (5) { if (i < r) { c = floor((dg(N, i) + dg(K, i) + c) / bs); } } return c; }

Update {
  bs = 10;
  if (bsel == "2") { bs = 2; } if (bsel == "5") { bs = 5; } if (bsel == "8") { bs = 8; } if (bsel == "12") { bs = 12; } if (bsel == "16") { bs = 16; }
  if (key != bs + 20 * (N + 20000 * K)) {
    gr = newGraph(); gb = newGraph(); gc = newGraph();
    repeat (3) { float a = i; repeat (5) { float r = i;
      addNode(gr, "r" + format(a, 0) + format(r, 0) + "a", [px(a, r), -4.2]); addNode(gr, "r" + format(a, 0) + format(r, 0) + "b", [px(a, r), 2.3]); addEdge(gr, "r" + format(a, 0) + format(r, 0) + "a", "r" + format(a, 0) + format(r, 0) + "b");
      float k = 4 - r; float d = dg(N, k); if (a == 1) { d = dg(K, k); }
      if (a == 2) { d = dg(N + K, k); }
      float extra = 0; if (a == 2) { if (cin(k) > 0 && d > 0) { extra = 1; } }
      repeat (d - extra) { addNode(gb, "b" + format(a, 0) + format(r, 0) + "_" + format(i, 0), [px(a, r), -3.7 + 0.4 * i]); }
      if (extra == 1) { addNode(gc, "c" + format(a, 0) + format(r, 0), [px(a, r), -3.7 + 0.4 * (d - 1)]); }
    } }
    // где произошёл перенос
    string s = ""; float cnt = 0;
    repeat (4) { float k = i; float t = dg(N, k) + dg(K, k) + cin(k);
      if (t >= bs) { cnt = cnt + 1; s = s + "в разряде " + format(k, 0) + ": " + format(dg(N, k), 0) + " + " + format(dg(K, k), 0); if (cin(k) > 0) { s = s + " + 1"; } s = s + " = " + format(t, 0) + " ≥ " + format(bs, 0) + ", записывается " + format(t - bs, 0) + ", а одна костяшка уходит в разряд " + format(k + 1, 0) + "; "; } }
    info = "**Разряды по основанию " + format(bs, 0) + ":** на стержне не бывает больше " + format(bs - 1, 0) + " костяшек, номер стержня справа налево — 0, 1, 2, … (вес " + format(bs, 0) + " в степени номера). Число N = " + format(N, 0) + ", k = " + format(K, 0) + ".";
    if (cnt > 0) { info = info + "\n\n**Переносы (оранжевые костяшки):** " + s; } else { info = info + "\n\nПереносов нет: на каждом стержне суммы меньше " + format(bs, 0) + "."; }
    key = bs + 20 * (N + 20000 * K);
  }
}
]
