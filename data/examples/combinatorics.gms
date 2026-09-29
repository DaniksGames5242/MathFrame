[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Все выборки k элементов из n (буквы a, b, c, …) выписаны полностью (первые 60): порядок
// и повторения меняют, какие слова считаются различными, и, значит, их число. ----
draw Graph { name = "gW"; graph = "gw"; nodeRadius = 24; nodeColor = #3b82f622; labels = true; interactive = false; showWeights = false; layer = 5 }
draw Text { name = "more"; pos = (0, -4.5); text = tail; size = 0.9 }

new UI { name = "sO"; type = select; label = "порядок"; variable = ord; options = ("ord", "unord"); labels = ("важен (размещения)", "не важен (сочетания)"); default = "ord" }
new UI { name = "sR"; type = select; label = "повторения"; variable = rep; options = ("no", "yes"); labels = ("без повторений", "с повторениями"); default = "no" }
new UI { name = "sN"; type = slider; label = "n элементов"; variable = n; min = 2; max = 5; step = 1; default = 4 }
new UI { name = "sK"; type = slider; label = "k в выборке"; variable = k; min = 1; max = n; step = 1; default = 2 }

// ---- Логика ----
string ord = "ord"; string rep = "no"; float n = 4; float k = 2;
float key = -1; float total = 0; string tail = "";
list dg = [0, 0, 0, 0, 0];
string info = "";

Function letter(d) { if (d == 0) { return "a"; } if (d == 1) { return "b"; } if (d == 2) { return "c"; } if (d == 3) { return "d"; } return "e"; }
// слово с номером idx в порядке a…e; digits в dg; результат 1 — слово подходит под выбранный тип выборки
Function fits(idx) {
  float ok = 1;
  repeat (k) { float j = i; dg[j] = floor(idx / pow(n, k - 1 - j)) - n * floor(idx / pow(n, k - j)); }
  if (ord == "unord") {
    repeat (k - 1) { float j = i; if (rep == "no" && dg[j + 1] <= dg[j]) { ok = 0; } if (rep == "yes" && dg[j + 1] < dg[j]) { ok = 0; } }
  }
  if (ord == "ord" && rep == "no") {
    repeat (k) { float j = i; repeat (k) { if (i > j && dg[i] == dg[j]) { ok = 0; } } }
  }
  return ok;
}
Function fl() { float o = 0; if (ord == "ord") { o = 1; } if (rep == "yes") { o = o + 2; } return o; }
Function word() { string w = ""; repeat (k) { w = w + letter(dg[i]); } return w; }
Function prod(a, m) { float p = 1; repeat (m) { p = p * (a - i); } return p; }
Function fact(m) { float p = 1; repeat (m) { p = p * (i + 1); } return p; }
Function rp(a, m) { string s = format(a, 0); repeat (m - 1) { s = s + " · " + format(a, 0); } return s; }
Function fs(a, m) { string s = format(a, 0); repeat (m - 1) { s = s + " · " + format(a - i - 1, 0); } return s; }

Update {
  if (key != n * 1000 + k * 10 + fl()) {
    gw = newGraph(); total = 0;
    repeat (pow(n, k)) {
      if (fits(i) == 1) {
        if (total < 60) { addNode(gw, "w" + format(total, 0), [-6.9 + 1.5 * (total - 10 * floor(total / 10)), 3.8 - 1.4 * floor(total / 10)], word()); }
        total = total + 1;
      }
    }
    tail = ""; if (total > 60) { tail = "… и ещё " + format(total - 60, 0); }
    key = n * 1000 + k * 10 + fl();
  }
  info = "**Комбинаторика** считает, сколько способов выбрать k элементов из n при заданных условиях. Здесь выписаны все выборки для n = " + format(n, 0) + ", k = " + format(k, 0) + ": **" + format(total, 0) + "**.\n\n";
  if (ord == "ord" && rep == "no") { info = info + "**Размещения без повторений** (порядок важен): по правилу произведения " + fs(n, k) + " = **" + format(prod(n, k), 0) + "** (n!/(n − k)!). Первую позицию можно занять n способами, вторую — n − 1, и так далее."; }
  if (ord == "ord" && rep == "yes") { info = info + "**Размещения с повторениями:** каждая из k позиций выбирается независимо, по правилу произведения " + rp(n, k) + " = **" + format(pow(n, k), 0) + "**."; }
  if (ord == "unord" && rep == "no") { info = info + "**Сочетания без повторений** (порядок не важен): каждой выборке отвечают k! = " + format(fact(k), 0) + " слов с разным порядком, поэтому " + format(prod(n, k), 0) + " / " + format(fact(k), 0) + " = **" + format(prod(n, k) / fact(k), 0) + "** (Cₙᵏ = n!/(k!(n − k)!))."; }
  if (ord == "unord" && rep == "yes") { info = info + "**Сочетания с повторениями:** Cₙ₊ₖ₋₁ᵏ = C(" + format(n + k - 1, 0) + ", " + format(k, 0) + ") = " + format(prod(n + k - 1, k) / fact(k), 0) + " = **" + format(total, 0) + "**."; }
}
]
