[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Столбик в системе с основанием p: сверху — вес разряда и переносы (заём), затем A, B, результат. ----
draw Graph { name = "gL"; graph = "gl"; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false }
draw Text { name = "opT"; pos = (-6.9, 0.4); text = sgn; size = 1.8; color = #f59e0b }
draw Text { name = "pT"; pos = (-6.9, 4.2); text = "вес"; size = 0.8; align = center }
draw Text { name = "wt0"; pos = (4.9, 4.2); text = format(pow(p, 0), 0); size = 0.8; active = 0 < lenR }
draw Text { name = "cr0"; pos = (4.9, 2.9); text = cmark(0); size = 1.2; color = #f59e0b; active = 0 > 0 && cr[0] > 0 }
draw Text { name = "a0"; pos = (4.9, 1.7); text = hx(da[0]); size = 1.7; active = 0 < lenA }
draw Text { name = "b0"; pos = (4.9, 0.4); text = hx(db[0]); size = 1.7; active = 0 < lenB }
draw Text { name = "r0"; pos = (4.9, -1.4); text = hx(rs[0]); size = 1.7; color = #3b82f6; active = 0 < lenR }
draw Text { name = "wt1"; pos = (3.8, 4.2); text = format(pow(p, 1), 0); size = 0.8; active = 1 < lenR }
draw Text { name = "cr1"; pos = (3.8, 2.9); text = cmark(1); size = 1.2; color = #f59e0b; active = 1 > 0 && cr[1] > 0 }
draw Text { name = "a1"; pos = (3.8, 1.7); text = hx(da[1]); size = 1.7; active = 1 < lenA }
draw Text { name = "b1"; pos = (3.8, 0.4); text = hx(db[1]); size = 1.7; active = 1 < lenB }
draw Text { name = "r1"; pos = (3.8, -1.4); text = hx(rs[1]); size = 1.7; color = #3b82f6; active = 1 < lenR }
draw Text { name = "wt2"; pos = (2.7, 4.2); text = format(pow(p, 2), 0); size = 0.8; active = 2 < lenR }
draw Text { name = "cr2"; pos = (2.7, 2.9); text = cmark(2); size = 1.2; color = #f59e0b; active = 2 > 0 && cr[2] > 0 }
draw Text { name = "a2"; pos = (2.7, 1.7); text = hx(da[2]); size = 1.7; active = 2 < lenA }
draw Text { name = "b2"; pos = (2.7, 0.4); text = hx(db[2]); size = 1.7; active = 2 < lenB }
draw Text { name = "r2"; pos = (2.7, -1.4); text = hx(rs[2]); size = 1.7; color = #3b82f6; active = 2 < lenR }
draw Text { name = "wt3"; pos = (1.6, 4.2); text = format(pow(p, 3), 0); size = 0.8; active = 3 < lenR }
draw Text { name = "cr3"; pos = (1.6, 2.9); text = cmark(3); size = 1.2; color = #f59e0b; active = 3 > 0 && cr[3] > 0 }
draw Text { name = "a3"; pos = (1.6, 1.7); text = hx(da[3]); size = 1.7; active = 3 < lenA }
draw Text { name = "b3"; pos = (1.6, 0.4); text = hx(db[3]); size = 1.7; active = 3 < lenB }
draw Text { name = "r3"; pos = (1.6, -1.4); text = hx(rs[3]); size = 1.7; color = #3b82f6; active = 3 < lenR }
draw Text { name = "wt4"; pos = (0.5, 4.2); text = format(pow(p, 4), 0); size = 0.8; active = 4 < lenR }
draw Text { name = "cr4"; pos = (0.5, 2.9); text = cmark(4); size = 1.2; color = #f59e0b; active = 4 > 0 && cr[4] > 0 }
draw Text { name = "a4"; pos = (0.5, 1.7); text = hx(da[4]); size = 1.7; active = 4 < lenA }
draw Text { name = "b4"; pos = (0.5, 0.4); text = hx(db[4]); size = 1.7; active = 4 < lenB }
draw Text { name = "r4"; pos = (0.5, -1.4); text = hx(rs[4]); size = 1.7; color = #3b82f6; active = 4 < lenR }
draw Text { name = "wt5"; pos = (-0.6, 4.2); text = format(pow(p, 5), 0); size = 0.8; active = 5 < lenR }
draw Text { name = "cr5"; pos = (-0.6, 2.9); text = cmark(5); size = 1.2; color = #f59e0b; active = 5 > 0 && cr[5] > 0 }
draw Text { name = "a5"; pos = (-0.6, 1.7); text = hx(da[5]); size = 1.7; active = 5 < lenA }
draw Text { name = "b5"; pos = (-0.6, 0.4); text = hx(db[5]); size = 1.7; active = 5 < lenB }
draw Text { name = "r5"; pos = (-0.6, -1.4); text = hx(rs[5]); size = 1.7; color = #3b82f6; active = 5 < lenR }
draw Text { name = "wt6"; pos = (-1.7, 4.2); text = format(pow(p, 6), 0); size = 0.8; active = 6 < lenR }
draw Text { name = "cr6"; pos = (-1.7, 2.9); text = cmark(6); size = 1.2; color = #f59e0b; active = 6 > 0 && cr[6] > 0 }
draw Text { name = "a6"; pos = (-1.7, 1.7); text = hx(da[6]); size = 1.7; active = 6 < lenA }
draw Text { name = "b6"; pos = (-1.7, 0.4); text = hx(db[6]); size = 1.7; active = 6 < lenB }
draw Text { name = "r6"; pos = (-1.7, -1.4); text = hx(rs[6]); size = 1.7; color = #3b82f6; active = 6 < lenR }
draw Text { name = "wt7"; pos = (-2.8, 4.2); text = format(pow(p, 7), 0); size = 0.8; active = 7 < lenR }
draw Text { name = "cr7"; pos = (-2.8, 2.9); text = cmark(7); size = 1.2; color = #f59e0b; active = 7 > 0 && cr[7] > 0 }
draw Text { name = "a7"; pos = (-2.8, 1.7); text = hx(da[7]); size = 1.7; active = 7 < lenA }
draw Text { name = "b7"; pos = (-2.8, 0.4); text = hx(db[7]); size = 1.7; active = 7 < lenB }
draw Text { name = "r7"; pos = (-2.8, -1.4); text = hx(rs[7]); size = 1.7; color = #3b82f6; active = 7 < lenR }
draw Text { name = "wt8"; pos = (-3.9, 4.2); text = format(pow(p, 8), 0); size = 0.8; active = 8 < lenR }
draw Text { name = "cr8"; pos = (-3.9, 2.9); text = cmark(8); size = 1.2; color = #f59e0b; active = 8 > 0 && cr[8] > 0 }
draw Text { name = "a8"; pos = (-3.9, 1.7); text = hx(da[8]); size = 1.7; active = 8 < lenA }
draw Text { name = "b8"; pos = (-3.9, 0.4); text = hx(db[8]); size = 1.7; active = 8 < lenB }
draw Text { name = "r8"; pos = (-3.9, -1.4); text = hx(rs[8]); size = 1.7; color = #3b82f6; active = 8 < lenR }
draw Text { name = "wt9"; pos = (-5.0, 4.2); text = format(pow(p, 9), 0); size = 0.8; active = 9 < lenR }
draw Text { name = "cr9"; pos = (-5.0, 2.9); text = cmark(9); size = 1.2; color = #f59e0b; active = 9 > 0 && cr[9] > 0 }
draw Text { name = "a9"; pos = (-5.0, 1.7); text = hx(da[9]); size = 1.7; active = 9 < lenA }
draw Text { name = "b9"; pos = (-5.0, 0.4); text = hx(db[9]); size = 1.7; active = 9 < lenB }
draw Text { name = "r9"; pos = (-5.0, -1.4); text = hx(rs[9]); size = 1.7; color = #3b82f6; active = 9 < lenR }

new UI { name = "sO"; type = select; label = "операция"; variable = op; options = ("add", "sub", "mul"); labels = ("сложение A + B", "вычитание A − B", "умножение A × цифра"); default = "add" }
new UI { name = "sP"; type = slider; label = "основание p"; variable = p; min = 2; max = 16; step = 1; default = 8 }
new UI { name = "sA"; type = slider; label = "A (десятичное значение)"; variable = A; min = 0; max = 500; step = 1; default = 253 }
new UI { name = "sB"; type = slider; label = "B (при умножении — цифра)"; variable = B; min = 0; max = bmax; step = 1; default = 166 }

// ---- Логика ----
string op = "add"; float p = 8; float A = 253; float B = 166;
float bmax = 500; float bb = 166; float lenA = 1; float lenB = 1; float lenR = 1; float val = 0;
list da = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
list db = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
list rs = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
list cr = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
float built = 0; string sgn = "+"; string info = "";

Function num(x) { if (x < 0) { return "−" + format(-x, 0); } return format(x, 0); }
Function md(a, m) { return a - floor(a / m) * m; }
Function hx(d) { if (d < 10) { return format(d, 0); } if (d == 10) { return "A"; } if (d == 11) { return "B"; } if (d == 12) { return "C"; } if (d == 13) { return "D"; } if (d == 14) { return "E"; } if (d == 15) { return "F"; } return "G"; }
Function lenOf(x) { float l = 1; repeat (10) { if (x >= pow(p, i + 1)) { l = i + 2; } } return l; }
Function cmark(c) { if (op == "sub") { return "−" + hx(cr[c]); } return hx(cr[c]); }
Function wr(x) { string r = ""; float n = lenOf(x); repeat (n) { r = r + hx(md(floor(x / pow(p, n - 1 - i)), p)); } return r; }

Update {
  if (built == 0) { gl = newGraph(); addNode(gl, "l1", [-6.2, -0.4]); addNode(gl, "l2", [5.7, -0.4]); addEdge(gl, "l1", "l2"); built = 1; }
  bmax = 500; if (op == "mul") { bmax = p - 1; } if (op == "sub") { bmax = A; }
  bb = min(B, bmax);
  if (op == "add") { sgn = "+"; val = A + bb; }
  if (op == "sub") { sgn = "−"; val = A - bb; }
  if (op == "mul") { sgn = "×"; val = A * bb; }
  lenA = lenOf(A); lenB = lenOf(bb); lenR = lenOf(val);
  if (op == "mul") { lenB = 1; }
  float cin = 0; float ncar = 0; float first = -1; string fs = "";
  repeat (12) {
    float a = md(floor(A / pow(p, i)), p);
    float b = md(floor(bb / pow(p, i)), p);
    if (op == "mul") { b = bb; if (i > 0) { b = 0; } }
    da[i] = a; db[i] = b; cr[i] = cin;
    float t = a + b + cin; float cout = 0; float r = 0;
    if (op == "add") { r = md(t, p); cout = floor(t / p); }
    if (op == "sub") { t = a - b - cin; r = t; if (t < 0) { r = t + p; cout = 1; } }
    if (op == "mul") { t = a * bb + cin; r = md(t, p); cout = floor(t / p); }
    if (cout > 0 && first < 0) {
      first = i;
      if (op == "add") { fs = "в разряде " + format(i, 0) + " сумма " + hx(a) + " + " + hx(b) + " + " + hx(cin) + " = " + format(t, 0) + " ≥ " + format(p, 0) + ": пишем " + hx(r) + ", переносим 1"; }
      if (op == "sub") { fs = "в разряде " + format(i, 0) + " цифры " + hx(a) + " − " + hx(b) + " − " + hx(cin) + " < 0: занимаем единицу старшего разряда (она равна " + format(p, 0) + "), получаем " + num(t) + " + " + format(p, 0) + " = " + hx(r); }
      if (op == "mul") { fs = "в разряде " + format(i, 0) + " произведение " + hx(a) + "·" + hx(bb) + " + " + hx(cin) + " = " + format(t, 0) + " = " + hx(cout) + "·" + format(p, 0) + " + " + hx(r) + ": пишем " + hx(r) + ", переносим " + hx(cout); }
    }
    if (cout > 0) { ncar = ncar + 1; }
    rs[i] = r; cin = cout;
    cr[i + 1] = cout;
  }
  info = "**Арифметика в системе с основанием p = " + format(p, 0) + ".** Операции выполняются поразрядно справа налево, как в десятичной системе; меняется лишь порог: ";
  if (op == "add") { info = info + "перенос в следующий разряд возникает, когда сумма цифр (с переносом) достигает **" + format(p, 0) + "**, и он не больше единицы.\n\n"; }
  if (op == "sub") { info = info + "заём возникает, когда уменьшаемая цифра меньше вычитаемой, а единица старшего разряда равна **" + format(p, 0) + "** единицам младшего.\n\n"; }
  if (op == "mul") { info = info + "перенос равен целой части от деления произведения на **" + format(p, 0) + "**, в разряде остаётся остаток; произведение цифр меньше p², поэтому перенос — одна цифра.\n\n"; }
  info = info + wr(A) + " " + sgn + " " + wr(bb) + " = **" + wr(val) + "** (в системе " + format(p, 0) + ").";
  if (first >= 0) { if (op == "sub") { info = info + " Первый заём: " + fs + "."; } else { info = info + " Первый перенос: " + fs + "."; } } else { info = info + " Переносов и заёмов нет."; }
  info = info + "\n\nПроверка в десятичной системе: " + format(A, 0) + " " + sgn + " " + format(bb, 0) + " = " + format(val, 0) + ".";
}
]
