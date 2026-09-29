[
description = "{info}"

field width = 18;
field height = 12;
camera type = fixed;

// ---- Столбик разрядов: младший внизу. Черта — 5 (толстые линии), точка — 1, ракушка — ноль. ----
draw Graph { name = "gB"; graph = "gb"; edgeWidth = 9; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gD"; graph = "gd"; nodeColor = #f59e0b; nodeRadius = 9; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gZ"; graph = "gz"; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gF"; graph = "gf"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Text { name = "w0"; pos = (-6.5, ry(0)); text = "× " + format(wt(0), 0); size = 1; align = right; active = 0 < np }
draw Text { name = "w1"; pos = (-6.5, ry(1)); text = "× " + format(wt(1), 0); size = 1; align = right; active = 1 < np }
draw Text { name = "w2"; pos = (-6.5, ry(2)); text = "× " + format(wt(2), 0); size = 1; align = right; active = 2 < np }
draw Text { name = "w3"; pos = (-6.5, ry(3)); text = "× " + format(wt(3), 0); size = 1; align = right; active = 3 < np }
draw Text { name = "w4"; pos = (-6.5, ry(4)); text = "× " + format(wt(4), 0); size = 1; align = right; active = 4 < np }
draw Text { name = "v0"; pos = (6.5, ry(0)); text = "= " + format(dg(0) * wt(0), 0); size = 1; align = left; active = 0 < np }
draw Text { name = "v1"; pos = (6.5, ry(1)); text = "= " + format(dg(1) * wt(1), 0); size = 1; align = left; active = 1 < np }
draw Text { name = "v2"; pos = (6.5, ry(2)); text = "= " + format(dg(2) * wt(2), 0); size = 1; align = left; active = 2 < np }
draw Text { name = "v3"; pos = (6.5, ry(3)); text = "= " + format(dg(3) * wt(3), 0); size = 1; align = left; active = 3 < np }
draw Text { name = "v4"; pos = (6.5, ry(4)); text = "= " + format(dg(4) * wt(4), 0); size = 1; align = left; active = 4 < np }

new UI { name = "sN"; type = slider; label = "число"; variable = N; min = 0; max = 143999; step = 1; default = 1876 }
new UI { name = "sB"; type = select; label = "второй разряд"; variable = b2; options = ("18", "20"); labels = ("18 (майя)", "20 (чисто вигесимально)"); default = "18" }

// ---- Логика ----
float N = 1876; string b2 = "18"; float key = -1; float np = 1; string info = "";
list ds = [0, 0, 0, 0, 0];

Function w2() { if (b2 == "18") { return 18; } return 20; }
Function wt(k) { if (k == 0) { return 1; } if (k == 1) { return 20; } return 20 * w2() * pow(20, k - 2); }
Function ry(k) { return -4.4 + 2.2 * k; }
Function dg(k) { return ds[k]; }

Update {
  float bc = 0; if (b2 == "20") { bc = 1; }
  if (key != N * 10 + bc) {
    // разряды: из старшего к младшему
    float r = N; float k = 4;
    repeat (5) { float q = floor(r / wt(k)); ds[k] = q; r = r - q * wt(k); k = k - 1; }
    np = 1; repeat (4) { if (ds[4 - i] > 0 && np < 5 - i) { np = 5 - i; } }
    gb = newGraph(); gd = newGraph(); gz = newGraph(); gf = newGraph();
    repeat (5) { float p = i; float d = ds[p]; float y = ry(p);
      if (p < np) {
        addNode(gf, "f" + format(p, 0) + "a", [-6.4, y - 1.1]); addNode(gf, "f" + format(p, 0) + "b", [6.4, y - 1.1]); addEdge(gf, "f" + format(p, 0) + "a", "f" + format(p, 0) + "b");
        if (d == 0) {
          repeat (12) { float t0 = i * 0.5236; float t1 = (i + 1) * 0.5236; addNode(gz, "z" + format(p, 0) + "_" + format(i, 0), [1.1 * cos(t0), y + 0.5 * sin(t0)]); addNode(gz, "y" + format(p, 0) + "_" + format(i, 0), [1.1 * cos(t1), y + 0.5 * sin(t1)]); addEdge(gz, "z" + format(p, 0) + "_" + format(i, 0), "y" + format(p, 0) + "_" + format(i, 0)); }
          addNode(gz, "c" + format(p, 0) + "a", [-0.55, y]); addNode(gz, "c" + format(p, 0) + "b", [0.55, y]); addEdge(gz, "c" + format(p, 0) + "a", "c" + format(p, 0) + "b");
        } else {
          float nb = floor(d / 5); float nd = d - 5 * nb;
          repeat (nb) { addNode(gb, "b" + format(p, 0) + "_" + format(i, 0) + "a", [-1.4, y + 0.85 - 0.42 * i]); addNode(gb, "b" + format(p, 0) + "_" + format(i, 0) + "b", [1.4, y + 0.85 - 0.42 * i]); addEdge(gb, "b" + format(p, 0) + "_" + format(i, 0) + "a", "b" + format(p, 0) + "_" + format(i, 0) + "b"); }
          repeat (nd) { addNode(gd, "d" + format(p, 0) + "_" + format(i, 0), [(i - (nd - 1) / 2) * 0.7, y - 0.55]); }
        }
      }
    }
    key = N * 10 + bc;
  }
  string s = ""; float tot = 0;
  repeat (5) { float k = 4 - i; if (ds[k] > 0) { if (tot > 0) { s = s + " + "; } s = s + format(ds[k], 0) + " · " + format(wt(k), 0); tot = tot + 1; } }
  if (tot == 0) { s = "0"; }
  info = "**" + format(N, 0) + " = " + s + ".** Веса разрядов снизу вверх: 1, 20, " + format(20 * w2(), 0) + ", " + format(20 * w2() * 20, 0) + ", " + format(20 * w2() * 400, 0) + ". Цифра каждого разряда — от 0 до 19: черта — 5, точка — 1 (не более трёх черт и четырёх точек), пустой разряд — знак ноля.";
  if (b2 == "18") { info = info + "\n\nСо второго разряда вместо 20 берётся **18**: 20 · 18 = 360 — календарный год, поэтому система лишь **полупозиционная**."; }
  else { info = info + "\n\nПри основании 20 во всех разрядах (чисто вигесимальная запись) веса были бы степенями 20. У майя второй разряд весит 18 · 20."; }
}
]
