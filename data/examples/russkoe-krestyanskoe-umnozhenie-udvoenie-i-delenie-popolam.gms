[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Слева число a делят пополам (остаток отбрасывают), справа b удваивают, пока слева не станет 1.
// Зелёные строки — с нечётным a: именно их правые числа складываются. ----
draw Graph { name = "gO"; graph = "go"; edgeColor = #22c55e44; edgeWidth = 30; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gX"; graph = "gx"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Text { name = "ha"; pos = (-3.6, 4.5); text = "a ÷ 2"; size = 1; align = center }
draw Text { name = "hb"; pos = (1.6, 4.5); text = "b · 2"; size = 1; align = center }
draw Text { name = "hc"; pos = (5.6, 4.5); text = "слагаемое"; size = 1; align = center }
draw Text { name = "sum"; pos = (5.6, -3.4); text = "Σ = " + format(tot, 0); size = 1.4; layer = 20 }
draw Text { name = "ra0"; pos = (-3.6, 3.5); text = cell(la, 0); size = 1.3; layer = 20; active = 0 < rows }
draw Text { name = "rb0"; pos = (1.6, 3.5); text = cell(lb, 0); size = 1.3; layer = 20; active = 0 < rows }
draw Text { name = "rc0"; pos = (5.6, 3.5); text = take(0); size = 1.3; layer = 20; active = 0 < rows }
draw Text { name = "ra1"; pos = (-3.6, 2.6); text = cell(la, 1); size = 1.3; layer = 20; active = 1 < rows }
draw Text { name = "rb1"; pos = (1.6, 2.6); text = cell(lb, 1); size = 1.3; layer = 20; active = 1 < rows }
draw Text { name = "rc1"; pos = (5.6, 2.6); text = take(1); size = 1.3; layer = 20; active = 1 < rows }
draw Text { name = "ra2"; pos = (-3.6, 1.7); text = cell(la, 2); size = 1.3; layer = 20; active = 2 < rows }
draw Text { name = "rb2"; pos = (1.6, 1.7); text = cell(lb, 2); size = 1.3; layer = 20; active = 2 < rows }
draw Text { name = "rc2"; pos = (5.6, 1.7); text = take(2); size = 1.3; layer = 20; active = 2 < rows }
draw Text { name = "ra3"; pos = (-3.6, 0.8); text = cell(la, 3); size = 1.3; layer = 20; active = 3 < rows }
draw Text { name = "rb3"; pos = (1.6, 0.8); text = cell(lb, 3); size = 1.3; layer = 20; active = 3 < rows }
draw Text { name = "rc3"; pos = (5.6, 0.8); text = take(3); size = 1.3; layer = 20; active = 3 < rows }
draw Text { name = "ra4"; pos = (-3.6, -0.1); text = cell(la, 4); size = 1.3; layer = 20; active = 4 < rows }
draw Text { name = "rb4"; pos = (1.6, -0.1); text = cell(lb, 4); size = 1.3; layer = 20; active = 4 < rows }
draw Text { name = "rc4"; pos = (5.6, -0.1); text = take(4); size = 1.3; layer = 20; active = 4 < rows }
draw Text { name = "ra5"; pos = (-3.6, -1.0); text = cell(la, 5); size = 1.3; layer = 20; active = 5 < rows }
draw Text { name = "rb5"; pos = (1.6, -1.0); text = cell(lb, 5); size = 1.3; layer = 20; active = 5 < rows }
draw Text { name = "rc5"; pos = (5.6, -1.0); text = take(5); size = 1.3; layer = 20; active = 5 < rows }
draw Text { name = "ra6"; pos = (-3.6, -1.9); text = cell(la, 6); size = 1.3; layer = 20; active = 6 < rows }
draw Text { name = "rb6"; pos = (1.6, -1.9); text = cell(lb, 6); size = 1.3; layer = 20; active = 6 < rows }
draw Text { name = "rc6"; pos = (5.6, -1.9); text = take(6); size = 1.3; layer = 20; active = 6 < rows }

new UI { name = "sA"; type = slider; label = "a"; variable = a; min = 1; max = 99; step = 1; default = 45 }
new UI { name = "sB"; type = slider; label = "b"; variable = b; min = 1; max = 99; step = 1; default = 37 }

// ---- Логика ----
float a = 45; float b = 37; float rows = 6; float tot = 0; float key = -1;
list la = (0, 0, 0, 0, 0, 0, 0);
list lb = (0, 0, 0, 0, 0, 0, 0);
string info = "";

Function md2(q) { return q - 2 * floor(q / 2); }
Function cell(l, k) { return format(l[k], 0); }
Function take(k) { if (md2(la[k]) == 1) { return "+ " + format(lb[k], 0); } return "—"; }

Update {
  if (a * 1000 + b != key) {
    key = a * 1000 + b;
    float x = a; float y = b; rows = 0; tot = 0;
    string bits = ""; string terms = ""; string pw = "";
    repeat (7) {
      if (x >= 1) {
        la[i] = x; lb[i] = y; rows = rows + 1;
        if (md2(x) == 1) { tot = tot + y; if (terms != "") { terms = terms + " + "; } terms = terms + format(y, 0); }
        x = floor(x / 2); y = 2 * y;
      }
    }
    go = newGraph(); gx = newGraph();
    addNode(gx, "h1", [-6.8, 3.95]); addNode(gx, "h2", [6.8, 3.95]); addEdge(gx, "h1", "h2");
    addNode(gx, "s1", [-6.8, -2.6]); addNode(gx, "s2", [6.8, -2.6]); addEdge(gx, "s1", "s2");
    repeat (rows) { if (md2(la[i]) == 1) { addNode(go, "o" + format(i, 0) + "a", [-6.8, 3.5 - 0.9 * i]); addNode(go, "o" + format(i, 0) + "b", [6.8, 3.5 - 0.9 * i]); addEdge(go, "o" + format(i, 0) + "a", "o" + format(i, 0) + "b"); } }
    // двоичная запись a: a = 2^k1 + 2^k2 + ...
    string bin = ""; float t = a; float ones = 0;
    repeat (rows) { bin = format(md2(t), 0) + bin; t = floor(t / 2); }
    string sp = ""; float w = 1; float z = a;
    repeat (rows) { if (md2(z) == 1) { if (sp != "") { sp = " + " + sp; } sp = format(w, 0) + sp; } z = floor(z / 2); w = 2 * w; }
    info = "**Русское крестьянское умножение** a · b = " + format(a, 0) + " · " + format(b, 0) + ". Число a делят пополам с отбрасыванием остатка, число b удваивают — пока слева не получится 1. Складывают правые числа тех строк, где слева нечётное: " + terms + " = " + format(tot, 0) + " — это и есть a · b.";
    info = info + "\n\n**Почему это верно.** Остаток при делении пополам — младшая цифра двоичной записи: a = " + format(a, 0) + " = " + bin + "₂ = " + sp + ". Нечётные строки — это единицы двоичной записи, и сумма выбранных удвоений b — это a · b = (" + sp + ") · b по дистрибутивности. Пара (a, b) на каждом шаге заменяется на (a ÷ 2, 2b): при чётном a произведение не меняется, а при нечётном теряется ровно одно слагаемое b — оно и записывается в сумму.";
  }
}
]
