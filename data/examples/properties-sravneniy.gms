[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Остатки 0…m−1 по кругу. Операции: синий узел — результат для чисел a, b, жёлтый — для их сравнимых «двойников»
// a′ = a + ka·m, b′ = b + kb·m: узлы совпадают. Режим «умножение на c»: стрелки x → c·x показывают обратимость и сокращение. ----
draw Graph { name = "gE"; graph = "ge"; nodeRadius = 15; nodeColor = #3b82f6; labels = false; directed = true; edgeColor = #3b82f6; edgeWidth = 2; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "gN"; graph = "gn"; nodeColor = #3b82f6; nodeRadius = 15; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gI"; graph = "gi"; nodeColor = #3b82f6; nodeRadius = 15; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gR1"; graph = "gr1"; nodeColor = #3b82f6; nodeRadius = 27; interactive = false; showWeights = false; layer = 7 }
draw Graph { name = "gR2"; graph = "gr2"; nodeColor = #f59e0b; nodeRadius = 17; labels = false; interactive = false; showWeights = false; layer = 8 }

new UI { name = "sO"; type = select; label = "операция"; variable = op; options = ("add", "sub", "mul", "pow", "inv"); labels = ("a + b", "a − b", "a · b", "aᵏ", "умножение на c: x → c·x"); default = "mul" }
new UI { name = "sM"; type = slider; label = "модуль m"; variable = m; min = 2; max = 12; step = 1; default = 7 }
new UI { name = "sA"; type = slider; label = "a"; variable = a; min = -20; max = 20; step = 1; default = 5 }
new UI { name = "sKa"; type = slider; label = "сдвиг ka"; variable = ka; min = -3; max = 3; step = 1; default = 2 }
new UI { name = "sB"; type = slider; label = "b"; variable = b; min = -20; max = 20; step = 1; default = 12 }
new UI { name = "sKb"; type = slider; label = "сдвиг kb"; variable = kb; min = -3; max = 3; step = 1; default = -1 }
new UI { name = "sK"; type = slider; label = "показатель k"; variable = k; min = 1; max = 6; step = 1; default = 3 }
new UI { name = "sC"; type = slider; label = "множитель c"; variable = c; min = 1; max = 24; step = 1; default = 4 }

// ---- Логика ----
string op = "mul"; float m = 7; float a = 5; float ka = 2; float b = 12; float kb = -1; float k = 3; float c = 4;
string info = ""; float key = -1;

Function md(x, y) { return x - floor(x / y) * y; }
Function ni(x) { if (x < 0) { return "−" + format(-x, 0); } return format(x, 0); }
Function pn(x) { if (x < 0) { return "(−" + format(-x, 0) + ")"; } return format(x, 0); }
Function gd(x, y) { float u = abs(x); float v = abs(y); repeat (40) { if (v > 0) { float r = u - floor(u / v) * v; u = v; v = r; } } return u; }
Function pw(x, e) { float r = 1; repeat (e) { r = r * x; } return r; }
Function opv(x, y) {
  if (op == "add") { return x + y; }
  if (op == "sub") { return x - y; }
  if (op == "mul") { return x * y; }
  return pw(x, k);
}
Function ox() { if (op == "add") { return "+"; } if (op == "sub") { return "−"; } return "·"; }
Function ex(x, y) {
  if (op == "pow") { return pn(x) + "^" + format(k, 0); }
  return pn(x) + " " + ox() + " " + pn(y);
}
Function cx(t) { return 3.9 * sin(2 * pi * t / m); }
Function cy(t) { return 0.2 + 3.9 * cos(2 * pi * t / m); }

Update {
  float kk = m * 1000000 + a * 10000 + ka * 1000 + b * 100 + kb * 10 + k + c * 100000000;
  if (op == "inv") { kk = kk + 0.5; }
  if (kk != key) {
    key = kk;
    ge = newGraph(); gn = newGraph(); gi = newGraph(); gr1 = newGraph(); gr2 = newGraph();
    float g = gd(c, m);
    if (op == "inv") {
      repeat (m) {
        float x = i;
        float y = md(c * x, m);
        addNode(ge, "e" + format(x, 0), [cx(x), cy(x)]);
        if (y != x) { addEdge(ge, "e" + format(x, 0), "e" + format(y, 0)); }
      }
      repeat (m) {
        float x = i;
        float hit = 0;
        repeat (m) { if (md(c * i, m) == x) { hit = 1; } }
        if (hit == 1) { addNode(gi, "n" + format(x, 0), [cx(x), cy(x)], format(x, 0)); }
        else { addNode(gn, "n" + format(x, 0), [cx(x), cy(x)], format(x, 0)); }
      }
      if (g == 1) {
        repeat (m) { float u = i; if (md(c * u, m) == 1) { addNode(gr2, "u", [cx(u), cy(u)]); } }
      }
    } else {
      float a2 = a + ka * m; float b2 = b + kb * m;
      repeat (m) { addNode(gn, "n" + format(i, 0), [cx(i), cy(i)], format(i, 0)); }
      float r1 = md(opv(a, b), m); float r2 = md(opv(a2, b2), m);
      addNode(gr1, "r1", [cx(r1), cy(r1)], format(r1, 0));
      addNode(gr2, "r2", [cx(r2), cy(r2)]);
    }
  }
  if (op == "inv") {
    float g2 = gd(c, m);
    info = "**Деление в модулярной арифметике.** Модуль m = **" + format(m, 0) + "**, множитель c = **" + format(c, 0) + "**. Стрелка x → c·x (mod " + format(m, 0) + ") ведёт от каждого остатка к остатку произведения; синие узлы — те, в которые попадает хотя бы одна стрелка.\n\n";
    if (g2 == 1) {
      float u = 0; repeat (m) { if (md(c * i, m) == 1) { u = i; } }
      info = info + "**НОД(c, m) = 1:** все m стрелок ведут в разные узлы — умножение на c переставляет остатки. Поэтому есть обратный элемент: c·" + format(u, 0) + " = " + format(c * u, 0) + " ≡ 1 (mod " + format(m, 0) + ") (жёлтый узел), и сравнение cx ≡ cy можно сократить на c: x ≡ y.";
    } else {
      info = info + "**НОД(c, m) = " + format(g2, 0) + " > 1:** стрелки сливаются, часть узлов серая — в них не попадает ничего, единицы среди значений нет, обратного к c не существует. Сокращать на c нельзя: c·0 ≡ c·" + format(m / g2, 0) + " ≡ 0, хотя 0 ≢ " + format(m / g2, 0) + " (mod " + format(m, 0) + ").";
    }
  } else {
    float a2 = a + ka * m; float b2 = b + kb * m;
    float v1 = opv(a, b); float v2 = opv(a2, b2);
    info = "**Свойства сравнений:** заменяя числа сравнимыми, мы не меняем результат операции по модулю. Модуль m = **" + format(m, 0) + "**; a′ = " + ni(a2) + " (= " + ni(a) + " + " + pn(ka) + "·" + format(m, 0) + "), b′ = " + ni(b2) + " (= " + ni(b) + " + " + pn(kb) + "·" + format(m, 0) + "); a ≡ a′ и b ≡ b′.\n\n";
    info = info + "**" + ex(a, b) + " = " + ni(v1) + " ≡ " + format(md(v1, m), 0) + ",  " + ex(a2, b2) + " = " + ni(v2) + " ≡ " + format(md(v2, m), 0) + " (mod " + format(m, 0) + ").** Остатки совпали, и на круге синий и жёлтый узлы — один и тот же.";
    if (op == "pow") { info = info + " (Число b в этом режиме не используется.)"; }
  }
}
]
