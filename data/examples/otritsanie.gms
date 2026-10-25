[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Схема: входы P — лампы (зелёная — 1, обычная — 0), провода окрашены значением, которое по ним идёт.
// Справа — таблица истинности, строка с текущими значениями подсвечена. ----
draw Graph { name = "gRow"; graph = "gr"; nodeRadius = 0; labels = false; interactive = false; showWeights = false; edgeWidth = 34; edgeCap = butt; layer = 4 }
draw Graph { name = "gW"; graph = "gw"; nodeRadius = 0; labels = false; interactive = false; showWeights = false; edgeWidth = 4; layer = 5 }
draw Graph { name = "gOff"; graph = "go"; nodeRadius = 22; labels = true; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gOn"; graph = "gn"; nodeRadius = 22; labels = true; interactive = false; showWeights = false; nodeColor = #22c55e; layer = 11 }
draw Graph { name = "gGate"; graph = "gg"; nodeRadius = 30; labels = true; interactive = false; showWeights = false; layer = 10 }
draw Text { name = "ah0"; pos = (7.4, 3.9); text = "P"; size = 1.05 }
draw Text { name = "ah1"; pos = (9.0, 3.9); text = "R"; size = 1.05 }
draw Text { name = "ac0_0"; pos = (7.4, 2.5); text = "1"; size = 1 }
draw Text { name = "ac0_1"; pos = (9.0, 2.5); text = "0"; size = 1 }
draw Text { name = "ac1_0"; pos = (7.4, 1.2); text = "0"; size = 1 }
draw Text { name = "ac1_1"; pos = (9.0, 1.2); text = "1"; size = 1 }
draw Text { name = "bh0"; pos = (5.8, 3.9); text = "P"; size = 1.05 }
draw Text { name = "bh1"; pos = (7.4, 3.9); text = "¬P"; size = 1.05 }
draw Text { name = "bh2"; pos = (9.0, 3.9); text = "¬¬P"; size = 1.05 }
draw Text { name = "bc0_0"; pos = (5.8, 2.5); text = "1"; size = 1 }
draw Text { name = "bc0_1"; pos = (7.4, 2.5); text = "0"; size = 1 }
draw Text { name = "bc0_2"; pos = (9.0, 2.5); text = "1"; size = 1 }
draw Text { name = "bc1_0"; pos = (5.8, 1.2); text = "0"; size = 1 }
draw Text { name = "bc1_1"; pos = (7.4, 1.2); text = "1"; size = 1 }
draw Text { name = "bc1_2"; pos = (9.0, 1.2); text = "0"; size = 1 }
draw Text { name = "l1P"; pos = (-7.5, 0.95); text = "P"; size = 1 }
draw Text { name = "l1R"; pos = (1.2, 0.95); text = "R = ¬P"; size = 1 }
draw Text { name = "l2P"; pos = (-8.6, 0.95); text = "P"; size = 0.9 }
draw Text { name = "l2A"; pos = (-5, 0.95); text = "¬P"; size = 0.9 }
draw Text { name = "l2B"; pos = (-1.4, 0.95); text = "¬¬P"; size = 0.9 }
new Claster { name = "tabT1"; elements = (ah0, ah1, ac0_0, ac0_1, ac1_0, ac1_1, l1P, l1R); active = true }
new Claster { name = "tabT2"; elements = (bh0, bh1, bh2, bc0_0, bc0_1, bc0_2, bc1_0, bc1_1, bc1_2, l2P, l2A, l2B); active = false }
new UI { name = "btn1"; type = button; label = "Схема"; action = "tab = 1; tabT1.active = true; tabT2.active = false" }
new UI { name = "btn2"; type = button; label = "Двойное отрицание"; action = "tab = 2; tabT1.active = false; tabT2.active = true" }
new UI { name = "tP"; type = toggle; label = "P"; variable = P; default = true }

float tab = 1;
bool P = true;
bool Q = false;
string info = "";
string key = "";

func cnt(x) = format(x, 0);
func tv(x) = x == 1 ? "1 (истина)" : "0 (ложь)";
Function lamp(k, x, y, v) {
  addNode(gw, k, [x, y]);
  if (v == 1) { addNode(gn, k, [x, y], "1"); } else { addNode(go, k, [x, y], "0"); }
}
Function wire(a, b, v) {
  string c = "#6b7280"; if (v == 1) { c = "#22c55e"; }
  addEdge(gw, a, b, 4, c);
}

Update {
  float p = 0; if (P) { p = 1; }
  float q = 0; if (Q) { q = 1; }
  float vR = 1 - p;
  float v_A = 1 - p;
  float v_B = p;
  float v_P = p; float v_Q = q;
  float row = 1 - p;
  string k2 = cnt(tab) + "_" + cnt(p) + "_" + cnt(q);
  if (k2 != key) {
    key = k2;
    gr = newGraph(); gw = newGraph(); go = newGraph(); gn = newGraph(); gg = newGraph();
    if (tab == 1) {
      float ry = 2.5 - 1.3 * row;
      addNode(gr, "r0", [6.6000000000000005, ry]); addNode(gr, "r1", [9.8, ry]); addEdge(gr, "r0", "r1", 1, "#f59e0b40");
      lamp("P", -7.5, 0, p);
      addNode(gw, "g", [-3.2, 0]); addNode(gg, "g", [-3.2, 0], "¬");
      lamp("R", 1.2, 0, vR);
      wire("P", "g", p);
      wire("g", "R", vR);
    } else {
      float ry2 = 2.5 - 1.3 * row;
      addNode(gr, "r0", [5.0, ry2]); addNode(gr, "r1", [9.8, ry2]); addEdge(gr, "r0", "r1", 1, "#f59e0b40");
      lamp("P", -8.6, 0, v_P);
      lamp("A", -5, 0, v_A);
      lamp("B", -1.4, 0, v_B);
      wire("P", "A", v_P);
      wire("A", "B", v_A);
    }
  }
  if (tab == 1) {
    info = "**Отрицание** \\(\\neg P\\) переводит высказывание в его противоположность: результат истинен тогда и только тогда, когда P ложно. Сейчас P = " + tv(p) + ", поэтому \\(\\neg P\\) = " + tv(vR) + ".\n\nТаблица истинности состоит из двух строк: \\(\\neg 1 = 0\\), \\(\\neg 0 = 1\\). Отрицание — единственная нетривиальная унарная операция: она меняет значение на противоположное.";
  } else {
    info = "**Инволютивность:** двойное отрицание возвращает исходное значение, \\(\\neg\\neg P = P\\). При P = " + cnt(p) + " получаем \\(\\neg P = " + cnt(v_A) + "\\), \\(\\neg\\neg P = " + cnt(v_B) + "\\).\n\nКаждое применение отрицания меняет значение, а два изменения подряд возвращают к исходному.";
  }
}
]
