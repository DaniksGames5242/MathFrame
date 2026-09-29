[
description = "{info}"

field width = 24;
field height = 9;
camera type = fixed;

// ---- Каждому знаку — свой иероглиф (упрощённые контуры): черта, дуга, спираль, лотос, палец, головастик, человек.
// Число складывается из знаков — их место и порядок значения не имеют. ----
draw Graph { name = "gG"; graph = "gg"; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Text { name = "t0"; pos = (px[0], -2.6); text = lb(0); size = 0.8; active = px[0] > -50 }
draw Text { name = "t1"; pos = (px[1], -2.6); text = lb(1); size = 0.8; active = px[1] > -50 }
draw Text { name = "t2"; pos = (px[2], -2.6); text = lb(2); size = 0.8; active = px[2] > -50 }
draw Text { name = "t3"; pos = (px[3], -2.6); text = lb(3); size = 0.8; active = px[3] > -50 }
draw Text { name = "t4"; pos = (px[4], -2.6); text = lb(4); size = 0.8; active = px[4] > -50 }
draw Text { name = "t5"; pos = (px[5], -2.6); text = lb(5); size = 0.8; active = px[5] > -50 }
draw Text { name = "t6"; pos = (px[6], -2.6); text = lb(6); size = 0.8; active = px[6] > -50 }

new UI { name = "sN"; type = slider; label = "число"; variable = N; min = 1; max = 9999999; step = 1; default = 2345 }
new UI { name = "sO"; type = select; label = "порядок знаков"; variable = od; options = ("desc", "asc", "mix"); labels = ("от большего к меньшему", "от меньшего к большему", "как попало"); default = "desc" }

// ---- Логика ----
float N = 2345; string od = "desc"; float key = -1; float cn = 0; string info = "";
list px = [-100, -100, -100, -100, -100, -100, -100];
list mk = [3, 0, 5, 1, 6, 2, 4];

Function dg(k) { float q = floor(N / pow(10, k)); return q - 10 * floor(q / 10); }
Function ord(k) { if (od == "desc") { return 6 - k; } if (od == "asc") { return k; } return mk[k]; }
Function rk(k) { float r = 0; repeat (7) { if (dg(i) > 0 && ord(i) < ord(k)) { r = r + 1; } } return r; }
Function lb(k) { return format(dg(k), 0) + " × " + format(pow(10, k), 0); }
Function seg(x1, y1, x2, y2) {
  addNode(gg, "n" + format(cn, 0), [x1, y1]); addNode(gg, "m" + format(cn, 0), [x2, y2]); addEdge(gg, "n" + format(cn, 0), "m" + format(cn, 0)); cn = cn + 1;
}
// дуга/окружность: центр, радиус, углы в градусах, 8 шагов
Function arc(x, y, r, a0, a1) {
  repeat (8) { float t0 = (a0 + (a1 - a0) * i / 8) * 3.14159265 / 180; float t1 = (a0 + (a1 - a0) * (i + 1) / 8) * 3.14159265 / 180;
    seg(x + r * cos(t0), y + r * sin(t0), x + r * cos(t1), y + r * sin(t1)); }
}
Function glyph(k, x, y) {
  if (k == 0) { seg(x, y - 0.45, x, y + 0.45); }
  if (k == 1) { seg(x - 0.4, y - 0.4, x - 0.4, y); arc(x, y, 0.4, 180, 0); seg(x + 0.4, y, x + 0.4, y - 0.4); }
  if (k == 2) { repeat (12) { float a = i * 0.9; float b = (i + 1) * 0.9; float r0 = 0.04 + 0.032 * i; float r1 = 0.04 + 0.032 * (i + 1);
      seg(x + r0 * cos(a), y + r0 * sin(a), x + r1 * cos(b), y + r1 * sin(b)); } }
  if (k == 3) { seg(x, y - 0.45, x, y + 0.05); seg(x, y + 0.05, x - 0.35, y + 0.4); seg(x, y + 0.05, x, y + 0.5); seg(x, y + 0.05, x + 0.35, y + 0.4); }
  if (k == 4) { seg(x - 0.2, y - 0.45, x - 0.2, y + 0.1); seg(x - 0.2, y + 0.1, x + 0.1, y + 0.4); seg(x + 0.1, y + 0.4, x + 0.25, y + 0.1); }
  if (k == 5) { arc(x, y + 0.25, 0.2, 0, 360); seg(x, y + 0.05, x + 0.15, y - 0.2); seg(x + 0.15, y - 0.2, x - 0.15, y - 0.45); }
  if (k == 6) { arc(x, y + 0.38, 0.1, 0, 360); seg(x, y + 0.28, x, y - 0.12); seg(x - 0.3, y + 0.42, x, y + 0.12); seg(x, y + 0.12, x + 0.3, y + 0.42);
    seg(x, y - 0.12, x - 0.2, y - 0.45); seg(x, y - 0.12, x + 0.25, y - 0.3); seg(x + 0.25, y - 0.3, x + 0.25, y - 0.45); }
}

Update {
  float oc = 0; if (od == "asc") { oc = 1; } if (od == "mix") { oc = 2; }
  if (key != N * 10 + oc) {
    gg = newGraph(); cn = 0;
    repeat (7) { float k = i; if (dg(k) > 0) { px[k] = -10.4 + 3.2 * rk(k); } else { px[k] = -100; }
      repeat (dg(k)) { float j = i; glyph(k, px[k] + (j - 3 * floor(j / 3) - 1) * 0.85, 1.3 - 1.15 * floor(j / 3)); } }
    string s = ""; float tot = 0; float sg = 0; float zr = 0;
    repeat (7) { float k = 6 - i; if (dg(k) > 0) { if (tot > 0) { s = s + " + "; } s = s + format(dg(k), 0) + " · " + format(pow(10, k), 0); tot = tot + 1; sg = sg + dg(k); } }
    repeat (7) { if (dg(i) == 0 && pow(10, i) < N) { zr = zr + 1; } }
    info = "**" + format(N, 0) + " = " + s + ".** Знаков в записи: **" + format(sg, 0) + "**. Значение — сумма значений знаков, поэтому порядок групп можно менять (**непозиционность**).";
    if (zr > 0) { info = info + "\n\nВ числе есть пустые разряды (" + format(zr, 0) + "): знака нуля нет, такой разряд просто не пишется."; }
    info = info + "\n\nЗнаки: черта — 1, дуга — 10, спираль — 100, лотос — 1000, палец — 10 000, головастик — 100 000, человек — 1 000 000.";
    key = N * 10 + oc;
  }
}
]
