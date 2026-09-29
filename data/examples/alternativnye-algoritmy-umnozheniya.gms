[
description = "{info}"

field width = 16;
field height = 8;
camera type = fixed;

// ---- Одно произведение a · b тремя путями. Каждая полоса — сумма слагаемых a · (часть множителя),
// длина отрезка пропорциональна его значению; у всех трёх полос длина одна и та же. ----
draw Graph { name = "gS"; graph = "gs"; edgeWidth = 26; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Text { name = "l1"; pos = (-7.6, 3.55); text = "по разрядам множителя"; size = 1; align = left }
draw Text { name = "l2"; pos = (-7.6, 1.15); text = "по степеням двойки"; size = 1; align = left }
draw Text { name = "l3"; pos = (-7.6, -1.25); text = "повторным сложением"; size = 1; align = left }
draw Text { name = "tot"; pos = (7.6, -3.6); text = "= " + format(a * b, 0); size = 1.3; align = right }

new UI { name = "sA"; type = slider; label = "a"; variable = a; min = 1; max = 99; step = 1; default = 45 }
new UI { name = "sB"; type = slider; label = "b"; variable = b; min = 1; max = 99; step = 1; default = 37 }

// ---- Логика ----
float a = 45; float b = 37;
float key = -1; float cnt = 0; float xc = 0; float sc = 1;
string s1 = ""; string s2 = ""; string info = "";

// добавить отрезок a·q цвета по чётности номера в конец полосы на высоте y
Function seg(y, q, par) {
  cnt = cnt + 1;
  string col = "#3b82f6"; if (par - 2 * floor(par / 2) > 0) { col = "#f59e0b"; }
  float x1 = xc + a * q * sc;
  addNode(gs, "p" + format(cnt, 0), [xc, y]); addNode(gs, "q" + format(cnt, 0), [x1, y]);
  addEdge(gs, "p" + format(cnt, 0), "q" + format(cnt, 0), 1, col);
  xc = x1;
}
Function term(q) { return format(a, 0) + "·" + format(q, 0); }

Update {
  if (a * 1000 + b != key) {
    key = a * 1000 + b;
    gs = newGraph(); cnt = 0; sc = 15.2 / (a * b);
    float tens = floor(b / 10) * 10; float ones = b - tens;
    // по разрядам
    xc = -7.6; float k = 0; s1 = ""; float v1 = 0;
    if (tens > 0) { seg(3, tens, k); k = k + 1; s1 = term(tens); v1 = a * tens; }
    if (ones > 0) { if (k > 0) { s1 = s1 + " + "; } seg(3, ones, k); s1 = s1 + term(ones); v1 = v1 + a * ones; }
    // по степеням двойки (от старшей)
    xc = -7.6; k = 0; s2 = "";
    repeat (7) {
      float w = pow(2, 6 - i);
      if (floor(b / w) - 2 * floor(b / (2 * w)) == 1) { if (k > 0) { s2 = s2 + " + "; } seg(0.6, w, k); s2 = s2 + term(w); k = k + 1; }
    }
    // повторное сложение
    xc = -7.6;
    repeat (b) { seg(-1.8, 1, i - 2 * floor(i / 2)); }
  }
  info = "**Любой способ опирается на дистрибутивность:** множитель раскладывают на слагаемые, а произведение — на сумму произведений множимого на эти слагаемые. Для a · b = " + format(a, 0) + " · " + format(b, 0) + ":";
  info = info + "\n\n• по разрядам: " + s1 + " = " + format(a * b, 0) + ";\n• по степеням двойки: " + s2 + " = " + format(a * b, 0) + ";\n• повторным сложением: число a = " + format(a, 0) + " берётся " + format(b, 0) + " раз.";
  info = info + "\n\nПути разные, число слагаемых и сложность действий разные — результат один и тот же: длины всех трёх полос совпадают.";
}
]
