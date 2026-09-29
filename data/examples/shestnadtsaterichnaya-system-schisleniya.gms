[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Четыре разряда основания 16: цифры, веса, двоичные группы по 4 бита, вклад каждой цифры. ----
draw Text { name = "cp0"; pos = (-7.8, 2.6); text = "цифры"; size = 0.9; align = left }
draw Text { name = "cp1"; pos = (-7.8, 1.1); text = "вес разряда"; size = 0.9; align = left }
draw Text { name = "cp2"; pos = (-7.8, -0.4); text = "двоичная запись"; size = 0.9; align = left }
draw Text { name = "cp3"; pos = (-7.8, -1.9); text = "вклад цифры"; size = 0.9; align = left }
draw Text { name = "dg0"; pos = (3.9, 2.6); text = hx(d0); size = 2.4; color = #3b82f6 }
draw Text { name = "w0"; pos = (3.9, 1.1); text = "16⁰"; size = 1.1 }
draw Text { name = "bt0"; pos = (3.9, -0.4); text = bin(d0); size = 1.5 }
draw Text { name = "ct0"; pos = (3.9, -1.9); text = hx(d0) + " · " + format(pow(16, 0), 0) + " = " + format(d0 * pow(16, 0), 0); size = 0.95 }
draw Text { name = "dg1"; pos = (1.3, 2.6); text = hx(d1); size = 2.4; color = #3b82f6 }
draw Text { name = "w1"; pos = (1.3, 1.1); text = "16¹"; size = 1.1 }
draw Text { name = "bt1"; pos = (1.3, -0.4); text = bin(d1); size = 1.5 }
draw Text { name = "ct1"; pos = (1.3, -1.9); text = hx(d1) + " · " + format(pow(16, 1), 0) + " = " + format(d1 * pow(16, 1), 0); size = 0.95 }
draw Text { name = "dg2"; pos = (-1.3, 2.6); text = hx(d2); size = 2.4; color = #3b82f6 }
draw Text { name = "w2"; pos = (-1.3, 1.1); text = "16²"; size = 1.1 }
draw Text { name = "bt2"; pos = (-1.3, -0.4); text = bin(d2); size = 1.5 }
draw Text { name = "ct2"; pos = (-1.3, -1.9); text = hx(d2) + " · " + format(pow(16, 2), 0) + " = " + format(d2 * pow(16, 2), 0); size = 0.95 }
draw Text { name = "dg3"; pos = (-3.9, 2.6); text = hx(d3); size = 2.4; color = #3b82f6 }
draw Text { name = "w3"; pos = (-3.9, 1.1); text = "16³"; size = 1.1 }
draw Text { name = "bt3"; pos = (-3.9, -0.4); text = bin(d3); size = 1.5 }
draw Text { name = "ct3"; pos = (-3.9, -1.9); text = hx(d3) + " · " + format(pow(16, 3), 0) + " = " + format(d3 * pow(16, 3), 0); size = 0.95 }
draw Text { name = "sub"; pos = (6.3, 2.35); text = "₁₆"; size = 1.4 }
draw Text { name = "res"; pos = (0, -3.7); text = "= " + format(val, 0) + "₁₀"; size = 2; color = #f59e0b }
draw Text { name = "by1"; pos = (-2.6, -0.4 + 3.1); text = ""; size = 1; active = false }

new UI { name = "s0"; type = slider; label = "цифра при 16⁰"; variable = d0; min = 0; max = 15; step = 1; default = 15 }
new UI { name = "s1"; type = slider; label = "цифра при 16¹"; variable = d1; min = 0; max = 15; step = 1; default = 3 }
new UI { name = "s2"; type = slider; label = "цифра при 16²"; variable = d2; min = 0; max = 15; step = 1; default = 10 }
new UI { name = "s3"; type = slider; label = "цифра при 16³"; variable = d3; min = 0; max = 15; step = 1; default = 1 }

// ---- Логика ----
float d0 = 15; float d1 = 3; float d2 = 10; float d3 = 1;
float val = 0; string info = "";

Function md(a, m) { return a - floor(a / m) * m; }
Function hx(d) { if (d < 10) { return format(d, 0); } if (d == 10) { return "A"; } if (d == 11) { return "B"; } if (d == 12) { return "C"; } if (d == 13) { return "D"; } if (d == 14) { return "E"; } return "F"; }
Function bin(d) { string r = ""; float p = 8; repeat (4) { r = r + format(floor(d / p) - 2 * floor(d / (2 * p)), 0); p = p / 2; } return r; }
Function trim(a, b2, c, d) { string r = ""; float on = 0; if (a > 0) { on = 1; } if (on == 1) { r = r + hx(a); } if (b2 > 0) { on = 1; } if (on == 1) { r = r + hx(b2); } if (c > 0) { on = 1; } if (on == 1) { r = r + hx(c); } return r + hx(d); }

Update {
  val = d3 * 4096 + d2 * 256 + d1 * 16 + d0;
  string t = trim(d3, d2, d1, d0);
  float byteHi = d3 * 16 + d2; float byteLo = d1 * 16 + d0;
  info = "**Шестнадцатеричная система:** цифры 0–9 и A–F (A = 10, …, F = 15), вес разряда — степень 16. Число " + t + "₁₆ = " + format(d3, 0) + "·16³ + " + format(d2, 0) + "·16² + " + format(d1, 0) + "·16 + " + format(d0, 0) + " = **" + format(val, 0) + "** в десятичной системе.\n\n";
  info = info + "**Четыре бита на цифру:** 16 = 2⁴, поэтому каждая цифра — ровно тетрада битов (" + hx(d3) + " = " + bin(d3) + ", " + hx(d2) + " = " + bin(d2) + ", " + hx(d1) + " = " + bin(d1) + ", " + hx(d0) + " = " + bin(d0) + "), а запись в двоичной системе в четыре раза длиннее.\n\n";
  info = info + "**Байт — две цифры:** старший байт " + hx(d3) + hx(d2) + "₁₆ = " + format(byteHi, 0) + ", младший " + hx(d1) + hx(d0) + "₁₆ = " + format(byteLo, 0) + " (любое значение 0…255 — ровно два символа, максимум FF₁₆ = 255).";
}
]
