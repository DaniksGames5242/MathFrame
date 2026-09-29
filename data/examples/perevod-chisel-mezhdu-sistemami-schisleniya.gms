[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Слева — таблица перевода: деление на p с остатками (или разложение по степеням p),
// справа — получившаяся запись. ----
draw Text { name = "L0"; pos = (-1.9, 4.10); text = rowL(0); size = 1; align = right; active = 0 < len }
draw Text { name = "R0"; pos = (-1.7, 4.10); text = rowR(0); size = 1.2; align = left; color = #3b82f6; active = 0 < len }
draw Text { name = "L1"; pos = (-1.9, 3.25); text = rowL(1); size = 1; align = right; active = 1 < len }
draw Text { name = "R1"; pos = (-1.7, 3.25); text = rowR(1); size = 1.2; align = left; color = #3b82f6; active = 1 < len }
draw Text { name = "L2"; pos = (-1.9, 2.40); text = rowL(2); size = 1; align = right; active = 2 < len }
draw Text { name = "R2"; pos = (-1.7, 2.40); text = rowR(2); size = 1.2; align = left; color = #3b82f6; active = 2 < len }
draw Text { name = "L3"; pos = (-1.9, 1.55); text = rowL(3); size = 1; align = right; active = 3 < len }
draw Text { name = "R3"; pos = (-1.7, 1.55); text = rowR(3); size = 1.2; align = left; color = #3b82f6; active = 3 < len }
draw Text { name = "L4"; pos = (-1.9, 0.70); text = rowL(4); size = 1; align = right; active = 4 < len }
draw Text { name = "R4"; pos = (-1.7, 0.70); text = rowR(4); size = 1.2; align = left; color = #3b82f6; active = 4 < len }
draw Text { name = "L5"; pos = (-1.9, -0.15); text = rowL(5); size = 1; align = right; active = 5 < len }
draw Text { name = "R5"; pos = (-1.7, -0.15); text = rowR(5); size = 1.2; align = left; color = #3b82f6; active = 5 < len }
draw Text { name = "L6"; pos = (-1.9, -1.00); text = rowL(6); size = 1; align = right; active = 6 < len }
draw Text { name = "R6"; pos = (-1.7, -1.00); text = rowR(6); size = 1.2; align = left; color = #3b82f6; active = 6 < len }
draw Text { name = "L7"; pos = (-1.9, -1.85); text = rowL(7); size = 1; align = right; active = 7 < len }
draw Text { name = "R7"; pos = (-1.7, -1.85); text = rowR(7); size = 1.2; align = left; color = #3b82f6; active = 7 < len }
draw Text { name = "L8"; pos = (-1.9, -2.70); text = rowL(8); size = 1; align = right; active = 8 < len }
draw Text { name = "R8"; pos = (-1.7, -2.70); text = rowR(8); size = 1.2; align = left; color = #3b82f6; active = 8 < len }
draw Text { name = "L9"; pos = (-1.9, -3.55); text = rowL(9); size = 1; align = right; active = 9 < len }
draw Text { name = "R9"; pos = (-1.7, -3.55); text = rowR(9); size = 1.2; align = left; color = #3b82f6; active = 9 < len }
draw Text { name = "cap"; pos = (4.6, 1.6); text = cap; size = 0.9 }
draw Text { name = "res"; pos = (4.6, 0.4); text = res + subs(p); size = 1.7; color = #f59e0b }
draw Text { name = "eq"; pos = (4.6, -1.0); text = format(N, 0) + "₁₀"; size = 1.7 }

new UI { name = "sM"; type = select; label = "направление"; variable = mode; options = ("div", "sum"); labels = ("десятичная → система p (деление)", "система p → десятичная (сумма)"); default = "div" }
new UI { name = "sN"; type = slider; label = "число N"; variable = N; min = 0; max = 999; step = 1; default = 37 }
new UI { name = "sP"; type = slider; label = "основание p"; variable = p; min = 2; max = 16; step = 1; default = 2 }

// ---- Логика ----
string mode = "div"; float N = 37; float p = 2;
float len = 1;
list dg = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
list nn = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
list qq = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
string res = ""; string cap = ""; string info = "";

Function md(a, m) { return a - floor(a / m) * m; }
Function hx(d) { if (d < 10) { return format(d, 0); } if (d == 10) { return "A"; } if (d == 11) { return "B"; } if (d == 12) { return "C"; } if (d == 13) { return "D"; } if (d == 14) { return "E"; } if (d == 15) { return "F"; } return "G"; }
Function subd(d) { if (d == 0) { return "₀"; } if (d == 1) { return "₁"; } if (d == 2) { return "₂"; } if (d == 3) { return "₃"; } if (d == 4) { return "₄"; } if (d == 5) { return "₅"; } if (d == 6) { return "₆"; } if (d == 7) { return "₇"; } if (d == 8) { return "₈"; } return "₉"; }
Function subs(v) { if (v >= 10) { return subd(1) + subd(v - 10); } return subd(v); }
Function supd(d) { if (d == 0) { return "⁰"; } if (d == 1) { return "¹"; } if (d == 2) { return "²"; } if (d == 3) { return "³"; } if (d == 4) { return "⁴"; } if (d == 5) { return "⁵"; } if (d == 6) { return "⁶"; } if (d == 7) { return "⁷"; } if (d == 8) { return "⁸"; } return "⁹"; }
Function rowL(k) {
  if (mode == "div") { return format(nn[k], 0) + " = " + format(p, 0) + " · " + format(qq[k], 0) + " +"; }
  float m = len - 1 - k;
  return hx(dg[m]) + " · " + format(pow(p, m), 0) + " =";
}
Function rowR(k) {
  if (mode == "div") { return hx(dg[k]); }
  float m = len - 1 - k;
  return format(dg[m] * pow(p, m), 0);
}

Update {
  float n = N; len = 0;
  repeat (10) { if (n > 0) { nn[len] = n; qq[len] = floor(n / p); dg[len] = md(n, p); len = len + 1; n = floor(n / p); } }
  if (len == 0) { len = 1; nn[0] = 0; qq[0] = 0; dg[0] = 0; }
  res = ""; string ex = "";
  repeat (len) { float m = len - 1 - i; res = res + hx(dg[m]); if (i > 0) { ex = ex + " + "; } ex = ex + hx(dg[m]) + "·" + format(p, 0) + supd(m); }
  if (mode == "div") { cap = "остатки снизу вверх"; } else { cap = "сумма всех строк"; }
  info = "**Перевод между системами.** ";
  if (mode == "div") {
    info = info + "Число N = " + format(N, 0) + " делят на p = " + format(p, 0) + " с остатком, пока частное не станет нулём; остатки — цифры результата от младшей к старшей, поэтому записывают их снизу вверх: " + format(N, 0) + "₁₀ = **" + res + "**" + subs(p) + ".\n\n";
    info = info + "**Проверка (обратный перевод):** " + res + subs(p) + " = " + ex + " = " + format(N, 0) + ".";
  } else {
    info = info + "Число " + res + subs(p) + " с цифрами dₖ … d₀ равно сумме dᵢ·pⁱ, где p = " + format(p, 0) + ": " + ex + ". Сумма строк слева даёт **" + format(N, 0) + "₁₀**.\n\n";
    info = info + "**Обратно:** делением " + format(N, 0) + " на " + format(p, 0) + " с остатками получаем те же цифры " + res + ".";
  }
  if (p > 10) { info = info + " Для оснований больше десяти цифры 10, 11, … обозначаются буквами A, B, …"; }
}
]
