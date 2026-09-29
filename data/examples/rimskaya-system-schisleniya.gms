[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Сверху — запись числа знаками слева направо (пары с вычитанием — жёлтым), снизу — та же запись по десятичным разрядам. ----
draw Text { name = "t0"; pos = (xs[0], 3.6); text = tg(0); size = 1.6; color = #3b82f6; active = 0 < nt && pr(0) == 0 }
draw Text { name = "p0"; pos = (xs[0], 3.6); text = tg(0); size = 1.6; color = #f59e0b; active = 0 < nt && pr(0) == 1 }
draw Text { name = "t1"; pos = (xs[1], 3.6); text = tg(1); size = 1.6; color = #3b82f6; active = 1 < nt && pr(1) == 0 }
draw Text { name = "p1"; pos = (xs[1], 3.6); text = tg(1); size = 1.6; color = #f59e0b; active = 1 < nt && pr(1) == 1 }
draw Text { name = "t2"; pos = (xs[2], 3.6); text = tg(2); size = 1.6; color = #3b82f6; active = 2 < nt && pr(2) == 0 }
draw Text { name = "p2"; pos = (xs[2], 3.6); text = tg(2); size = 1.6; color = #f59e0b; active = 2 < nt && pr(2) == 1 }
draw Text { name = "t3"; pos = (xs[3], 3.6); text = tg(3); size = 1.6; color = #3b82f6; active = 3 < nt && pr(3) == 0 }
draw Text { name = "p3"; pos = (xs[3], 3.6); text = tg(3); size = 1.6; color = #f59e0b; active = 3 < nt && pr(3) == 1 }
draw Text { name = "t4"; pos = (xs[4], 3.6); text = tg(4); size = 1.6; color = #3b82f6; active = 4 < nt && pr(4) == 0 }
draw Text { name = "p4"; pos = (xs[4], 3.6); text = tg(4); size = 1.6; color = #f59e0b; active = 4 < nt && pr(4) == 1 }
draw Text { name = "t5"; pos = (xs[5], 3.6); text = tg(5); size = 1.6; color = #3b82f6; active = 5 < nt && pr(5) == 0 }
draw Text { name = "p5"; pos = (xs[5], 3.6); text = tg(5); size = 1.6; color = #f59e0b; active = 5 < nt && pr(5) == 1 }
draw Text { name = "t6"; pos = (xs[6], 3.6); text = tg(6); size = 1.6; color = #3b82f6; active = 6 < nt && pr(6) == 0 }
draw Text { name = "p6"; pos = (xs[6], 3.6); text = tg(6); size = 1.6; color = #f59e0b; active = 6 < nt && pr(6) == 1 }
draw Text { name = "t7"; pos = (xs[7], 3.6); text = tg(7); size = 1.6; color = #3b82f6; active = 7 < nt && pr(7) == 0 }
draw Text { name = "p7"; pos = (xs[7], 3.6); text = tg(7); size = 1.6; color = #f59e0b; active = 7 < nt && pr(7) == 1 }
draw Text { name = "t8"; pos = (xs[8], 3.6); text = tg(8); size = 1.6; color = #3b82f6; active = 8 < nt && pr(8) == 0 }
draw Text { name = "p8"; pos = (xs[8], 3.6); text = tg(8); size = 1.6; color = #f59e0b; active = 8 < nt && pr(8) == 1 }
draw Text { name = "t9"; pos = (xs[9], 3.6); text = tg(9); size = 1.6; color = #3b82f6; active = 9 < nt && pr(9) == 0 }
draw Text { name = "p9"; pos = (xs[9], 3.6); text = tg(9); size = 1.6; color = #f59e0b; active = 9 < nt && pr(9) == 1 }
draw Text { name = "t10"; pos = (xs[10], 3.6); text = tg(10); size = 1.6; color = #3b82f6; active = 10 < nt && pr(10) == 0 }
draw Text { name = "p10"; pos = (xs[10], 3.6); text = tg(10); size = 1.6; color = #f59e0b; active = 10 < nt && pr(10) == 1 }
draw Text { name = "t11"; pos = (xs[11], 3.6); text = tg(11); size = 1.6; color = #3b82f6; active = 11 < nt && pr(11) == 0 }
draw Text { name = "p11"; pos = (xs[11], 3.6); text = tg(11); size = 1.6; color = #f59e0b; active = 11 < nt && pr(11) == 1 }
draw Text { name = "t12"; pos = (xs[12], 3.6); text = tg(12); size = 1.6; color = #3b82f6; active = 12 < nt && pr(12) == 0 }
draw Text { name = "p12"; pos = (xs[12], 3.6); text = tg(12); size = 1.6; color = #f59e0b; active = 12 < nt && pr(12) == 1 }
draw Text { name = "t13"; pos = (xs[13], 3.6); text = tg(13); size = 1.6; color = #3b82f6; active = 13 < nt && pr(13) == 0 }
draw Text { name = "p13"; pos = (xs[13], 3.6); text = tg(13); size = 1.6; color = #f59e0b; active = 13 < nt && pr(13) == 1 }
draw Text { name = "t14"; pos = (xs[14], 3.6); text = tg(14); size = 1.6; color = #3b82f6; active = 14 < nt && pr(14) == 0 }
draw Text { name = "p14"; pos = (xs[14], 3.6); text = tg(14); size = 1.6; color = #f59e0b; active = 14 < nt && pr(14) == 1 }
draw Text { name = "t15"; pos = (xs[15], 3.6); text = tg(15); size = 1.6; color = #3b82f6; active = 15 < nt && pr(15) == 0 }
draw Text { name = "p15"; pos = (xs[15], 3.6); text = tg(15); size = 1.6; color = #f59e0b; active = 15 < nt && pr(15) == 1 }
draw Text { name = "t16"; pos = (xs[16], 3.6); text = tg(16); size = 1.6; color = #3b82f6; active = 16 < nt && pr(16) == 0 }
draw Text { name = "p16"; pos = (xs[16], 3.6); text = tg(16); size = 1.6; color = #f59e0b; active = 16 < nt && pr(16) == 1 }
draw Text { name = "t17"; pos = (xs[17], 3.6); text = tg(17); size = 1.6; color = #3b82f6; active = 17 < nt && pr(17) == 0 }
draw Text { name = "p17"; pos = (xs[17], 3.6); text = tg(17); size = 1.6; color = #f59e0b; active = 17 < nt && pr(17) == 1 }
draw Text { name = "t18"; pos = (xs[18], 3.6); text = tg(18); size = 1.6; color = #3b82f6; active = 18 < nt && pr(18) == 0 }
draw Text { name = "p18"; pos = (xs[18], 3.6); text = tg(18); size = 1.6; color = #f59e0b; active = 18 < nt && pr(18) == 1 }
draw Text { name = "t19"; pos = (xs[19], 3.6); text = tg(19); size = 1.6; color = #3b82f6; active = 19 < nt && pr(19) == 0 }
draw Text { name = "p19"; pos = (xs[19], 3.6); text = tg(19); size = 1.6; color = #f59e0b; active = 19 < nt && pr(19) == 1 }
draw Text { name = "n0"; pos = (-4.5, 1.3); text = "тысячи"; size = 0.9 }
draw Text { name = "g0"; pos = (-4.5, 0.1); text = grp(3); size = 1.6 }
draw Text { name = "h0"; pos = (-4.5, -1.1); text = format(dig(3) * 1000, 0); size = 1 }
draw Text { name = "n1"; pos = (-1.5, 1.3); text = "сотни"; size = 0.9 }
draw Text { name = "g1"; pos = (-1.5, 0.1); text = grp(2); size = 1.6 }
draw Text { name = "h1"; pos = (-1.5, -1.1); text = format(dig(2) * 100, 0); size = 1 }
draw Text { name = "n2"; pos = (1.5, 1.3); text = "десятки"; size = 0.9 }
draw Text { name = "g2"; pos = (1.5, 0.1); text = grp(1); size = 1.6 }
draw Text { name = "h2"; pos = (1.5, -1.1); text = format(dig(1) * 10, 0); size = 1 }
draw Text { name = "n3"; pos = (4.5, 1.3); text = "единицы"; size = 0.9 }
draw Text { name = "g3"; pos = (4.5, 0.1); text = grp(0); size = 1.6 }
draw Text { name = "h3"; pos = (4.5, -1.1); text = format(dig(0) * 1, 0); size = 1 }
draw Text { name = "tot"; pos = (0, -3.3); text = roman + " = " + format(N, 0); size = 1.7; color = #f59e0b }

new UI { name = "sN"; type = slider; label = "число"; variable = N; min = 1; max = 3999; step = 1; default = 1994 }
new UI { name = "sR"; type = select; label = "правило вычитания"; variable = rule; options = ("sub", "add"); labels = ("есть: IV, IX, XL, XC, CD, CM", "нет: IIII, VIIII, …"); default = "sub" }

// ---- Логика ----
float N = 1994; string rule = "sub";
list tk = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
list xs = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
float nt = 0; string roman = ""; string info = "";

Function md(a, m) { return a - floor(a / m) * m; }
Function dig(dec) { return md(floor(N / pow(10, dec)), 10); }
Function rep(s, n) { string r = ""; repeat (n) { r = r + s; } return r; }
Function tg(k) {
  float j = tk[k];
  if (rule == "sub") {
    if (j == 0) { return "M"; } if (j == 1) { return "CM"; } if (j == 2) { return "D"; } if (j == 3) { return "CD"; } if (j == 4) { return "C"; } if (j == 5) { return "XC"; } if (j == 6) { return "L"; } if (j == 7) { return "XL"; } if (j == 8) { return "X"; } if (j == 9) { return "IX"; } if (j == 10) { return "V"; } if (j == 11) { return "IV"; } if (j == 12) { return "I"; }
  }
  if (j == 0) { return "M"; } if (j == 1) { return "D"; } if (j == 2) { return "C"; } if (j == 3) { return "L"; } if (j == 4) { return "X"; } if (j == 5) { return "V"; } if (j == 6) { return "I"; }
  return "";
}
Function tv(k) {
  float j = tk[k];
  if (rule == "sub") {
    if (j == 0) { return 1000; } if (j == 1) { return 900; } if (j == 2) { return 500; } if (j == 3) { return 400; } if (j == 4) { return 100; } if (j == 5) { return 90; } if (j == 6) { return 50; } if (j == 7) { return 40; } if (j == 8) { return 10; } if (j == 9) { return 9; } if (j == 10) { return 5; } if (j == 11) { return 4; } if (j == 12) { return 1; }
  }
  if (j == 0) { return 1000; } if (j == 1) { return 500; } if (j == 2) { return 100; } if (j == 3) { return 50; } if (j == 4) { return 10; } if (j == 5) { return 5; } if (j == 6) { return 1; }
  return 0;
}
Function pr(k) { if (rule == "sub" && tg(k) != "" && (tv(k) == 900 || tv(k) == 400 || tv(k) == 90 || tv(k) == 40 || tv(k) == 9 || tv(k) == 4)) { return 1; } return 0; }
Function grp(dec) {
  float d = dig(dec);
  if (d == 0) { return "—"; }
  string a = "I"; string b = "V"; string c = "X";
  if (dec == 1) { a = "X"; b = "L"; c = "C"; }
  if (dec == 2) { a = "C"; b = "D"; c = "M"; }
  if (dec == 3) { return rep("M", d); }
  if (rule == "sub" && d == 4) { return a + b; }
  if (rule == "sub" && d == 9) { return a + c; }
  if (d < 5) { return rep(a, d); }
  if (d == 9) { return b + rep(a, 4); }
  return b + rep(a, d - 5);
}
Function wdt(k) { if (pr(k) == 1) { return 1.05; } return 0.6; }

Update {
  float rem = N; nt = 0; roman = "";
  float n = 13; if (rule == "add") { n = 7; }
  repeat (n) {
    float j = i; float v = 1000;
    if (rule == "sub") { if (j == 1) { v = 900; } if (j == 2) { v = 500; } if (j == 3) { v = 400; } if (j == 4) { v = 100; } if (j == 5) { v = 90; } if (j == 6) { v = 50; } if (j == 7) { v = 40; } if (j == 8) { v = 10; } if (j == 9) { v = 9; } if (j == 10) { v = 5; } if (j == 11) { v = 4; } if (j == 12) { v = 1; } }
    else { if (j == 1) { v = 500; } if (j == 2) { v = 100; } if (j == 3) { v = 50; } if (j == 4) { v = 10; } if (j == 5) { v = 5; } if (j == 6) { v = 1; } }
    repeat (20) { if (rem >= v && nt < 20) { tk[nt] = j; nt = nt + 1; rem = rem - v; } }
  }
  float tot = 0; repeat (nt) { tot = tot + wdt(i) + 0.15; } tot = tot - 0.15;
  float x = -tot / 2; string sm = ""; string vs = "";
  repeat (nt) { xs[i] = x + wdt(i) / 2; x = x + wdt(i) + 0.15; roman = roman + tg(i); if (i > 0) { sm = sm + " + "; vs = vs + " + "; } sm = sm + tg(i); vs = vs + format(tv(i), 0); }
  info = "**Римская запись:** знаки I = 1, V = 5, X = 10, L = 50, C = 100, D = 500, M = 1000. ";
  if (rule == "sub") { info = info + "Значение записи — сумма знаков, но **знак меньшего значения перед большим вычитается**: IV = 4, IX = 9, XL = 40, XC = 90, CD = 400, CM = 900 (жёлтые пары). Знаки I, X, C, M повторяются не более трёх раз подряд, V, L, D — не повторяются.\n\n"; }
  else { info = info + "Без правила вычитания значение записи — просто **сумма значений знаков**, запись длиннее (4 = IIII, 9 = VIIII); правило вычитания её сокращает.\n\n"; }
  info = info + format(N, 0) + " = " + roman + ": " + sm + " = " + vs + ".";
  info = info + " Знак X означает десять на любом месте, отдельного знака для пустого разряда нет.";
}
]
