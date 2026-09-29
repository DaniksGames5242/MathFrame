[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Одно число в разных системах счисления. Справа полоска — длина записи. Синие — позиционные
// системы, янтарная — римская (непозиционная). ----
draw Graph { name = "gL"; graph = "gl"; edgeWidth = 16; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Text { name = "l0"; pos = (-7.7, 3.60); text = "десятичная"; size = 1; align = left }
draw Text { name = "v0"; pos = (-2.3, 3.60); text = rec(0); size = 1.3; align = left; layer = 6 }
draw Text { name = "l1"; pos = (-7.7, 2.20); text = "двоичная"; size = 1; align = left }
draw Text { name = "v1"; pos = (-2.3, 2.20); text = rec(1); size = 1.3; align = left; layer = 6 }
draw Text { name = "l2"; pos = (-7.7, 0.80); text = "восьмеричная"; size = 1; align = left }
draw Text { name = "v2"; pos = (-2.3, 0.80); text = rec(2); size = 1.3; align = left; layer = 6 }
draw Text { name = "l3"; pos = (-7.7, -0.60); text = "шестнадцатеричная"; size = 1; align = left }
draw Text { name = "v3"; pos = (-2.3, -0.60); text = rec(3); size = 1.3; align = left; layer = 6 }
draw Text { name = "l4"; pos = (-7.7, -2.00); text = "основание " + format(b, 0); size = 1; align = left }
draw Text { name = "v4"; pos = (-2.3, -2.00); text = rec(4); size = 1.3; align = left; layer = 6 }
draw Text { name = "l5"; pos = (-7.7, -3.40); text = "римская"; size = 1; align = left }
draw Text { name = "v5"; pos = (-2.3, -3.40); text = rec(5); size = 1.3; align = left; layer = 6 }

new UI { name = "sN"; type = slider; label = "число"; variable = N; min = 1; max = 999; step = 1; default = 202 }
new UI { name = "sB"; type = slider; label = "основание"; variable = b; min = 2; max = 16; step = 1; default = 7 }

float N = 202; float b = 7; float key = -1; string info = "";

Function md(u, v) { return u - floor(u / v) * v; }
Function dg(d) {
  if (d < 10) { return format(d, 0); }
  if (d == 10) { return "A"; } if (d == 11) { return "B"; } if (d == 12) { return "C" ; }
  if (d == 13) { return "D"; } if (d == 14) { return "E"; } return "F";
}
Function toB(n, q) { string s = ""; float m = n; repeat (10) { if (m > 0) { s = dg(md(m, q)) + s; m = floor(m / q); } } return s; }
Function lenB(n, q) { float m = n; float c = 0; repeat (10) { if (m > 0) { c = c + 1; m = floor(m / q); } } return c; }
Function nv(m) {
  if (m >= 1000) { return 1000; } if (m >= 900) { return 900; } if (m >= 500) { return 500; } if (m >= 400) { return 400; }
  if (m >= 100) { return 100; } if (m >= 90) { return 90; } if (m >= 50) { return 50; } if (m >= 40) { return 40; }
  if (m >= 10) { return 10; } if (m >= 9) { return 9; } if (m >= 5) { return 5; } if (m >= 4) { return 4; } return 1;
}
Function sy(v) {
  if (v == 1000) { return "M"; } if (v == 900) { return "CM"; } if (v == 500) { return "D"; } if (v == 400) { return "CD"; }
  if (v == 100) { return "C"; } if (v == 90) { return "XC"; } if (v == 50) { return "L"; } if (v == 40) { return "XL"; }
  if (v == 10) { return "X"; } if (v == 9) { return "IX"; } if (v == 5) { return "V"; } if (v == 4) { return "IV"; } return "I";
}
Function rn(n) { string s = ""; float m = n; repeat (20) { if (m > 0) { float v = nv(m); s = s + sy(v); m = m - v; } } return s; }
Function rl(n) { string s = ""; float m = n; float c = 0; repeat (20) { if (m > 0) { float v = nv(m); c = c + 1; if (v == 900 || v == 400 || v == 90 || v == 40 || v == 9 || v == 4) { c = c + 1; } m = m - v; } } return c; }
Function rec(k) {
  if (k == 0) { return format(N, 0); } if (k == 1) { return toB(N, 2); } if (k == 2) { return toB(N, 8); }
  if (k == 3) { return toB(N, 16); } if (k == 4) { return toB(N, b); } return rn(N);
}
Function sup(e) {
  if (e == 0) { return ""; } if (e == 1) { return ""; } if (e == 2) { return "²"; } if (e == 3) { return "³"; } if (e == 4) { return "⁴"; }
  if (e == 5) { return "⁵"; } if (e == 6) { return "⁶"; } if (e == 7) { return "⁷"; } if (e == 8) { return "⁸"; } return "⁹";
}
// разложение N по степеням основания q: 2·7² + 0·7 + 2
Function expn(q) {
  string s = ""; float m = N; float L = lenB(N, q);
  repeat (10) {
    float k = L - 1 - i;
    if (k >= 0) { float d = floor(N / pow(q, k)) - q * floor(N / pow(q, k + 1)); if (d > 0) { if (s != "") { s = s + " + "; } s = s + format(d, 0); if (k > 0) { s = s + "·" + format(q, 0) + sup(k); } } }
  }
  return s;
}

Update {
  if (key != N * 100 + b) {
    key = N * 100 + b;
    gl = newGraph();
    repeat (6) {
      float len = 0; if (i == 0) { len = lenB(N, 10); } if (i == 1) { len = lenB(N, 2); } if (i == 2) { len = lenB(N, 8); }
      if (i == 3) { len = lenB(N, 16); } if (i == 4) { len = lenB(N, b); } if (i == 5) { len = rl(N); }
      string c = "#3b82f6"; if (i == 5) { c = "#f59e0b"; }
      string k = format(i, 0);
      addNode(gl, "a" + k, [3.4, 3.6 - 1.4 * i]); addNode(gl, "b" + k, [3.4 + 0.42 * len, 3.6 - 1.4 * i]); addEdge(gl, "a" + k, "b" + k, 1, c);
    }
  }
  info = "**Система счисления** — способ записи чисел. Число " + format(N, 0) + " записано в разных системах; полоски справа показывают, сколько знаков потребовалось.\n\n";
  info = info + "**Позиционные** системы (синие): значение цифры зависит от места и основания. По основанию " + format(b, 0) + " запись " + toB(N, b) + " означает " + expn(b) + " = " + format(N, 0) + ". Чем меньше основание, тем длиннее запись; различных цифр в системе ровно столько, каково основание.\n\n";
  info = info + "**Непозиционная** система (римская, янтарная): знак имеет постоянное значение, число получается сложением и вычитанием знаков. Записи разных чисел получаются разной длины, нуля нет.";
}
]
