[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Кольцо всех 2ⁿ кодов ячейки (подписаны числа в дополнительном коде). Слагаемое b отсчитывается от a
// по кольцу (оранжевая дуга); результат — на кольце всегда, но при выходе за край диапазона не равен a + b. ----
draw Graph { name = "gRing"; graph = "gr"; nodeColor = #3b82f644; nodeRadius = 13; labels = true; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gArc"; graph = "ga"; nodeRadius = 0; edgeWidth = 5; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gA"; graph = "gaa"; nodeColor = #3b82f6; nodeRadius = 14; labels = true; interactive = false; showWeights = false; layer = 20 }
draw Graph { name = "gOk"; graph = "gok"; nodeColor = #22c55e; nodeRadius = 14; labels = true; interactive = false; showWeights = false; layer = 21 }
draw Graph { name = "gBad"; graph = "gbd"; nodeColor = #f59e0b; nodeRadius = 14; labels = true; interactive = false; showWeights = false; layer = 21 }
draw Text { name = "ctr"; pos = (0, 0.3); text = "n = " + format(n, 0) + " разр."; size = 1.1 }
draw Text { name = "ctr2"; pos = (0, -0.4); text = "2ⁿ = " + format(pow(2, n), 0) + " кодов"; size = 0.9; color = #3b82f6 }

new UI { name = "sN"; type = slider; label = "разрядов n"; variable = n; min = 2; max = 5; step = 1; default = 4 }
new UI { name = "sA"; type = slider; label = "a"; variable = a; min = -half; max = half - 1; step = 1; default = 3 }
new UI { name = "sB"; type = slider; label = "b"; variable = b; min = -half; max = half - 1; step = 1; default = 6 }

// ---- Логика ----
float n = 4; float a = 3; float b = 6; float half = 8;
float key = -1;
string info = "";

Function md(v, m) { return v - floor(v / m) * m; }
Function num(v) { if (v < 0) { return "−" + format(-v, 0); } return format(v, 0); }
Function sg(v) { if (v < 0) { return "−"; } return "+"; }
Function wrap(v) { return md(v + half, 2 * half) - half; }
Function bits(v) {
  float c = md(v, 2 * half); string s = "";
  repeat (n) { float k = n - 1 - i; s = s + format(floor(c / pow(2, k)) - 2 * floor(c / pow(2, k + 1)), 0); }
  return s;
}
Function px(v) { return 4.2 * cos(1.5708 - 6.28319 * md(v, 2 * half) / (2 * half)); }
Function py(v) { return 4.2 * sin(1.5708 - 6.28319 * md(v, 2 * half) / (2 * half)); }

Update {
  half = pow(2, n - 1);
  if (a >= half) { a = half - 1; } if (a < -half) { a = -half; }
  if (b >= half) { b = half - 1; } if (b < -half) { b = -half; }
  float s = a + b; float r = wrap(s);
  float ov = 0; if (s != r) { ov = 1; }
  if (key != n * 1000 + (a + 16) * 40 + b + 16) {
    key = n * 1000 + (a + 16) * 40 + b + 16;
    gr = newGraph(); ga = newGraph(); gaa = newGraph(); gok = newGraph(); gbd = newGraph();
    repeat (2 * half) { float v = wrap(i); addNode(gr, "r" + format(i, 0), [px(v), py(v)], num(v)); }
    addNode(gaa, "a", [px(a), py(a)], num(a));
    if (ov > 0.5) { addNode(gbd, "r", [px(r), py(r)], num(r)); } else { addNode(gok, "r", [px(r), py(r)], num(r)); }
    float st = 1; if (b < 0) { st = -1; }
    repeat (abs(b) + 1) { addNode(ga, "s" + format(i, 0), [px(a + st * i), py(a + st * i)]); }
    repeat (abs(b)) { addEdge(ga, "s" + format(i, 0), "s" + format(i + 1, 0), 1, "#f59e0b"); }
  }
  info = "**Компьютерная арифметика:** число хранится в ячейке из n = " + format(n, 0) + " разрядов, поэтому представимы лишь 2ⁿ = " + format(2 * half, 0) + " чисел — в дополнительном коде от " + num(-half) + " до " + num(half - 1) + ". Числа образуют кольцо: за наибольшим сразу следует наименьшее.\n\n";
  info = info + "**a + b:** " + bits(a) + " + " + bits(b) + " = " + bits(s) + " (в ячейке; а " + num(a) + " + " + num(b) + " = " + num(s) + "). ";
  if (ov > 0.5) { info = info + "**Переполнение:** знаки слагаемых совпадают (" + sg(a) + " и " + sg(b) + "), а знак суммы противоположен — вместо " + num(s) + " в ячейке оказывается " + num(r) + ". Старшие разряды отброшены."; }
  else { info = info + "Переполнения нет: результат " + num(r) + " представим" + " (при разных знаках слагаемых выйти за диапазон нельзя)."; }
}
]
