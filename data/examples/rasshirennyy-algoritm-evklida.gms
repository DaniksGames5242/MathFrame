[
description = "{info}"
field width = 16; field height = 9;
camera type = fixed;
float a = 168; float b = 46; float t = 0; float key = -1; float nr = 0; float gg = 1; float xg = 0; float yg = 0; string info = "";
new UI { type = slider; label = "a"; variable = a; min = 1; max = 200; step = 1; default = 168 }
new UI { type = slider; label = "b"; variable = b; min = 1; max = 200; step = 1; default = 46 }
new UI { type = slider; label = "t"; variable = t; min = -4; max = 4; step = 1; default = 0 }
list rs = [0]; list qs = [0]; list xs = [0]; list ys = [0];
Function md(x, y) { return x - y * floor(x / y); }
Function num(x) { if (x < 0) { return "−" + format(-x, 0); } return format(x, 0); }
Function par(x) { if (x < 0) { return "(−" + format(-x, 0) + ")"; } return format(x, 0); }
Function cell(k, c) {
  if (c == 0) { return format(k, 0); }
  if (c == 1) { return format(rs[k], 0); }
  if (c == 2) { if (k == 0 || k == 1) { return "—"; } return format(qs[k], 0); }
  if (c == 3) { return num(xs[k]); }
  return num(ys[k]);
}
Function cx(c) { return -4.5 + 2.3 * c; }
Function cy(k) { return 3.3 - 0.6 * k; }
draw Text { name = "h0"; pos = (cx(0), 4.1); text = "k"; size = 1 }
draw Text { name = "h1"; pos = (cx(1), 4.1); text = "rₖ"; size = 1 }
draw Text { name = "h2"; pos = (cx(2), 4.1); text = "qₖ"; size = 1 }
draw Text { name = "h3"; pos = (cx(3), 4.1); text = "xₖ"; size = 1 }
draw Text { name = "h4"; pos = (cx(4), 4.1); text = "yₖ"; size = 1 }
draw Text { name = "c0_0"; pos = (cx(0), cy(0)); text = cell(0, 0); size = 0.95; active = 0 < nr }
draw Text { name = "c0_1"; pos = (cx(1), cy(0)); text = cell(0, 1); size = 0.95; active = 0 < nr }
draw Text { name = "c0_2"; pos = (cx(2), cy(0)); text = cell(0, 2); size = 0.95; active = 0 < nr }
draw Text { name = "c0_3"; pos = (cx(3), cy(0)); text = cell(0, 3); size = 0.95; active = 0 < nr }
draw Text { name = "c0_4"; pos = (cx(4), cy(0)); text = cell(0, 4); size = 0.95; active = 0 < nr }
draw Text { name = "c1_0"; pos = (cx(0), cy(1)); text = cell(1, 0); size = 0.95; active = 1 < nr }
draw Text { name = "c1_1"; pos = (cx(1), cy(1)); text = cell(1, 1); size = 0.95; active = 1 < nr }
draw Text { name = "c1_2"; pos = (cx(2), cy(1)); text = cell(1, 2); size = 0.95; active = 1 < nr }
draw Text { name = "c1_3"; pos = (cx(3), cy(1)); text = cell(1, 3); size = 0.95; active = 1 < nr }
draw Text { name = "c1_4"; pos = (cx(4), cy(1)); text = cell(1, 4); size = 0.95; active = 1 < nr }
draw Text { name = "c2_0"; pos = (cx(0), cy(2)); text = cell(2, 0); size = 0.95; active = 2 < nr }
draw Text { name = "c2_1"; pos = (cx(1), cy(2)); text = cell(2, 1); size = 0.95; active = 2 < nr }
draw Text { name = "c2_2"; pos = (cx(2), cy(2)); text = cell(2, 2); size = 0.95; active = 2 < nr }
draw Text { name = "c2_3"; pos = (cx(3), cy(2)); text = cell(2, 3); size = 0.95; active = 2 < nr }
draw Text { name = "c2_4"; pos = (cx(4), cy(2)); text = cell(2, 4); size = 0.95; active = 2 < nr }
draw Text { name = "c3_0"; pos = (cx(0), cy(3)); text = cell(3, 0); size = 0.95; active = 3 < nr }
draw Text { name = "c3_1"; pos = (cx(1), cy(3)); text = cell(3, 1); size = 0.95; active = 3 < nr }
draw Text { name = "c3_2"; pos = (cx(2), cy(3)); text = cell(3, 2); size = 0.95; active = 3 < nr }
draw Text { name = "c3_3"; pos = (cx(3), cy(3)); text = cell(3, 3); size = 0.95; active = 3 < nr }
draw Text { name = "c3_4"; pos = (cx(4), cy(3)); text = cell(3, 4); size = 0.95; active = 3 < nr }
draw Text { name = "c4_0"; pos = (cx(0), cy(4)); text = cell(4, 0); size = 0.95; active = 4 < nr }
draw Text { name = "c4_1"; pos = (cx(1), cy(4)); text = cell(4, 1); size = 0.95; active = 4 < nr }
draw Text { name = "c4_2"; pos = (cx(2), cy(4)); text = cell(4, 2); size = 0.95; active = 4 < nr }
draw Text { name = "c4_3"; pos = (cx(3), cy(4)); text = cell(4, 3); size = 0.95; active = 4 < nr }
draw Text { name = "c4_4"; pos = (cx(4), cy(4)); text = cell(4, 4); size = 0.95; active = 4 < nr }
draw Text { name = "c5_0"; pos = (cx(0), cy(5)); text = cell(5, 0); size = 0.95; active = 5 < nr }
draw Text { name = "c5_1"; pos = (cx(1), cy(5)); text = cell(5, 1); size = 0.95; active = 5 < nr }
draw Text { name = "c5_2"; pos = (cx(2), cy(5)); text = cell(5, 2); size = 0.95; active = 5 < nr }
draw Text { name = "c5_3"; pos = (cx(3), cy(5)); text = cell(5, 3); size = 0.95; active = 5 < nr }
draw Text { name = "c5_4"; pos = (cx(4), cy(5)); text = cell(5, 4); size = 0.95; active = 5 < nr }
draw Text { name = "c6_0"; pos = (cx(0), cy(6)); text = cell(6, 0); size = 0.95; active = 6 < nr }
draw Text { name = "c6_1"; pos = (cx(1), cy(6)); text = cell(6, 1); size = 0.95; active = 6 < nr }
draw Text { name = "c6_2"; pos = (cx(2), cy(6)); text = cell(6, 2); size = 0.95; active = 6 < nr }
draw Text { name = "c6_3"; pos = (cx(3), cy(6)); text = cell(6, 3); size = 0.95; active = 6 < nr }
draw Text { name = "c6_4"; pos = (cx(4), cy(6)); text = cell(6, 4); size = 0.95; active = 6 < nr }
draw Text { name = "c7_0"; pos = (cx(0), cy(7)); text = cell(7, 0); size = 0.95; active = 7 < nr }
draw Text { name = "c7_1"; pos = (cx(1), cy(7)); text = cell(7, 1); size = 0.95; active = 7 < nr }
draw Text { name = "c7_2"; pos = (cx(2), cy(7)); text = cell(7, 2); size = 0.95; active = 7 < nr }
draw Text { name = "c7_3"; pos = (cx(3), cy(7)); text = cell(7, 3); size = 0.95; active = 7 < nr }
draw Text { name = "c7_4"; pos = (cx(4), cy(7)); text = cell(7, 4); size = 0.95; active = 7 < nr }
draw Text { name = "c8_0"; pos = (cx(0), cy(8)); text = cell(8, 0); size = 0.95; active = 8 < nr }
draw Text { name = "c8_1"; pos = (cx(1), cy(8)); text = cell(8, 1); size = 0.95; active = 8 < nr }
draw Text { name = "c8_2"; pos = (cx(2), cy(8)); text = cell(8, 2); size = 0.95; active = 8 < nr }
draw Text { name = "c8_3"; pos = (cx(3), cy(8)); text = cell(8, 3); size = 0.95; active = 8 < nr }
draw Text { name = "c8_4"; pos = (cx(4), cy(8)); text = cell(8, 4); size = 0.95; active = 8 < nr }
draw Text { name = "c9_0"; pos = (cx(0), cy(9)); text = cell(9, 0); size = 0.95; active = 9 < nr }
draw Text { name = "c9_1"; pos = (cx(1), cy(9)); text = cell(9, 1); size = 0.95; active = 9 < nr }
draw Text { name = "c9_2"; pos = (cx(2), cy(9)); text = cell(9, 2); size = 0.95; active = 9 < nr }
draw Text { name = "c9_3"; pos = (cx(3), cy(9)); text = cell(9, 3); size = 0.95; active = 9 < nr }
draw Text { name = "c9_4"; pos = (cx(4), cy(9)); text = cell(9, 4); size = 0.95; active = 9 < nr }
draw Text { name = "c10_0"; pos = (cx(0), cy(10)); text = cell(10, 0); size = 0.95; active = 10 < nr }
draw Text { name = "c10_1"; pos = (cx(1), cy(10)); text = cell(10, 1); size = 0.95; active = 10 < nr }
draw Text { name = "c10_2"; pos = (cx(2), cy(10)); text = cell(10, 2); size = 0.95; active = 10 < nr }
draw Text { name = "c10_3"; pos = (cx(3), cy(10)); text = cell(10, 3); size = 0.95; active = 10 < nr }
draw Text { name = "c10_4"; pos = (cx(4), cy(10)); text = cell(10, 4); size = 0.95; active = 10 < nr }
draw Text { name = "c11_0"; pos = (cx(0), cy(11)); text = cell(11, 0); size = 0.95; active = 11 < nr }
draw Text { name = "c11_1"; pos = (cx(1), cy(11)); text = cell(11, 1); size = 0.95; active = 11 < nr }
draw Text { name = "c11_2"; pos = (cx(2), cy(11)); text = cell(11, 2); size = 0.95; active = 11 < nr }
draw Text { name = "c11_3"; pos = (cx(3), cy(11)); text = cell(11, 3); size = 0.95; active = 11 < nr }
draw Text { name = "c11_4"; pos = (cx(4), cy(11)); text = cell(11, 4); size = 0.95; active = 11 < nr }
draw Text { name = "c12_0"; pos = (cx(0), cy(12)); text = cell(12, 0); size = 0.95; active = 12 < nr }
draw Text { name = "c12_1"; pos = (cx(1), cy(12)); text = cell(12, 1); size = 0.95; active = 12 < nr }
draw Text { name = "c12_2"; pos = (cx(2), cy(12)); text = cell(12, 2); size = 0.95; active = 12 < nr }
draw Text { name = "c12_3"; pos = (cx(3), cy(12)); text = cell(12, 3); size = 0.95; active = 12 < nr }
draw Text { name = "c12_4"; pos = (cx(4), cy(12)); text = cell(12, 4); size = 0.95; active = 12 < nr }
Update {
  if (key != a * 1000 + b) {
    a = round(a); b = round(b);
    rs = [a]; qs = [0]; xs = [1]; ys = [0];
    push(rs, b); push(qs, 0); push(xs, 0); push(ys, 1);
    float k = 1;
    repeat (12) {
      if (rs[k] > 0) {
        float q = floor(rs[k - 1] / rs[k]);
        push(rs, rs[k - 1] - q * rs[k]); push(qs, q); push(xs, xs[k - 1] - q * xs[k]); push(ys, ys[k - 1] - q * ys[k]);
        k = k + 1;
      }
    }
    nr = k + 1;
    gg = rs[k - 1]; xg = xs[k - 1]; yg = ys[k - 1];
    key = a * 1000 + b;
  }
  float ub = b / gg; float ua = a / gg;
  info = "**Расширенный алгоритм Евклида.** В каждой строке rₖ = a · xₖ + b · yₖ; qₖ — частное от деления rₖ₋₂ на rₖ₋₁, а xₖ = xₖ₋₂ − qₖ · xₖ₋₁ и yₖ = yₖ₋₂ − qₖ · yₖ₋₁ пересчитываются по тому же правилу, что и остатки.\n\nПоследний ненулевой остаток — **НОД(" + format(a, 0) + "; " + format(b, 0) + ") = " + format(gg, 0) + "**, и " + format(gg, 0) + " = " + format(a, 0) + " · " + par(xg) + " + " + format(b, 0) + " · " + par(yg) + ".";
  float x2 = xg + t * ub; float y2 = yg - t * ua;
  info = info + "\n\nПредставление не единственно: при t = " + num(t) + " получаем x = " + num(x2) + ", y = " + num(y2) + " (x = x₀ + t · b/НОД, y = y₀ − t · a/НОД), и " + format(a, 0) + " · " + par(x2) + " + " + format(b, 0) + " · " + par(y2) + " = " + format(a * x2 + b * y2, 0) + ".";
}
]
