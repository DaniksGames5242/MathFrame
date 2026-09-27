[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Прямоугольник 0 < x < p/2, 0 < y < q/2 и его целые точки. Диагональ y = qx/p делит
// их на A точек под ней (синие) и B над ней (оранжевые); на самой диагонали точек нет. ----
new Point { name = "R0"; pos = (0, 0); dynamic = false; collision = false; size = 0.5 }
new Point { name = "R1"; pos = (1, 0); dynamic = false; collision = false; active = false }
new Point { name = "R2"; pos = (1, 1); dynamic = false; collision = false; size = 0.5 }
new Point { name = "R3"; pos = (0, 1); dynamic = false; collision = false; active = false }
new Line { name = "r01"; pos = (R0, R1); thickness = 1.5; interact = false }
new Line { name = "r12"; pos = (R1, R2); thickness = 1; interact = false }
new Line { name = "r23"; pos = (R2, R3); thickness = 1; interact = false }
new Line { name = "r30"; pos = (R3, R0); thickness = 1.5; interact = false }
new Line { name = "dg"; pos = (R0, R2); color = #ef4444; thickness = 2.5; interact = false }
draw Graph { name = "gA"; graph = "ga"; nodeColor = #3b82f6; nodeRadius = 7; labels = false; interactive = false; showWeights = false; layer = 20 }
draw Graph { name = "gB"; graph = "gb"; nodeColor = #f59e0b; nodeRadius = 7; labels = false; interactive = false; showWeights = false; layer = 20 }
draw Text { name = "tx"; pos = (R1.pos.x, R1.pos.y - 0.45); text = "p/2 = " + format(p / 2, 1); size = 1 }
draw Text { name = "ty"; pos = (R3.pos.x - 0.9, R3.pos.y); text = "q/2 = " + format(q / 2, 1); size = 1 }
draw Text { name = "td"; pos = (R2.pos.x + 0.8, R2.pos.y + 0.2); text = "y = qx/p"; color = #ef4444; size = 1 }

new UI { name = "sP"; type = select; label = "p"; variable = p; options = (3, 5, 7, 11, 13, 17, 19, 23); default = 11 }
new UI { name = "sQ"; type = select; label = "q"; variable = q; options = (3, 5, 7, 11, 13, 17, 19, 23); default = 7 }

// ---- Логика ----
float p = 11; float q = 7;
float key = -1;
float A = 0; float B = 0; float lp = 0; float lq = 0;
float s = 1; float ox = 0; float oy = 0;
string info = "";

Function md(a, m) { return a - floor(a / m) * m; }
// a^e mod m
Function pw(a, e, m) { float r = 1; float b = md(a, m); repeat (e) { r = md(r * b, m); } return r; }
// Символ Лежандра по критерию Эйлера: ±1
Function leg(a, m) { if (pw(a, (m - 1) / 2, m) == 1) { return 1; } return -1; }
Function sg(v) { if (v > 0) { return "+1"; } return "−1"; }
Function par(v) { if (md(v, 2) == 0) { return "чётно"; } return "нечётно"; }

Update {
  if (p * 100 + q != key) {
    float h = (p - 1) / 2; float k = (q - 1) / 2;
    s = min(12 / (p / 2), 7.6 / (q / 2));
    ox = -s * p / 4; oy = -s * q / 4 - 0.2;
    R0.pos.x = ox; R0.pos.y = oy; R1.pos.x = ox + s * p / 2; R1.pos.y = oy;
    R2.pos.x = ox + s * p / 2; R2.pos.y = oy + s * q / 2; R3.pos.x = ox; R3.pos.y = oy + s * q / 2;
    ga = newGraph(); gb = newGraph(); A = 0; B = 0;
    repeat (h) { float x = i + 1; repeat (k) { float y = i + 1;
      string nm = format(x, 0) + "_" + format(y, 0);
      if (y * p < q * x) { addNode(ga, nm, [ox + s * x, oy + s * y]); A = A + 1; }
      else { addNode(gb, nm, [ox + s * x, oy + s * y]); B = B + 1; }
    } }
    if (p != q) { lp = leg(q, p); lq = leg(p, q); }
    key = p * 100 + q;
  }
  info = "**Закон квадратичной взаимности:** для различных нечётных простых p и q символы Лежандра связаны равенством (p/q)·(q/p) = (−1)^(((p−1)/2)·((q−1)/2)). Значит, q — квадрат по модулю p тогда и только тогда, когда p — квадрат по модулю q, кроме случая p ≡ q ≡ 3 (mod 4), когда ровно одно из двух верно.\n\n**Доказательство Эйзенштейна:** (q/p) = (−1)^A, где A — число целых точек прямоугольника под диагональю, а (p/q) = (−1)^B, где B — число точек над ней. Всего точек A + B = ((p−1)/2)·((q−1)/2), откуда и получается закон.\n\n";
  if (p == q) { info = info + "Выберите два различных простых числа."; }
  else {
    info = info + "p = " + format(p, 0) + ", q = " + format(q, 0) + ":   A = " + format(A, 0) + " (" + par(A) + "), (q/p) = " + sg(lp) + ";   B = " + format(B, 0) + " (" + par(B) + "), (p/q) = " + sg(lq) + ";   A + B = " + format((p - 1) / 2, 0) + "·" + format((q - 1) / 2, 0) + " = " + format(A + B, 0) + ", (p/q)(q/p) = " + sg(lp * lq) + ".";
    info = info + " Символы вычислены независимо, по критерию Эйлера (a/p) ≡ a^((p−1)/2) (mod p).";
  }
}
]
