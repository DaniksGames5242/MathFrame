[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Цифры a — над столбцами, цифры b — справа от строк. В каждой клетке диагональ делит её:
// вверху слева — десятки произведения цифр, внизу справа — единицы. Числа в диагональных
// полосах складывают (оранжевые суммы у края сетки). ----
draw Graph { name = "gG"; graph = "gg"; edgeColor = #3b82f6; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gD"; graph = "gd"; edgeColor = #3b82f6; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Text { name = "res"; pos = (0, -4.2); text = format(a, 0) + " · " + format(b, 0) + " = " + format(a * b, 0); size = 1.5 }
draw Text { name = "da0"; pos = (cx(0), gy + 0.6); text = digA(0); size = 1.5; active = 0 < na }
draw Text { name = "db0"; pos = (gx + sz * na + 0.6, cy(0)); text = digB(0); size = 1.5; active = 0 < nb }
draw Text { name = "da1"; pos = (cx(1), gy + 0.6); text = digA(1); size = 1.5; active = 1 < na }
draw Text { name = "db1"; pos = (gx + sz * na + 0.6, cy(1)); text = digB(1); size = 1.5; active = 1 < nb }
draw Text { name = "da2"; pos = (cx(2), gy + 0.6); text = digA(2); size = 1.5; active = 2 < na }
draw Text { name = "db2"; pos = (gx + sz * na + 0.6, cy(2)); text = digB(2); size = 1.5; active = 2 < nb }
draw Text { name = "tn00"; pos = (cx(0) - 0.28 * sz, cy(0) + 0.24 * sz); text = tens(0, 0); size = 1.1; active = 0 < na && 0 < nb }
draw Text { name = "un00"; pos = (cx(0) + 0.28 * sz, cy(0) - 0.24 * sz); text = units(0, 0); size = 1.1; active = 0 < na && 0 < nb }
draw Text { name = "tn01"; pos = (cx(1) - 0.28 * sz, cy(0) + 0.24 * sz); text = tens(0, 1); size = 1.1; active = 1 < na && 0 < nb }
draw Text { name = "un01"; pos = (cx(1) + 0.28 * sz, cy(0) - 0.24 * sz); text = units(0, 1); size = 1.1; active = 1 < na && 0 < nb }
draw Text { name = "tn02"; pos = (cx(2) - 0.28 * sz, cy(0) + 0.24 * sz); text = tens(0, 2); size = 1.1; active = 2 < na && 0 < nb }
draw Text { name = "un02"; pos = (cx(2) + 0.28 * sz, cy(0) - 0.24 * sz); text = units(0, 2); size = 1.1; active = 2 < na && 0 < nb }
draw Text { name = "tn10"; pos = (cx(0) - 0.28 * sz, cy(1) + 0.24 * sz); text = tens(1, 0); size = 1.1; active = 0 < na && 1 < nb }
draw Text { name = "un10"; pos = (cx(0) + 0.28 * sz, cy(1) - 0.24 * sz); text = units(1, 0); size = 1.1; active = 0 < na && 1 < nb }
draw Text { name = "tn11"; pos = (cx(1) - 0.28 * sz, cy(1) + 0.24 * sz); text = tens(1, 1); size = 1.1; active = 1 < na && 1 < nb }
draw Text { name = "un11"; pos = (cx(1) + 0.28 * sz, cy(1) - 0.24 * sz); text = units(1, 1); size = 1.1; active = 1 < na && 1 < nb }
draw Text { name = "tn12"; pos = (cx(2) - 0.28 * sz, cy(1) + 0.24 * sz); text = tens(1, 2); size = 1.1; active = 2 < na && 1 < nb }
draw Text { name = "un12"; pos = (cx(2) + 0.28 * sz, cy(1) - 0.24 * sz); text = units(1, 2); size = 1.1; active = 2 < na && 1 < nb }
draw Text { name = "tn20"; pos = (cx(0) - 0.28 * sz, cy(2) + 0.24 * sz); text = tens(2, 0); size = 1.1; active = 0 < na && 2 < nb }
draw Text { name = "un20"; pos = (cx(0) + 0.28 * sz, cy(2) - 0.24 * sz); text = units(2, 0); size = 1.1; active = 0 < na && 2 < nb }
draw Text { name = "tn21"; pos = (cx(1) - 0.28 * sz, cy(2) + 0.24 * sz); text = tens(2, 1); size = 1.1; active = 1 < na && 2 < nb }
draw Text { name = "un21"; pos = (cx(1) + 0.28 * sz, cy(2) - 0.24 * sz); text = units(2, 1); size = 1.1; active = 1 < na && 2 < nb }
draw Text { name = "tn22"; pos = (cx(2) - 0.28 * sz, cy(2) + 0.24 * sz); text = tens(2, 2); size = 1.1; active = 2 < na && 2 < nb }
draw Text { name = "un22"; pos = (cx(2) + 0.28 * sz, cy(2) - 0.24 * sz); text = units(2, 2); size = 1.1; active = 2 < na && 2 < nb }
draw Text { name = "bs0"; pos = (bandX(0), bandY(0)); text = format(band(0), 0); size = 1.3; color = #f59e0b; active = 0 < na + nb }
draw Text { name = "bs1"; pos = (bandX(1), bandY(1)); text = format(band(1), 0); size = 1.3; color = #f59e0b; active = 1 < na + nb }
draw Text { name = "bs2"; pos = (bandX(2), bandY(2)); text = format(band(2), 0); size = 1.3; color = #f59e0b; active = 2 < na + nb }
draw Text { name = "bs3"; pos = (bandX(3), bandY(3)); text = format(band(3), 0); size = 1.3; color = #f59e0b; active = 3 < na + nb }
draw Text { name = "bs4"; pos = (bandX(4), bandY(4)); text = format(band(4), 0); size = 1.3; color = #f59e0b; active = 4 < na + nb }
draw Text { name = "bs5"; pos = (bandX(5), bandY(5)); text = format(band(5), 0); size = 1.3; color = #f59e0b; active = 5 < na + nb }

new UI { name = "sA"; type = slider; label = "a"; variable = a; min = 10; max = 999; step = 1; default = 246 }
new UI { name = "sB"; type = slider; label = "b"; variable = b; min = 10; max = 999; step = 1; default = 58 }

// ---- Логика ----
float a = 246; float b = 58; float na = 3; float nb = 2;
float sz = 1.9; float gx = -3.3; float gy = 3.6; float key = -1;
list bs = (0, 0, 0, 0, 0, 0);
string info = "";

Function dg(v, k) { return floor(v / pow(10, k)) - 10 * floor(v / pow(10, k + 1)); }
Function digA(j) { return format(dg(a, na - 1 - j), 0); }
Function digB(i) { return format(dg(b, nb - 1 - i), 0); }
Function pr(i, j) { return dg(a, na - 1 - j) * dg(b, nb - 1 - i); }
Function tens(i, j) { return format(floor(pr(i, j) / 10), 0); }
Function units(i, j) { return format(pr(i, j) - 10 * floor(pr(i, j) / 10), 0); }
Function cx(j) { return gx + sz * (j + 0.5); }
Function cy(i) { return gy - sz * (i + 0.5); }
// сумма диагональной полосы e: единицы клеток с i + j = e и десятки клеток с i + j = e − 1
Function band(e) {
  float s = 0;
  repeat (na) { float j = i; repeat (nb) { float r = i; float ex = (na - 1 - j) + (nb - 1 - r);
    if (ex == e) { s = s + pr(r, j) - 10 * floor(pr(r, j) / 10); }
    if (ex == e - 1) { s = s + floor(pr(r, j) / 10); } } }
  return s;
}
Function bandX(e) { if (e <= na - 1) { return cx(na - 1 - e); } return gx - 0.6; }
Function bandY(e) { if (e <= na - 1) { return gy - sz * nb - 0.5; } return cy(nb + na - 1 - e); }

Update {
  na = 2; if (a >= 100) { na = 3; }
  nb = 2; if (b >= 100) { nb = 3; }
  if (a * 1000 + b != key) {
    key = a * 1000 + b;
    gg = newGraph(); gd = newGraph(); float c = 0;
    repeat (nb + 1) { c = c + 1; addNode(gg, "h" + format(c, 0) + "a", [gx, gy - sz * i]); addNode(gg, "h" + format(c, 0) + "b", [gx + sz * na, gy - sz * i]); addEdge(gg, "h" + format(c, 0) + "a", "h" + format(c, 0) + "b"); }
    repeat (na + 1) { c = c + 1; addNode(gg, "v" + format(c, 0) + "a", [gx + sz * i, gy]); addNode(gg, "v" + format(c, 0) + "b", [gx + sz * i, gy - sz * nb]); addEdge(gg, "v" + format(c, 0) + "a", "v" + format(c, 0) + "b"); }
    repeat (na) { float j = i; repeat (nb) { c = c + 1; addNode(gd, "d" + format(c, 0) + "a", [cx(j) + sz / 2, cy(i) + sz / 2]); addNode(gd, "d" + format(c, 0) + "b", [cx(j) - sz / 2, cy(i) - sz / 2]); addEdge(gd, "d" + format(c, 0) + "a", "d" + format(c, 0) + "b"); } }
    // сумма полос с переносами: записываем справа налево
    float carry = 0; string dig = ""; string sums = "";
    repeat (na + nb) { float t = band(i) + carry; dig = format(t - 10 * floor(t / 10), 0) + dig; carry = floor(t / 10); if (i > 0) { sums = sums + ", " + format(band(i), 0); } else { sums = format(band(i), 0); } }
    info = "**Умножение решёткой (индийский способ).** Цифры каждого произведения записаны в клетке: десятки — над диагональю, единицы — под ней. Диагональ с номером k собирает слагаемые при 10ᵏ — это все произведения цифр aᵢ · bⱼ с i + j = k, плюс десятки из соседней диагонали k − 1.";
    info = info + "\n\nСуммы диагоналей справа налево (от единиц): " + sums + ". Переносим лишние десятки в следующий разряд и записываем цифры, получаем " + format(a * b, 0) + " = " + format(a, 0) + " · " + format(b, 0) + ". Клетки можно заполнять в любом порядке — каждое произведение цифр вычисляется независимо.";
  }
}
]
