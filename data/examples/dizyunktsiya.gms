[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Схема: входы P, Q — лампы (зелёная — 1, обычная — 0), провода окрашены значением, которое по ним идёт.
// Справа — таблица истинности, строка с текущими значениями подсвечена. ----
draw Graph { name = "gRow"; graph = "gr"; nodeRadius = 0; labels = false; interactive = false; showWeights = false; edgeWidth = 34; edgeCap = butt; layer = 4 }
draw Graph { name = "gW"; graph = "gw"; nodeRadius = 0; labels = false; interactive = false; showWeights = false; edgeWidth = 4; layer = 5 }
draw Graph { name = "gOff"; graph = "go"; nodeRadius = 22; labels = true; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gOn"; graph = "gn"; nodeRadius = 22; labels = true; interactive = false; showWeights = false; nodeColor = #22c55e; layer = 11 }
draw Graph { name = "gGate"; graph = "gg"; nodeRadius = 30; labels = true; interactive = false; showWeights = false; layer = 10 }
draw Text { name = "ah0"; pos = (5.8, 3.9); text = "P"; size = 1.05 }
draw Text { name = "ah1"; pos = (7.4, 3.9); text = "Q"; size = 1.05 }
draw Text { name = "ah2"; pos = (9.0, 3.9); text = "R"; size = 1.05 }
draw Text { name = "ac0_0"; pos = (5.8, 2.5); text = "1"; size = 1 }
draw Text { name = "ac0_1"; pos = (7.4, 2.5); text = "1"; size = 1 }
draw Text { name = "ac0_2"; pos = (9.0, 2.5); text = "1"; size = 1 }
draw Text { name = "ac1_0"; pos = (5.8, 1.2); text = "1"; size = 1 }
draw Text { name = "ac1_1"; pos = (7.4, 1.2); text = "0"; size = 1 }
draw Text { name = "ac1_2"; pos = (9.0, 1.2); text = "1"; size = 1 }
draw Text { name = "ac2_0"; pos = (5.8, -0.10000000000000009); text = "0"; size = 1 }
draw Text { name = "ac2_1"; pos = (7.4, -0.10000000000000009); text = "1"; size = 1 }
draw Text { name = "ac2_2"; pos = (9.0, -0.10000000000000009); text = "1"; size = 1 }
draw Text { name = "ac3_0"; pos = (5.8, -1.4000000000000004); text = "0"; size = 1 }
draw Text { name = "ac3_1"; pos = (7.4, -1.4000000000000004); text = "0"; size = 1 }
draw Text { name = "ac3_2"; pos = (9.0, -1.4000000000000004); text = "0"; size = 1 }
draw Text { name = "bh0"; pos = (4.199999999999999, 3.9); text = "P"; size = 1.05 }
draw Text { name = "bh1"; pos = (5.8, 3.9); text = "Q"; size = 1.05 }
draw Text { name = "bh2"; pos = (7.4, 3.9); text = "R₁"; size = 1.05 }
draw Text { name = "bh3"; pos = (9.0, 3.9); text = "R₂"; size = 1.05 }
draw Text { name = "bc0_0"; pos = (4.199999999999999, 2.5); text = "1"; size = 1 }
draw Text { name = "bc0_1"; pos = (5.8, 2.5); text = "1"; size = 1 }
draw Text { name = "bc0_2"; pos = (7.4, 2.5); text = "1"; size = 1 }
draw Text { name = "bc0_3"; pos = (9.0, 2.5); text = "1"; size = 1 }
draw Text { name = "bc1_0"; pos = (4.199999999999999, 1.2); text = "1"; size = 1 }
draw Text { name = "bc1_1"; pos = (5.8, 1.2); text = "0"; size = 1 }
draw Text { name = "bc1_2"; pos = (7.4, 1.2); text = "1"; size = 1 }
draw Text { name = "bc1_3"; pos = (9.0, 1.2); text = "1"; size = 1 }
draw Text { name = "bc2_0"; pos = (4.199999999999999, -0.10000000000000009); text = "0"; size = 1 }
draw Text { name = "bc2_1"; pos = (5.8, -0.10000000000000009); text = "1"; size = 1 }
draw Text { name = "bc2_2"; pos = (7.4, -0.10000000000000009); text = "1"; size = 1 }
draw Text { name = "bc2_3"; pos = (9.0, -0.10000000000000009); text = "1"; size = 1 }
draw Text { name = "bc3_0"; pos = (4.199999999999999, -1.4000000000000004); text = "0"; size = 1 }
draw Text { name = "bc3_1"; pos = (5.8, -1.4000000000000004); text = "0"; size = 1 }
draw Text { name = "bc3_2"; pos = (7.4, -1.4000000000000004); text = "0"; size = 1 }
draw Text { name = "bc3_3"; pos = (9.0, -1.4000000000000004); text = "0"; size = 1 }
draw Text { name = "l1P"; pos = (-7.5, 2.95); text = "P"; size = 1 }
draw Text { name = "l1Q"; pos = (-7.5, -1.05); text = "Q"; size = 1 }
draw Text { name = "l1R"; pos = (1.2, 0.95); text = "R = P ∨ Q"; size = 1 }
draw Text { name = "l2P"; pos = (-8.6, 3.3499999999999996); text = "P"; size = 0.9 }
draw Text { name = "l2Q"; pos = (-8.6, -1.45); text = "Q"; size = 0.9 }
draw Text { name = "l2A"; pos = (-5.6, 3.3499999999999996); text = "¬P"; size = 0.9 }
draw Text { name = "l2B"; pos = (-5.6, -1.45); text = "¬Q"; size = 0.9 }
draw Text { name = "l2C"; pos = (-2.8, 0.95); text = "¬P ∧ ¬Q"; size = 0.9 }
draw Text { name = "l2R2"; pos = (0.3, 0.95); text = "R₂ = ¬(¬P ∧ ¬Q)"; size = 0.9 }
draw Text { name = "l2R1"; pos = (0.3, -3.25); text = "R₁ = P ∨ Q"; size = 0.9 }
new Claster { name = "tabT1"; elements = (ah0, ah1, ah2, ac0_0, ac0_1, ac0_2, ac1_0, ac1_1, ac1_2, ac2_0, ac2_1, ac2_2, ac3_0, ac3_1, ac3_2, l1P, l1Q, l1R); active = true }
new Claster { name = "tabT2"; elements = (bh0, bh1, bh2, bh3, bc0_0, bc0_1, bc0_2, bc0_3, bc1_0, bc1_1, bc1_2, bc1_3, bc2_0, bc2_1, bc2_2, bc2_3, bc3_0, bc3_1, bc3_2, bc3_3, l2P, l2Q, l2A, l2B, l2C, l2R2, l2R1); active = false }
new UI { name = "btn1"; type = button; label = "Схема"; action = "tab = 1; tabT1.active = true; tabT2.active = false" }
new UI { name = "btn2"; type = button; label = "Закон де Моргана"; action = "tab = 2; tabT1.active = false; tabT2.active = true" }
new UI { name = "tP"; type = toggle; label = "P"; variable = P; default = true }
new UI { name = "tQ"; type = toggle; label = "Q"; variable = Q; default = false }

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
  float vR = max(p, q);
  float v_A = 1 - p;
  float v_B = 1 - q;
  float v_C = (1 - p) * (1 - q);
  float v_R2 = 1 - (1 - p) * (1 - q);
  float v_R1 = max(p, q);
  float v_P = p; float v_Q = q;
  float row = (1 - p) * 2 + (1 - q);
  string k2 = cnt(tab) + "_" + cnt(p) + "_" + cnt(q);
  if (k2 != key) {
    key = k2;
    gr = newGraph(); gw = newGraph(); go = newGraph(); gn = newGraph(); gg = newGraph();
    if (tab == 1) {
      float ry = 2.5 - 1.3 * row;
      addNode(gr, "r0", [5.0, ry]); addNode(gr, "r1", [9.8, ry]); addEdge(gr, "r0", "r1", 1, "#f59e0b40");
      lamp("P", -7.5, 2.0, p);
      lamp("Q", -7.5, -2, q);
      addNode(gw, "g", [-3.2, 0]); addNode(gg, "g", [-3.2, 0], "∨");
      lamp("R", 1.2, 0, vR);
      wire("P", "g", p);
      wire("Q", "g", q);
      wire("g", "R", vR);
    } else {
      float ry2 = 2.5 - 1.3 * row;
      addNode(gr, "r0", [3.3999999999999995, ry2]); addNode(gr, "r1", [9.8, ry2]); addEdge(gr, "r0", "r1", 1, "#f59e0b40");
      lamp("P", -8.6, 2.4, v_P);
      lamp("Q", -8.6, -2.4, v_Q);
      lamp("A", -5.6, 2.4, v_A);
      lamp("B", -5.6, -2.4, v_B);
      lamp("C", -2.8, 0, v_C);
      lamp("R2", 0.3, 0, v_R2);
      lamp("R1", 0.3, -4.2, v_R1);
      wire("P", "A", v_P);
      wire("Q", "B", v_Q);
      wire("A", "C", v_A);
      wire("B", "C", v_B);
      wire("C", "R2", v_C);
      wire("P", "R1", v_P);
      wire("Q", "R1", v_Q);
    }
  }
  if (tab == 1) {
    info = "**Дизъюнкция** \\(P \\vee Q\\) истинна, когда истинен хотя бы один операнд (в том числе оба). Сейчас P = " + tv(p) + ", Q = " + tv(q) + ", \\(P \\vee Q\\) = " + tv(vR) + ".\n\nЛожна лишь в одной строке из четырёх — когда оба операнда ложны, то есть истинна в трёх случаях из четырёх.";
  } else {
    info = "**Закон де Моргана:** \\(\\neg(P \\vee Q) \\equiv \\neg P \\wedge \\neg Q\\), поэтому \\(P \\vee Q \\equiv \\neg(\\neg P \\wedge \\neg Q)\\). Для P = " + cnt(p) + ", Q = " + cnt(q) + ": R₁ = " + cnt(v_R1) + ", R₂ = " + cnt(v_R2) + " — столбцы таблицы совпадают.\n\nЕщё одна равносильная запись: \\(P \\vee Q \\equiv \\neg P \\to Q\\).";
  }
}
]
