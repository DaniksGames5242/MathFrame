[
description = "{info}"

field width = 12; field height = 8;
camera type = fixed;

// Числовая прямая: точки a, b, c — три действительных числа (можно двигать). Стрелки-«шаги» показывают, как аксиомы поля
// связывают результаты операций над ними; при любых a, b, c обе части каждого равенства совпадают.
draw Graph { name = "gTick"; graph = "gt"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false }
draw Graph { name = "gAdd"; graph = "g1"; nodeRadius = 6; labels = false; interactive = false; edgeWidth = 2; edgeColor = #3b82f6 }
draw Graph { name = "gMul"; graph = "g2"; nodeRadius = 6; labels = false; interactive = false; edgeWidth = 2; edgeColor = #f59e0b }
draw Graph { name = "gDis"; graph = "g3"; nodeRadius = 6; labels = false; interactive = false; edgeWidth = 2; edgeColor = #22c55e }
new Line { name = "axis"; pos = (LA, LB); interact = false }
new Point { name = "LA"; pos = (-5.8, 0); dynamic = false; collision = false; active = false }
new Point { name = "LB"; pos = (5.8, 0); dynamic = false; collision = false; active = false }
// Направляющая [−1,5; 1,5]: точки a, b, c ходят только по ней — строго по прямой
new Point { name = "RA"; pos = (-1.5, 0); dynamic = false; collision = false; active = false }
new Point { name = "RB"; pos = (1.5, 0); dynamic = false; collision = false; active = false }
new Line { name = "rail"; pos = (RA, RB); interact = false; active = false }
new Point { name = "PA"; line = "rail"; t = 1; pauseOnDrag = false; collideWithPoints = false; text = true("a") }
new Point { name = "PB"; line = "rail"; t = 0.1667; pauseOnDrag = false; collideWithPoints = false; text = true("b") }
new Point { name = "PC"; line = "rail"; t = 0.8333; pauseOnDrag = false; collideWithPoints = false; text = true("c") }
draw Text { name = "L1p0"; pos = (0, 3.0); text = "0"; size = 0.9; }
draw Text { name = "L1p1"; pos = (a, 3.0); text = "a"; size = 0.9; }
draw Text { name = "L1p2"; pos = (a + b, 3.0); text = "a + b"; size = 0.9; }
draw Text { name = "L1q0"; pos = (0, 1.7999999999999998); text = "0"; size = 0.9; }
draw Text { name = "L1q1"; pos = (b, 1.7999999999999998); text = "b"; size = 0.9; }
draw Text { name = "L1q2"; pos = (a + b, 1.7999999999999998); text = "b + a"; size = 0.9; }
draw Text { name = "L1r0"; pos = (0, -1.7999999999999998); text = "0"; size = 0.9; }
draw Text { name = "L1r1"; pos = (a, -1.7999999999999998); text = "a"; size = 0.9; }
draw Text { name = "L1r2"; pos = (0, -3.0); text = "a + (−a) = 0"; size = 0.9; }
draw Text { name = "L2p1"; pos = (b, 3.0); text = "b"; size = 0.9; }
draw Text { name = "L2p2"; pos = (a * b, 3.0); text = "a · b"; size = 0.9; }
draw Text { name = "L2q1"; pos = (a, 1.7999999999999998); text = "a"; size = 0.9; }
draw Text { name = "L2q2"; pos = (a * b, 1.7999999999999998); text = "b · a"; size = 0.9; }
draw Text { name = "L2r0"; pos = (1 / a, -1.7999999999999998); text = "1/a"; size = 0.9; active = abs(a) > 0.1; }
draw Text { name = "L2r1"; pos = (1, -3.0); text = "a · (1/a) = 1"; size = 0.9; active = abs(a) > 0.1; }
draw Text { name = "L3p0"; pos = (0, 3.0); text = "0"; size = 0.9; }
draw Text { name = "L3p1"; pos = (a * b, 3.0); text = "a · b"; size = 0.9; }
draw Text { name = "L3p2"; pos = (a * b + a * c, 3.0); text = "a·b + a·c"; size = 0.9; }
draw Text { name = "L3q0"; pos = (0, 1.7999999999999998); text = "0"; size = 0.9; }
draw Text { name = "L3q1"; pos = (a * (b + c), 1.7999999999999998); text = "a · (b + c)"; size = 0.9; }
draw Text { name = "L3r0"; pos = (a, -1.7999999999999998); text = "a"; size = 0.9; }
draw Text { name = "L3r1"; pos = (b, -1.7999999999999998); text = "b"; size = 0.9; }
draw Text { name = "L3r2"; pos = (a + c, -3.0); text = "a + c"; size = 0.9; }
draw Text { name = "L3r3"; pos = (b + c, -3.0); text = "b + c"; size = 0.9; }
new Claster { name = "tabAdd"; elements = (gAdd, L1p0, L1p1, L1p2, L1q0, L1q1, L1q2, L1r0, L1r1, L1r2); active = true }
new Claster { name = "tabMul"; elements = (gMul, L2p1, L2p2, L2q1, L2q2, L2r0, L2r1); active = false }
new Claster { name = "tabDis"; elements = (gDis, L3p0, L3p1, L3p2, L3q0, L3q1, L3r0, L3r1, L3r2, L3r3); active = false }
new UI { name = "bAdd"; type = button; label = "Сложение"; action = "tab = 1; tabAdd.active = true; tabMul.active = false; tabDis.active = false" }
new UI { name = "bMul"; type = button; label = "Умножение"; action = "tab = 2; tabAdd.active = false; tabMul.active = true; tabDis.active = false" }
new UI { name = "bDis"; type = button; label = "Распределительность и порядок"; action = "tab = 3; tabAdd.active = false; tabMul.active = false; tabDis.active = true" }

string info = "";
float first = 0; float tab = 1; float a = 1.5; float b = -1; float c = 1; float ka = 99; float kb = 0; float kc = 0;
Function num(x, d) { if (x < -0.00001) { return "−" + format(-x, d); } return format(abs(x), d); }
Function term(x) { if (x < -0.00001) { return "(−" + format(-x, 1) + ")"; } return format(abs(x), 1); }
// Значение — координата точки на направляющей, без округления: подписи и стрелки
// движутся вместе с точкой плавно (раньше шаг 0,5 давал рывки)
Function fix(P) { return round(100 * P.pos.x) / 100; }
Function nd(g, id, x, y, t) { addNode(g, id, [x, y], t); }
Update {
  a = fix(PA); b = fix(PB); c = fix(PC);
  if (abs(a - ka) + abs(b - kb) + abs(c - kc) > 0.000001 || ka > 50) {
    ka = a; kb = b; kc = c;
    if (first == 0) { first = 1; gt = newGraph(); repeat (11) { float xx = i - 5; addNode(gt, "t" + format(i, 0), [xx, -0.25]); addNode(gt, "u" + format(i, 0), [xx, 0.25]); addEdge(gt, "t" + format(i, 0), "u" + format(i, 0)); } }
    g1 = newGraph(); g2 = newGraph(); g3 = newGraph();
    // сложение: a затем b и b затем a; a затем −a
    nd(g1, "p0", 0, 2.6, "0"); nd(g1, "p1", a, 2.6, "a"); nd(g1, "p2", a + b, 2.6, "a + b"); addEdge(g1, "p0", "p1"); addEdge(g1, "p1", "p2");
    nd(g1, "q0", 0, 1.4, "0"); nd(g1, "q1", b, 1.4, "b"); nd(g1, "q2", a + b, 1.4, "b + a"); addEdge(g1, "q0", "q1", 1, "#f59e0b"); addEdge(g1, "q1", "q2", 1, "#f59e0b");
    nd(g1, "r0", 0, -1.4, "0"); nd(g1, "r1", a, -1.4, "a"); nd(g1, "r2", 0, -2.6, "a + (−a) = 0"); addEdge(g1, "r0", "r1", 1, "#22c55e"); addEdge(g1, "r1", "r2", 1, "#22c55e");
    // умножение: b → a·b и a → b·a; a → a · (1/a)
    nd(g2, "p1", b, 2.6, "b"); nd(g2, "p2", a * b, 2.6, "a · b"); addEdge(g2, "p1", "p2");
    nd(g2, "q1", a, 1.4, "a"); nd(g2, "q2", a * b, 1.4, "b · a"); addEdge(g2, "q1", "q2", 1, "#3b82f6");
    if (abs(a) > 0.1) { nd(g2, "r0", 1 / a, -1.4, "1/a"); nd(g2, "r1", 1, -2.6, "a · (1/a) = 1"); addEdge(g2, "r0", "r1", 1, "#22c55e"); }
    // распределительность и порядок
    nd(g3, "p0", 0, 2.6, "0"); nd(g3, "p1", a * b, 2.6, "a · b"); nd(g3, "p2", a * b + a * c, 2.6, "a·b + a·c"); addEdge(g3, "p0", "p1"); addEdge(g3, "p1", "p2");
    nd(g3, "q0", 0, 1.4, "0"); nd(g3, "q1", a * (b + c), 1.4, "a · (b + c)"); addEdge(g3, "q0", "q1", 1, "#3b82f6");
    nd(g3, "r0", a, -1.4, "a"); nd(g3, "r1", b, -1.4, "b"); nd(g3, "r2", a + c, -2.6, "a + c"); nd(g3, "r3", b + c, -2.6, "b + c");
    addEdge(g3, "r0", "r2", 1, "#f59e0b"); addEdge(g3, "r1", "r3", 1, "#f59e0b");
  }
  if (tab == 1) {
    info = "**Сложение.** Числа a = " + num(a, 1) + ", b = " + num(b, 1) + ", c = " + num(c, 1) + ".\n\n";
    info = info + "**Коммутативность:** a + b = " + num(a + b, 1) + " и b + a = " + num(b + a, 1) + " — два пути по прямой приходят в одну точку.\n\n";
    info = info + "**Ассоциативность:** (a + b) + c = " + num(a + b + c, 1) + ", a + (b + c) = " + num(a + (b + c), 1) + ".\n\n";
    info = info + "**Нуль и противоположное:** a + 0 = " + num(a, 1) + ", a + (−a) = " + num(a + (-a), 1) + ". Вычитание — сложение с противоположным: a − b = a + " + term(-b) + " = " + num(a - b, 1) + ".";
  }
  if (tab == 2) {
    info = "**Умножение.** Числа a = " + num(a, 1) + ", b = " + num(b, 1) + ", c = " + num(c, 1) + ".\n\n";
    info = info + "**Коммутативность:** a · b = " + num(a * b, 2) + " и b · a = " + num(b * a, 2) + ".\n\n";
    info = info + "**Ассоциативность:** (a · b) · c = " + num(a * b * c, 2) + ", a · (b · c) = " + num(a * (b * c), 2) + ".\n\n";
    info = info + "**Единица:** a · 1 = " + num(a, 1) + ". ";
    if (abs(a) < 0.1) { info = info + "**Обратный элемент** есть у любого числа, кроме нуля: у a = 0 обратного нет."; }
    else { info = info + "**Обратный элемент** (только для a ≠ 0): 1/a = " + num(1 / a, 2) + ", a · (1/a) = " + num(a * (1 / a), 2) + ". Деление — умножение на обратное: b : a = " + num(b / a, 2) + "."; }
  }
  if (tab == 3) {
    info = "**Распределительность и порядок.** Числа a = " + num(a, 1) + ", b = " + num(b, 1) + ", c = " + num(c, 1) + ".\n\n";
    info = info + "**Распределительность:** a · (b + c) = " + num(a * (b + c), 2) + " и a · b + a · c = " + num(a * b + a * c, 2) + ".\n\n";
    if (a <= b) { info = info + "**Порядок и сложение:** a ≤ b, поэтому a + c = " + num(a + c, 1) + " ≤ b + c = " + num(b + c, 1) + ".\n\n"; }
    else { info = info + "**Порядок и сложение:** b < a, поэтому b + c = " + num(b + c, 1) + " < a + c = " + num(a + c, 1) + ".\n\n"; }
    if (c > 0 && a <= b) { info = info + "**Порядок и умножение:** c > 0 сохраняет порядок: a · c = " + num(a * c, 2) + " ≤ b · c = " + num(b * c, 2) + "."; }
    if (c > 0 && a > b) { info = info + "**Порядок и умножение:** c > 0 сохраняет порядок: b · c = " + num(b * c, 2) + " < a · c = " + num(a * c, 2) + "."; }
    if (c <= 0) { info = info + "**Порядок и умножение:** для c ≤ 0 умножение на c порядок не сохраняет (a · c = " + num(a * c, 2) + ", b · c = " + num(b * c, 2) + "); аксиома требует c > 0."; }
  }
}
]
