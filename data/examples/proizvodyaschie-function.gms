[
description = "{info}"

field width = 20;
field height = 10;
camera type = fixed;

// Коэффициент при xⁿ в произведении рядов ∏ 1/(1 − xᵈ) — число способов набрать сумму n монетами достоинств d
// (каждая монета — любое число раз). Режим «по одному разу» заменяет множители 1/(1 − xᵈ) на (1 + xᵈ).
float N = 12; float once = 0; float key = -1; string info = "";
float u1 = 1; float u2 = 1; float u3 = 0; float u4 = 0; float u5 = 1; float u10 = 0;
draw Graph { name = "gB"; graph = "gb"; nodeRadius = 0; edgeWidth = 22; edgeCap = butt; labels = false; interactive = false; showWeights = false }
draw Graph { name = "gX"; graph = "gx"; nodeRadius = 0; edgeWidth = 1; labels = false; interactive = false; showWeights = false; edgeColor = #3b82f688 }
draw Text { name = "t0"; pos = (-9.0, -4.75); text = "0"; size = 0.8 }
draw Text { name = "t1"; pos = (-8.1, -4.75); text = "1"; size = 0.8 }
draw Text { name = "t2"; pos = (-7.2, -4.75); text = "2"; size = 0.8 }
draw Text { name = "t3"; pos = (-6.3, -4.75); text = "3"; size = 0.8 }
draw Text { name = "t4"; pos = (-5.4, -4.75); text = "4"; size = 0.8 }
draw Text { name = "t5"; pos = (-4.5, -4.75); text = "5"; size = 0.8 }
draw Text { name = "t6"; pos = (-3.6, -4.75); text = "6"; size = 0.8 }
draw Text { name = "t7"; pos = (-2.7, -4.75); text = "7"; size = 0.8 }
draw Text { name = "t8"; pos = (-1.8, -4.75); text = "8"; size = 0.8 }
draw Text { name = "t9"; pos = (-0.9, -4.75); text = "9"; size = 0.8 }
draw Text { name = "t10"; pos = (0.0, -4.75); text = "10"; size = 0.8 }
draw Text { name = "t11"; pos = (0.9, -4.75); text = "11"; size = 0.8 }
draw Text { name = "t12"; pos = (1.8, -4.75); text = "12"; size = 0.8 }
draw Text { name = "t13"; pos = (2.7, -4.75); text = "13"; size = 0.8 }
draw Text { name = "t14"; pos = (3.6, -4.75); text = "14"; size = 0.8 }
draw Text { name = "t15"; pos = (4.5, -4.75); text = "15"; size = 0.8 }
draw Text { name = "t16"; pos = (5.4, -4.75); text = "16"; size = 0.8 }
draw Text { name = "t17"; pos = (6.3, -4.75); text = "17"; size = 0.8 }
draw Text { name = "t18"; pos = (7.2, -4.75); text = "18"; size = 0.8 }
draw Text { name = "t19"; pos = (8.1, -4.75); text = "19"; size = 0.8 }
draw Text { name = "t20"; pos = (9.0, -4.75); text = "20"; size = 0.8 }
new UI { name = "u1"; type = toggle; label = "1"; variable = u1; default = true }
new UI { name = "u2"; type = toggle; label = "2"; variable = u2; default = true }
new UI { name = "u3"; type = toggle; label = "3"; variable = u3; default = false }
new UI { name = "u4"; type = toggle; label = "4"; variable = u4; default = false }
new UI { name = "u5"; type = toggle; label = "5"; variable = u5; default = true }
new UI { name = "u10"; type = toggle; label = "10"; variable = u10; default = false }
new UI { type = slider; label = "n"; variable = N; min = 0; max = 20; step = 1; default = 12 }
new UI { type = select; label = "монеты"; variable = once; options = (0, 1); labels = ("любое число раз", "по одному разу"); default = 0 }
Function sup(d) {
  if (d == 1) { return ""; }
  if (d == 2) { return "²"; }
  if (d == 3) { return "³"; }
  if (d == 4) { return "⁴"; }
  if (d == 5) { return "⁵"; }
  return "¹⁰";
}
Function fac(d, on) {
  if (on < 0.5) { return ""; }
  if (once > 0.5) { return "(1 + x" + sup(d) + ")"; }
  return "1/(1 − x" + sup(d) + ")";
}
Function jn(a, b) {
  if (b == "") { return a; }
  if (a == "") { return b; }
  return a + " · " + b;
}
Function addc(c, d, on) {
  if (on < 0.5) { return 0; }
  if (once > 0.5) {
    repeat (21) { float m = 20 - i; if (m >= d) { c[m] = c[m] + c[m - d]; } }
  } else {
    repeat (21) { float m = i; if (m >= d) { c[m] = c[m] + c[m - d]; } }
  }
  return 0;
}
Update {
  N = round(N);
  list c = [1];
  repeat (20) { push(c, 0); }
  addc(c, 1, u1); addc(c, 2, u2); addc(c, 3, u3); addc(c, 4, u4); addc(c, 5, u5); addc(c, 10, u10);
  float mx = max(c);
  gb = newGraph(); gx = newGraph();
  addNode(gx, "a", [-9.6, -4.2]); addNode(gx, "b", [9.6, -4.2]); addEdge(gx, "a", "b");
  repeat (21) {
    string id = format(i, 0); string col = "#3b82f6"; if (i == N) { col = "#f59e0b"; }
    addNode(gb, "p" + id, [-9 + 0.9 * i, -4.2]); addNode(gb, "q" + id, [-9 + 0.9 * i, -4.2 + 8.2 * c[i] / mx]); addEdge(gb, "p" + id, "q" + id, 1, col);
  }
  string f = jn(jn(jn(jn(jn(fac(1, u1), fac(2, u2)), fac(3, u3)), fac(4, u4)), fac(5, u5)), fac(10, u10));
  if (f == "") { f = "1"; }
  info = "**Производящая функция** последовательности (aₙ) — ряд A(x) = a₀ + a₁x + a₂x² + …; здесь aₙ — число способов набрать сумму n выбранными монетами, а произведение рядов отвечает свёртке: A(x) = " + f + ".\n\n";
  info = info + "Коэффициенты: " + format(c[0], 0) + ", " + format(c[1], 0) + ", " + format(c[2], 0) + ", " + format(c[3], 0) + ", " + format(c[4], 0) + ", " + format(c[5], 0) + ", … Для n = **" + format(N, 0) + "** коэффициент при xⁿ равен **" + format(c[N], 0) + "** (жёлтый столбик; высоты нормированы по наибольшему, " + format(mx, 0) + ").";
}
]