[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Слова из 8 двоичных символов; строки x, y (и z). Клик по клетке меняет символ. ----
draw Graph { name = "gBand"; graph = "gb"; nodeRadius = 0; labels = false; interactive = false; showWeights = false; edgeWidth = 54; edgeCap = butt; layer = 3 }
draw Graph { name = "gZero"; graph = "gz"; nodeRadius = 22; labels = true; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gOne"; graph = "go"; nodeRadius = 22; labels = true; interactive = false; showWeights = false; nodeColor = #3b82f6; layer = 11 }
draw Graph { name = "gXor"; graph = "gx"; nodeRadius = 22; labels = true; interactive = false; showWeights = false; nodeColor = #f59e0b; layer = 11 }
draw Text { name = "lx"; pos = (-8.3, 3.2); text = "x"; size = 1.3 }
draw Text { name = "ly"; pos = (-8.3, 1.2); text = "y"; size = 1.3 }
draw Text { name = "lz"; pos = (-8.3, -0.8); text = "z"; size = 1.3; active = tab == 2 }
draw Text { name = "lxy"; pos = (-8.3, -3.4); text = "x ⊕ y"; size = 1.1; active = tab == 1 }
draw Text { name = "lbl"; pos = (7.9, 3.2); text = "d(x, y) = " + format(dxy, 0); size = 1.1; align = right; active = false }

new UI { name = "btn1"; type = button; label = "Расстояние и ⊕"; action = "tab = 1" }
new UI { name = "btn2"; type = button; label = "Метрика"; action = "tab = 2" }

float tab = 1;
float X = 180; float Y = 157; float Z = 240;
float dxy = 0;
float clicks = 0;
string key = "";
string info = "";

func bitOf(v, j) = floor(v / pow(2, 7 - j)) - 2 * floor(v / pow(2, 8 - j));
func cx(j) = -5.6 + 1.6 * j;
Function word(v) {
  string t = "";
  repeat (8) { t = t + format(bitOf(v, i), 0); }
  return t;
}
Function dist(u, v) {
  float d = 0;
  repeat (8) { if (bitOf(u, i) != bitOf(v, i)) { d = d + 1; } }
  return d;
}
Function diffPos(u, v) {
  string t = "";
  repeat (8) { if (bitOf(u, i) != bitOf(v, i)) { if (t != "") { t = t + ", "; } t = t + format(i + 1, 0); } }
  if (t == "") { return "нет"; }
  return t;
}
Function cell(v, y) {
  repeat (8) {
    string nm = format(y * 10, 0) + "_" + format(i, 0);
    if (bitOf(v, i) == 1) { addNode(go, nm, [cx(i), y], "1"); } else { addNode(gz, nm, [cx(i), y], "0"); }
  }
  return 0;
}

Update {
  if (mouseClickCount != clicks) {
    clicks = mouseClickCount;
    repeat (8) {
      if (abs(mouseClickX - cx(i)) < 0.8) {
        float sg = 0;
        if (abs(mouseClickY - 3.2) < 0.8) { X = X + (1 - 2 * bitOf(X, i)) * pow(2, 7 - i); }
        if (abs(mouseClickY - 1.2) < 0.8) { Y = Y + (1 - 2 * bitOf(Y, i)) * pow(2, 7 - i); }
        if (tab == 2 && abs(mouseClickY + 0.8) < 0.8) { Z = Z + (1 - 2 * bitOf(Z, i)) * pow(2, 7 - i); }
      }
    }
  }
  dxy = dist(X, Y);
  string k2 = format(tab, 0) + "_" + format(X, 0) + "_" + format(Y, 0) + "_" + format(Z, 0);
  if (k2 != key) {
    key = k2;
    gb = newGraph(); gz = newGraph(); go = newGraph(); gx = newGraph();
    cell(X, 3.2); cell(Y, 1.2);
    if (tab == 2) { cell(Z, -0.8); }
    repeat (8) {
      if (bitOf(X, i) != bitOf(Y, i)) {
        addNode(gb, "a" + format(i, 0), [cx(i), 3.9]); addNode(gb, "b" + format(i, 0), [cx(i), 0.5]);
        addEdge(gb, "a" + format(i, 0), "b" + format(i, 0), 1, "#f59e0b44");
      }
      if (tab == 1) {
        float xr = abs(bitOf(X, i) - bitOf(Y, i));
        if (xr == 1) { addNode(gx, "x" + format(i, 0), [cx(i), -3.4], "1"); } else { addNode(gz, "x" + format(i, 0), [cx(i), -3.4], "0"); }
      }
    }
  }
  if (tab == 1) {
    info = "**Расстояние Хэмминга** между словами одинаковой длины — число позиций, в которых символы не совпадают. Для x = " + word(X) + " и y = " + word(Y) + " слова различаются в позициях " + diffPos(X, Y) + " (оранжевые полосы), поэтому \\(d(x, y) = " + format(dxy, 0) + "\\).\n\nДля двоичных слов \\(d(x, y) = w(x \\oplus y)\\): строка \\(x \\oplus y\\) содержит единицу ровно в позициях различия, а вес \\(w\\) — число единиц. Расстояние равно нулю только для совпадающих слов.\n\nЧтобы изменить символ, нажмите на клетку.";
  } else {
    float dyz = dist(Y, Z); float dxz = dist(X, Z);
    info = "**Расстояние Хэмминга — метрика.** Для x = " + word(X) + ", y = " + word(Y) + ", z = " + word(Z) + ": \\(d(x, y) = " + format(dxy, 0) + "\\), \\(d(y, z) = " + format(dyz, 0) + "\\), \\(d(x, z) = " + format(dxz, 0) + "\\).\n\nСимметричность: \\(d(x, y) = d(y, x)\\). Неравенство треугольника: \\(d(x, z) = " + format(dxz, 0) + " \\le d(x, y) + d(y, z) = " + format(dxy + dyz, 0) + "\\) — позиция, где x и z различаются, различна хотя бы в одной из пар x, y или y, z.\n\nЧтобы изменить символ, нажмите на клетку.";
  }
}
]
