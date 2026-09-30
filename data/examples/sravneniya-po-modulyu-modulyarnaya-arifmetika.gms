[
description = "{info}"

field width = 16;
field height = 11;
camera type = fixed;

// ---- Числа 0…47 в таблице: столбец — остаток при делении на n, то есть класс вычетов.
// Синий — класс числа a, жёлтый — класс числа b (если классы совпали, всё синее), серый — остальные. ----
draw Graph { name = "gN"; graph = "gn"; nodeColor = #3b82f6; nodeRadius = 13; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gA"; graph = "ga"; nodeColor = #3b82f6; nodeRadius = 14; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gB"; graph = "gb"; nodeColor = #f59e0b; nodeRadius = 14; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gSa"; graph = "gsa"; nodeColor = #3b82f6; nodeRadius = 18; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gSb"; graph = "gsb"; nodeColor = #f59e0b; nodeRadius = 18; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gHd"; graph = "ghd"; nodeRadius = 0; interactive = false; showWeights = false; layer = 5 }
draw Text { name = "tHd"; pos = (0, 5.15); text = "остаток при делении на n (номер класса вычетов)"; size = 0.9 }
draw Graph { name = "gLa"; graph = "gla"; nodeColor = #3b82f6; nodeRadius = 10; labels = false; interactive = false; showWeights = false }
draw Graph { name = "gLb"; graph = "glb"; nodeColor = #f59e0b; nodeRadius = 10; labels = false; interactive = false; showWeights = false }
draw Text { name = "tLa"; pos = (-4.3, -5.0); text = "класс числа a"; size = 0.95; align = left }
draw Text { name = "tLb"; pos = (1.2, -5.0); text = "класс числа b"; size = 0.95; align = left }

new UI { name = "sN"; type = slider; label = "модуль n"; variable = n; min = 4; max = 12; step = 1; default = 7 }
new UI { name = "sA"; type = slider; label = "a"; variable = a; min = 0; max = 47; step = 1; default = 17 }
new UI { name = "sB"; type = slider; label = "b"; variable = b; min = 0; max = 47; step = 1; default = 38 }

// ---- Логика ----
float n = 7; float a = 17; float b = 38; float key = -1;
string info = "";

Function md(x, y) { return x - floor(x / y) * y; }
Function ni(x) { if (x < 0) { return "−" + format(-x, 0); } return format(x, 0); }
Function px(k) { return (md(k, n) - (n - 1) / 2) * 1.1; }
Function py(k) { return 3.9 - 0.72 * floor(k / n); }

Update {
  float kk = n * 10000 + a * 100 + b;
  if (kk != key) {
    key = kk;
    gn = newGraph(); ga = newGraph(); gb = newGraph(); gsa = newGraph(); gsb = newGraph(); ghd = newGraph();
    repeat (n) { addNode(ghd, "h" + format(i, 0), [px(i), 4.55], format(i, 0)); }
    repeat (48) {
      float k = i;
      string id = "k" + format(k, 0);
      if (k == a) { addNode(gsa, id, [px(k), py(k)], format(k, 0)); }
      else { if (k == b) { addNode(gsb, id, [px(k), py(k)], format(k, 0)); }
      else { if (md(k, n) == md(a, n)) { addNode(ga, id, [px(k), py(k)], format(k, 0)); }
      else { if (md(k, n) == md(b, n)) { addNode(gb, id, [px(k), py(k)], format(k, 0)); }
      else { addNode(gn, id, [px(k), py(k)], format(k, 0)); } } } }
    }
    gla = newGraph(); addNode(gla, "l", [-4.7, -5.0]);
    glb = newGraph(); addNode(glb, "l", [0.8, -5.0]);
  }
  float r = md(a, n); float s = md(b, n);
  float d = a - b;
  info = "**Сравнение по модулю:** числа a и b сравнимы по модулю n, если дают одинаковый остаток при делении на n, то есть n делит a − b. Столбцы таблицы — классы вычетов по модулю n = **" + format(n, 0) + "**.\n\n";
  info = info + "**a = " + format(a, 0) + " = " + format(floor(a / n), 0) + "·" + format(n, 0) + " + " + format(r, 0) + ", b = " + format(b, 0) + " = " + format(floor(b / n), 0) + "·" + format(n, 0) + " + " + format(s, 0) + ".** Остатки: " + format(r, 0) + " и " + format(s, 0) + ". ";
  if (r == s) { info = info + "Они равны, и a − b = " + ni(d) + " = " + ni(d / n) + "·" + format(n, 0) + " делится на n: **a ≡ b (mod " + format(n, 0) + ")**, числа лежат в одном столбце."; }
  else { info = info + "Они различны, и a − b = " + ni(d) + " не делится на n (остаток " + format(md(d, n), 0) + "): числа **не сравнимы**, лежат в разных столбцах."; }
  info = info + "\n\nСумма и произведение зависят только от классов: a + b = " + format(a + b, 0) + " даёт остаток " + format(md(a + b, n), 0) + ", и сумма остатков " + format(r, 0) + " + " + format(s, 0) + " = " + format(r + s, 0) + " даёт тот же остаток " + format(md(r + s, n), 0) + "; a·b = " + format(a * b, 0) + " даёт остаток " + format(md(a * b, n), 0) + ", и r·s = " + format(r * s, 0) + " даёт " + format(md(r * s, n), 0) + ".";
}
]
