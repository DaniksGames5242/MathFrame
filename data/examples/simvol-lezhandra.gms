[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Вычеты 0…p−1 по кругу. Стрелки-рёбра x — x² mod p: в каждый квадратичный вычет ведут
// ровно два ребра (от x и от −x), в невычет — ни одного. Зелёные — вычеты, жёлтые — невычеты,
// нуль без цвета; синее кольцо — выбранное a. ----
draw Graph { name = "gE"; graph = "ge"; edgeColor = #3b82f677; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gH"; graph = "gh"; edgeWidth = 4; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gS"; graph = "gs"; nodeColor = #3b82f6; nodeRadius = 22; labels = false; interactive = false; showWeights = false; layer = 7 }
draw Graph { name = "gR"; graph = "gr"; nodeColor = #22c55e; nodeRadius = 14; labels = true; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gN"; graph = "gn"; nodeColor = #f59e0b; nodeRadius = 14; labels = true; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gZ"; graph = "gz"; nodeRadius = 14; labels = true; interactive = false; showWeights = false; layer = 10 }

new UI { type = slider; label = "простое p"; variable = pj; min = 0; max = 9; step = 1; default = 4; showValue = false }
new UI { type = slider; label = "a"; variable = a; min = 0; max = p - 1; step = 1; default = 3 }
new UI { type = slider; label = "b"; variable = b; min = 1; max = p - 1; step = 1; default = 5 }

float pj = 4; float p = 13; float a = 3; float b = 5;
float key1 = -1; float key2 = -1; string info = "";

Function pr(j) {
  if (j == 0) { return 3; } if (j == 1) { return 5; } if (j == 2) { return 7; } if (j == 3) { return 11; } if (j == 4) { return 13; }
  if (j == 5) { return 17; } if (j == 6) { return 19; } if (j == 7) { return 23; } if (j == 8) { return 29; } return 31;
}
Function md(x, q) { return x - q * floor(x / q); }
Function pw(x, e) { float r = 1; repeat (e) { r = md(r * x, p); } return r; }
// символ Лежандра по критерию Эйлера
Function leg(x) {
  float r = pw(md(x, p), (p - 1) / 2);
  if (r == 0) { return 0; } if (r == 1) { return 1; } return -1;
}
Function sg(v) { if (v < 0) { return "−1"; } return format(v, 0); }
Function px(x) { return 4 * sin(6.2831853 * x / p); }
Function py(x) { return 4 * cos(6.2831853 * x / p); }

Update {
  p = pr(pj);
  if (key1 != p) {
    ge = newGraph(); gr = newGraph(); gn = newGraph(); gz = newGraph();
    repeat (p) {
      string kn = "n" + format(i, 0);
      if (i == 0) { addNode(gz, kn, [px(i), py(i)], "0"); }
      if (i > 0 && leg(i) == 1) { addNode(gr, kn, [px(i), py(i)], format(i, 0)); }
      if (i > 0 && leg(i) == -1) { addNode(gn, kn, [px(i), py(i)], format(i, 0)); }
      float q = md(i * i, p);
      if (i > 0 && q != i) { addNode(ge, "u" + format(i, 0), [px(i), py(i)]); addNode(ge, "w" + format(i, 0), [px(q), py(q)]); addEdge(ge, "u" + format(i, 0), "w" + format(i, 0)); }
    }
    key1 = p; key2 = -1;
  }
  if (key2 != p * 1000 + a * 40 + b) {
    gh = newGraph(); gs = newGraph();
    addNode(gs, "s", [px(a), py(a)]);
    float col = 0; string cc = "#f59e0b"; if (leg(a) == 1) { cc = "#22c55e"; }
    repeat (p) { if (i > 0 && md(i * i, p) == a && md(i * i, p) != i) { addNode(gh, "u" + format(i, 0), [px(i), py(i)]); addNode(gh, "w" + format(i, 0), [px(a), py(a)]); addEdge(gh, "u" + format(i, 0), "w" + format(i, 0), 1, cc); } }
    key2 = p * 1000 + a * 40 + b;
  }
  string rs = ""; string ns = ""; string xs = "";
  repeat (p - 1) {
    float x = i + 1;
    if (leg(x) == 1) { rs = rs + format(x, 0) + " "; } if (leg(x) == -1) { ns = ns + format(x, 0) + " "; }
    if (md(x * x, p) == a) { xs = xs + format(x, 0) + " "; }
  }
  float la = leg(a); float lb = leg(b); float lab = leg(a * b);
  float e = pw(a, (p - 1) / 2);
  info = "**Символ Лежандра (a/p)** при p = **" + format(p, 0) + "** и a = " + format(a, 0) + ": (" + format(a, 0) + "/" + format(p, 0) + ") = **" + sg(la) + "**. ";
  if (la == 0) { info = info + "Число a делится на p."; }
  if (la == 1) { info = info + "Это квадратичный вычет: x² ≡ " + format(a, 0) + " (mod " + format(p, 0) + ") при x = " + xs + "— в вершину " + format(a, 0) + " ведут два ребра."; }
  if (la == -1) { info = info + "Это невычет: сравнение x² ≡ " + format(a, 0) + " (mod " + format(p, 0) + ") не имеет решений — в вершину " + format(a, 0) + " рёбер нет."; }
  info = info + " По критерию Эйлера a^((p−1)/2) = " + format(a, 0) + "^" + format((p - 1) / 2, 0) + " ≡ " + format(e, 0) + (e == p - 1 ? " ≡ −1" : "") + " (mod " + format(p, 0) + ").\n\n";
  info = info + "Вычеты (их (p−1)/2 = " + format((p - 1) / 2, 0) + "): " + rs + "\nНевычеты: " + ns + "\n\n";
  info = info + "Мультипликативность: (" + format(a, 0) + "/" + format(p, 0) + ")·(" + format(b, 0) + "/" + format(p, 0) + ") = " + sg(la) + "·(" + sg(lb) + ") = " + sg(la * lb) + " = (" + format(a * b, 0) + "/" + format(p, 0) + ") = (" + format(md(a * b, p), 0) + "/" + format(p, 0) + ") = " + sg(lab) + ".";
}
]
