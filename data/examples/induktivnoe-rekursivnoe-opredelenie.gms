[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Базис (зелёный узел 0) и шаг: каждый следующий узел строится из предыдущего.
// Ползунок n — сколько шагов уже развернуто. ----
draw Graph { name = "gV"; graph = "gv"; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Text { name = "t0"; pos = (px(0), 2.4); text = lab(0); size = 1; color = #22c55e; active = 0 <= N }
draw Text { name = "t1"; pos = (px(1), 2.4); text = lab(1); size = 1; active = 1 <= N }
draw Text { name = "t2"; pos = (px(2), 2.4); text = lab(2); size = 1; active = 2 <= N }
draw Text { name = "t3"; pos = (px(3), 2.4); text = lab(3); size = 1; active = 3 <= N }
draw Text { name = "t4"; pos = (px(4), 2.4); text = lab(4); size = 1; active = 4 <= N }
draw Text { name = "t5"; pos = (px(5), 2.4); text = lab(5); size = 1; active = 5 <= N }
draw Text { name = "t6"; pos = (px(6), 2.4); text = lab(6); size = 1; active = 6 <= N }
draw Text { name = "t7"; pos = (px(7), 2.4); text = lab(7); size = 1; active = 7 <= N }
draw Text { name = "t8"; pos = (px(8), 2.4); text = lab(8); size = 1; active = 8 <= N }
draw Text { name = "i0"; pos = (px(0), -1.2); text = "0"; size = 0.75; color = #3b82f6; active = 0 <= N }
draw Text { name = "i1"; pos = (px(1), -1.2); text = "1"; size = 0.75; color = #3b82f6; active = 1 <= N }
draw Text { name = "i2"; pos = (px(2), -1.2); text = "2"; size = 0.75; color = #3b82f6; active = 2 <= N }
draw Text { name = "i3"; pos = (px(3), -1.2); text = "3"; size = 0.75; color = #3b82f6; active = 3 <= N }
draw Text { name = "i4"; pos = (px(4), -1.2); text = "4"; size = 0.75; color = #3b82f6; active = 4 <= N }
draw Text { name = "i5"; pos = (px(5), -1.2); text = "5"; size = 0.75; color = #3b82f6; active = 5 <= N }
draw Text { name = "i6"; pos = (px(6), -1.2); text = "6"; size = 0.75; color = #3b82f6; active = 6 <= N }
draw Text { name = "i7"; pos = (px(7), -1.2); text = "7"; size = 0.75; color = #3b82f6; active = 7 <= N }
draw Text { name = "i8"; pos = (px(8), -1.2); text = "8"; size = 0.75; color = #3b82f6; active = 8 <= N }

new UI { name = "sF"; type = select; label = "понятие"; variable = sr; options = ("fact", "sum", "pow"); labels = ("n! — факториал", "1 + 2 + … + n", "2ⁿ — степень"); default = "fact" }
new UI { name = "sN"; type = slider; label = "n"; variable = N; min = 0; max = 8; step = 1; default = 4 }

// ---- Логика ----
string sr = "fact"; float N = 4;
list vals = (1, 1, 1, 1, 1, 1, 1, 1, 1);
string info = "";

Function base0() { if (sr == "sum") { return 0; } return 1; }
Function stepv(prev, n) { if (sr == "fact") { return prev * n; } if (sr == "sum") { return prev + n; } return prev * 2; }
Function lab(i) { return format(vals[i], 0); }
Function px(i) { return -7 + i * 1.75; }

Update {
  vals[0] = base0();
  repeat (8) { vals[i + 1] = stepv(vals[i], i + 1); }
  gv = newGraph();
  repeat (8) { if (i < N) { addNode(gv, "e" + format(i, 0), [px(i) + 0.6, 2.4]); addNode(gv, "f" + format(i, 0), [px(i + 1) - 0.6, 2.4]); addEdge(gv, "e" + format(i, 0), "f" + format(i, 0)); } }

  string base = "0! = 1"; string step = "(n + 1)! = (n + 1) · n!"; string name = "факториала";
  if (sr == "sum") { base = "S(0) = 0"; step = "S(n + 1) = S(n) + (n + 1)"; name = "суммы 1 + 2 + … + n"; }
  if (sr == "pow") { base = "2⁰ = 1"; step = "2ⁿ⁺¹ = 2 · 2ⁿ"; name = "степени двойки"; }

  info = "**Индуктивное определение** " + name + ": сначала явно задаётся базис, а затем шаг, который строит каждое следующее значение из предыдущего.\n\nБазис: " + base + ". Шаг: " + step + ".\n\nПостроено n = " + format(N, 0) + " шагов: последнее значение = " + format(vals[N], 0) + ".";
}
]
