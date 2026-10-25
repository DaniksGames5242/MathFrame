[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Вершины 1…8 (число n задаёт ползунок) на правильном n-угольнике; их можно двигать,
// граф остаётся полным: любые две вершины соединены ребром. ----
new Point { name = "V1"; pos = (0.0, 4.6); text = true("1"); active = n >= 1 }
new Point { name = "V2"; pos = (-4.37, 1.42); text = true("2"); active = n >= 2 }
new Point { name = "V3"; pos = (-2.7, -3.72); text = true("3"); active = n >= 3 }
new Point { name = "V4"; pos = (2.7, -3.72); text = true("4"); active = n >= 4 }
new Point { name = "V5"; pos = (4.37, 1.42); text = true("5"); active = n >= 5 }
new Point { name = "V6"; pos = (0.0, 4.6); text = true("6"); active = n >= 6 }
new Point { name = "V7"; pos = (-4.37, 1.42); text = true("7"); active = n >= 7 }
new Point { name = "V8"; pos = (-2.7, -3.72); text = true("8"); active = n >= 8 }
new Line { name = "e12"; pos = (V1, V2); thickness = 2; interact = false; layer = 5; active = n >= 2 }
new Line { name = "e13"; pos = (V1, V3); thickness = 2; interact = false; layer = 5; active = n >= 3 }
new Line { name = "e14"; pos = (V1, V4); thickness = 2; interact = false; layer = 5; active = n >= 4 }
new Line { name = "e15"; pos = (V1, V5); thickness = 2; interact = false; layer = 5; active = n >= 5 }
new Line { name = "e16"; pos = (V1, V6); thickness = 2; interact = false; layer = 5; active = n >= 6 }
new Line { name = "e17"; pos = (V1, V7); thickness = 2; interact = false; layer = 5; active = n >= 7 }
new Line { name = "e18"; pos = (V1, V8); thickness = 2; interact = false; layer = 5; active = n >= 8 }
new Line { name = "e23"; pos = (V2, V3); thickness = 2; interact = false; layer = 5; active = n >= 3 }
new Line { name = "e24"; pos = (V2, V4); thickness = 2; interact = false; layer = 5; active = n >= 4 }
new Line { name = "e25"; pos = (V2, V5); thickness = 2; interact = false; layer = 5; active = n >= 5 }
new Line { name = "e26"; pos = (V2, V6); thickness = 2; interact = false; layer = 5; active = n >= 6 }
new Line { name = "e27"; pos = (V2, V7); thickness = 2; interact = false; layer = 5; active = n >= 7 }
new Line { name = "e28"; pos = (V2, V8); thickness = 2; interact = false; layer = 5; active = n >= 8 }
new Line { name = "e34"; pos = (V3, V4); thickness = 2; interact = false; layer = 5; active = n >= 4 }
new Line { name = "e35"; pos = (V3, V5); thickness = 2; interact = false; layer = 5; active = n >= 5 }
new Line { name = "e36"; pos = (V3, V6); thickness = 2; interact = false; layer = 5; active = n >= 6 }
new Line { name = "e37"; pos = (V3, V7); thickness = 2; interact = false; layer = 5; active = n >= 7 }
new Line { name = "e38"; pos = (V3, V8); thickness = 2; interact = false; layer = 5; active = n >= 8 }
new Line { name = "e45"; pos = (V4, V5); thickness = 2; interact = false; layer = 5; active = n >= 5 }
new Line { name = "e46"; pos = (V4, V6); thickness = 2; interact = false; layer = 5; active = n >= 6 }
new Line { name = "e47"; pos = (V4, V7); thickness = 2; interact = false; layer = 5; active = n >= 7 }
new Line { name = "e48"; pos = (V4, V8); thickness = 2; interact = false; layer = 5; active = n >= 8 }
new Line { name = "e56"; pos = (V5, V6); thickness = 2; interact = false; layer = 5; active = n >= 6 }
new Line { name = "e57"; pos = (V5, V7); thickness = 2; interact = false; layer = 5; active = n >= 7 }
new Line { name = "e58"; pos = (V5, V8); thickness = 2; interact = false; layer = 5; active = n >= 8 }
new Line { name = "e67"; pos = (V6, V7); thickness = 2; interact = false; layer = 5; active = n >= 7 }
new Line { name = "e68"; pos = (V6, V8); thickness = 2; interact = false; layer = 5; active = n >= 8 }
new Line { name = "e78"; pos = (V7, V8); thickness = 2; interact = false; layer = 5; active = n >= 8 }
new Line { name = "h1"; pos = (V1, V2); color = #f59e0b; thickness = 5; interact = false; layer = 6; active = tab == 2 && n > 1 }
new Line { name = "h2"; pos = (V2, V3); color = #f59e0b; thickness = 5; interact = false; layer = 6; active = tab == 2 && n > 2 }
new Line { name = "h3"; pos = (V3, V4); color = #f59e0b; thickness = 5; interact = false; layer = 6; active = tab == 2 && n > 3 }
new Line { name = "h4"; pos = (V4, V5); color = #f59e0b; thickness = 5; interact = false; layer = 6; active = tab == 2 && n > 4 }
new Line { name = "h5"; pos = (V5, V6); color = #f59e0b; thickness = 5; interact = false; layer = 6; active = tab == 2 && n > 5 }
new Line { name = "h6"; pos = (V6, V7); color = #f59e0b; thickness = 5; interact = false; layer = 6; active = tab == 2 && n > 6 }
new Line { name = "h7"; pos = (V7, V8); color = #f59e0b; thickness = 5; interact = false; layer = 6; active = tab == 2 && n > 7 }
new Line { name = "hc3"; pos = (V3, V1); color = #f59e0b; thickness = 5; interact = false; layer = 6; active = tab == 2 && n == 3 }
new Line { name = "hc4"; pos = (V4, V1); color = #f59e0b; thickness = 5; interact = false; layer = 6; active = tab == 2 && n == 4 }
new Line { name = "hc5"; pos = (V5, V1); color = #f59e0b; thickness = 5; interact = false; layer = 6; active = tab == 2 && n == 5 }
new Line { name = "hc6"; pos = (V6, V1); color = #f59e0b; thickness = 5; interact = false; layer = 6; active = tab == 2 && n == 6 }
new Line { name = "hc7"; pos = (V7, V1); color = #f59e0b; thickness = 5; interact = false; layer = 6; active = tab == 2 && n == 7 }
new Line { name = "hc8"; pos = (V8, V1); color = #f59e0b; thickness = 5; interact = false; layer = 6; active = tab == 2 && n == 8 }

new UI { name = "btn1"; type = button; label = "Рёбра и степени"; action = "tab = 1" }
new UI { name = "btn2"; type = button; label = "Свойства"; action = "tab = 2" }
new UI { name = "sN"; type = slider; label = "число вершин n"; variable = n; min = 1; max = 8; step = 1; default = 5 }

float tab = 1;
float n = 5;
float prevN = 5;
string info = "";
Function fact(m) { float v = 1; repeat (8) { if (i < m) { v = v * (i + 1); } } return v; }

Update {
  if (n != prevN) {
    prevN = n;
    V1.pos.x = 4.6 * cos(2 * pi * 0 / n + pi / 2); V1.pos.y = 4.6 * sin(2 * pi * 0 / n + pi / 2);
    V2.pos.x = 4.6 * cos(2 * pi * 1 / n + pi / 2); V2.pos.y = 4.6 * sin(2 * pi * 1 / n + pi / 2);
    V3.pos.x = 4.6 * cos(2 * pi * 2 / n + pi / 2); V3.pos.y = 4.6 * sin(2 * pi * 2 / n + pi / 2);
    V4.pos.x = 4.6 * cos(2 * pi * 3 / n + pi / 2); V4.pos.y = 4.6 * sin(2 * pi * 3 / n + pi / 2);
    V5.pos.x = 4.6 * cos(2 * pi * 4 / n + pi / 2); V5.pos.y = 4.6 * sin(2 * pi * 4 / n + pi / 2);
    V6.pos.x = 4.6 * cos(2 * pi * 5 / n + pi / 2); V6.pos.y = 4.6 * sin(2 * pi * 5 / n + pi / 2);
    V7.pos.x = 4.6 * cos(2 * pi * 6 / n + pi / 2); V7.pos.y = 4.6 * sin(2 * pi * 6 / n + pi / 2);
    V8.pos.x = 4.6 * cos(2 * pi * 7 / n + pi / 2); V8.pos.y = 4.6 * sin(2 * pi * 7 / n + pi / 2);
  }
  float E = n * (n - 1) / 2;
  if (tab == 1) {
    info = "**Полный граф** \\(K_{n}\\) — любые две различные вершины соединены ровно одним ребром. При n = " + format(n, 0) + " в нём \\(\\binom{n}{2} = \\dfrac{n(n-1)}{2} = " + format(E, 0) + "\\) рёбер: по одному на каждую пару вершин.\n\nКаждая вершина смежна со всеми остальными, поэтому степень любой вершины равна \\(n - 1 = " + format(n - 1, 0) + "\\) — граф регулярный. Сумма степеней \\(n(n-1) = " + format(n * (n - 1), 0) + "\\) равна удвоенному числу рёбер.";
  } else {
    string cyc = "Гамильтонов цикл (оранжевый) обходит все вершины по одному разу.";
    if (n < 3) { cyc = "Гамильтонов цикл есть при n ≥ 3."; }
    info = "**Диаметр** \\(K_{n}\\) равен 1 (при n > 1): любые две вершины соединены ребром. **Хроматическое число** равно n — все вершины попарно смежны, каждой нужен свой цвет.\n\n**Остовных деревьев** \\(n^{n-2} = " + format(pow(n, max(n - 2, 0)), 0) + "\\) (формула Кэли)" + (n >= 3 ? ", **гамильтоновых циклов** \\(\\dfrac{(n-1)!}{2} = " + format(fact(n - 1) / 2, 0) + "\\). " + cyc : ". " + cyc);
  }
}
]
