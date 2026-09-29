[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Три шестидесятеричных разряда: каждая цифра 1…59 — угловые клинья ◀ (по 10) и вертикальные ▼ (по 1).
// Внутренний пустой разряд отмечен разделителем «, ведущие и хвостовые нули не пишутся. ----
draw Text { name = "tn2"; pos = (-5, 3.7); text = tens(d2); size = 1.6; color = #3b82f6 }
draw Text { name = "tn1"; pos = (0, 3.7); text = tens(d1); size = 1.6; color = #3b82f6 }
draw Text { name = "tn0"; pos = (5, 3.7); text = tens(d0); size = 1.6; color = #3b82f6 }
draw Text { name = "un2"; pos = (-5, 2.4); text = units(2); size = 1.6; color = #f59e0b }
draw Text { name = "un1"; pos = (0, 2.4); text = units(1); size = 1.6; color = #f59e0b }
draw Text { name = "un0"; pos = (5, 2.4); text = units(0); size = 1.6; color = #f59e0b }
draw Text { name = "nm2"; pos = (-5, 0.7); text = format(d2, 0); size = 1.3 }
draw Text { name = "nm1"; pos = (0, 0.7); text = format(d1, 0); size = 1.3 }
draw Text { name = "nm0"; pos = (5, 0.7); text = format(d0, 0); size = 1.3 }
draw Text { name = "wg2"; pos = (-5, -0.6); text = "вес 60" + ex(2 + s) + " = " + wt(2 + s); size = 0.95 }
draw Text { name = "wg1"; pos = (0, -0.6); text = "вес 60" + ex(1 + s) + " = " + wt(1 + s); size = 0.95 }
draw Text { name = "wg0"; pos = (5, -0.6); text = "вес 60" + ex(s) + " = " + wt(s); size = 0.95 }
draw Text { name = "tot"; pos = (0, -3.2); text = "значение ≈ " + format(val, 5); size = 1.7; color = #f59e0b }

new UI { name = "s2"; type = slider; label = "старшая цифра"; variable = d2; min = 0; max = 59; step = 1; default = 1 }
new UI { name = "s1"; type = slider; label = "средняя цифра"; variable = d1; min = 0; max = 59; step = 1; default = 24 }
new UI { name = "s0"; type = slider; label = "младшая цифра"; variable = d0; min = 0; max = 59; step = 1; default = 51 }
new UI { name = "sS"; type = slider; label = "где «запятая» (степень 60)"; variable = s; min = -3; max = 2; step = 1; default = -2 }

// ---- Логика ----
float d2 = 1; float d1 = 24; float d0 = 51; float s = -2; float val = 0; string info = "";

Function rep(c, n) { string r = ""; repeat (n) { r = r + c; } return r; }
Function tens(d) { return rep("◀", floor(d / 10)); }
Function dgt(j) { if (j == 2) { return d2; } if (j == 1) { return d1; } return d0; }
// цифра-нуль внутри записи: есть ненулевая слева и справа
Function inner(j) { float left = 0; float right = 0; if (j < 2 && d2 > 0) { left = 1; } if (j < 1 && d1 > 0) { left = 1; } if (j > 0 && d0 > 0) { right = 1; } if (j > 1 && d1 > 0) { right = 1; } return left * right; }
Function units(j) {
  float d = dgt(j); float u = d - 10 * floor(d / 10);
  if (d == 0 && inner(j) == 1) { return "«"; }
  if (u == 0) { return ""; }
  return rep("▼", min(u, 3)) + " " + rep("▼", max(0, min(u - 3, 3))) + " " + rep("▼", max(0, u - 6));
}
Function sup(d) { if (d == 0) { return "⁰"; } if (d == 1) { return "¹"; } if (d == 2) { return "²"; } return "³"; }
Function ex(e) { if (e < 0) { return "⁻" + sup(-e); } return sup(e); }
Function wt(e) { if (e < 0) { return "1/" + format(pow(60, -e), 0); } return format(pow(60, e), 0); }

Update {
  float n = d2 * 3600 + d1 * 60 + d0;
  val = n * pow(60, s);
  info = "**Вавилонская запись, основание 60.** Цифра каждого разряда от 1 до 59 составляется из двух знаков: вертикальный клин ▼ = 1, угловой ◀ = 10 (например, " + format(d0, 0) + " — это " + format(floor(d0 / 10), 0) + " × ◀ и " + format(d0 - 10 * floor(d0 / 10), 0) + " × ▼). Разряд слева в 60 раз старше соседнего справа.\n\n";
  info = info + "Запись " + format(d2, 0) + " : " + format(d1, 0) + " : " + format(d0, 0) + " = " + format(d2, 0) + "·60" + ex(2 + s) + " + " + format(d1, 0) + "·60" + ex(1 + s) + " + " + format(d0, 0) + "·60" + ex(s) + " ≈ **" + format(val, 5) + "**. Ведущие нули не пишутся, пустой разряд внутри числа отмечается разделителем «, а хвостовые нули не пишутся вовсе.\n\n";
  info = info + "Положение «запятой» в записи не указано: те же знаки читаются как N·60ᵏ при любом k — на ползунке k = " + format(s, 0) + ", значение зависит от него.";
  if (d2 == 1 && d1 == 24 && d0 == 51 && s == -2) { info = info + " Запись 1 : 24 : 51 при k = −2 — вавилонское приближение √2 ≈ 1,4142 (клинописная табличка YBC 7289)."; }
}
]
