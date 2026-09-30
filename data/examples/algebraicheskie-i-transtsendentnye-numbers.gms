[
description = "{info}"

field width = 10;
field height = 6;
camera type = fixed;

// ---- Точка α на оси и график найденного многочлена p с целыми коэффициентами: у алгебраического
// числа график проходит ровно через α, у трансцендентного — лишь рядом (p(α) ≠ 0 всегда). ----
func f(x) = bc0 + bc1 * x + bc2 * x * x + bc3 * x * x * x + bc4 * x * x * x * x;
draw Function { name = "gr"; f = "f"; xmin = -5; xmax = 5; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "A"; pos = (0, 0); label = "α"; dynamic = false; collision = false; color = #f59e0b }

new UI { type = select; label = "число α"; variable = pre; options = (0, 1, 2, 3, 4, 5, 6, 7); labels = ("3/2", "√2", "∛2", "⁴√2", "φ = (1 + √5)/2", "π", "e", "ln 2"); default = 1 }
new UI { type = slider; label = "степень d"; variable = dg; min = 1; max = 4; step = 1; default = 2 }
new UI { type = slider; label = "коэффициенты до H"; variable = H; min = 1; max = Hm; step = 1; default = 3 }

float pre = 1; float dg = 2; float H = 3; float Hm = 12; float al = 1.41421356; float key = -1;
float bc0 = 0; float bc1 = 0; float bc2 = 0; float bc3 = 0; float bc4 = 0; float bv = 1; float bh = 1000; float cnt = 0;
string info = "";

Function md(v, q) { return v - q * floor(v / q); }
Function num(v, d) { if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Function cf(j) { if (j == 0) { return bc0; } if (j == 1) { return bc1; } if (j == 2) { return bc2; } if (j == 3) { return bc3; } return bc4; }
Function xp(j) { if (j == 0) { return ""; } if (j == 1) { return "x"; } if (j == 2) { return "x²"; } if (j == 3) { return "x³"; } return "x⁴"; }
// многочлен строкой: −2x² + x − 3
Function poly() {
  string s = ""; float sg = 1;
  repeat (5) { if (cf(4 - i) != 0 && sg == 1 && cf(4 - i) < 0) { sg = -2; } if (cf(4 - i) != 0 && sg == 1) { sg = 2; } }
  if (sg == -2) { sg = -1; } if (sg == 2) { sg = 1; }
  repeat (5) {
    float j = 4 - i; float c = sg * cf(j);
    if (c != 0) {
      if (s == "") { if (c < 0) { s = "−"; } } if (s != "" && s != "−") { if (c < 0) { s = s + " − "; } if (c > 0) { s = s + " + "; } }
      float ac = abs(c);
      if (ac != 1 || j == 0) { s = s + format(ac, 0); }
      s = s + xp(j);
    }
  }
  return s;
}
Function known() {
  if (pre == 0) { return "α рационально: корень 2x − 3, степень 1."; }
  if (pre == 1) { return "α — корень x² − 2, алгебраическое число степени 2."; }
  if (pre == 2) { return "α — корень x³ − 2, алгебраическое число степени 3."; }
  if (pre == 3) { return "α — корень x⁴ − 2, алгебраическое число степени 4."; }
  if (pre == 4) { return "α — корень x² − x − 1, алгебраическое число степени 2."; }
  if (pre == 5) { return "π трансцендентно (Линдеман, 1882): p(π) ≠ 0 для любого ненулевого многочлена с целыми коэффициентами."; }
  if (pre == 6) { return "e трансцендентно (Эрмит, 1873): p(e) ≠ 0 для любого ненулевого многочлена с целыми коэффициентами."; }
  return "ln 2 трансцендентно (следствие теоремы Линдемана — Вейерштрасса): p(ln 2) ≠ 0 для любого ненулевого многочлена с целыми коэффициентами.";
}

Update {
  Hm = 12; if (dg == 3) { Hm = 7; } if (dg == 4) { Hm = 4; }
  if (pre == 0) { al = 1.5; } if (pre == 1) { al = sqrt(2); } if (pre == 2) { al = pow(2, 1 / 3); } if (pre == 3) { al = pow(2, 0.25); }
  if (pre == 4) { al = (1 + sqrt(5)) / 2; } if (pre == 5) { al = 3.14159265358979; } if (pre == 6) { al = 2.71828182845905; } if (pre == 7) { al = log(2); }
  if (key != pre * 10000 + dg * 100 + H) {
    float m = 2 * H + 1; float M = pow(m, dg + 1);
    bv = 1000000; bh = 1000; cnt = M - 1;
    float a1 = al; float a2 = al * al; float a3 = a2 * al; float a4 = a2 * a2;
    repeat (M) {
      float r = i; float c0 = md(r, m) - H; r = floor(r / m);
      float c1 = md(r, m) - H; r = floor(r / m); float c2 = 0; float c3 = 0; float c4 = 0;
      if (dg >= 2) { c2 = md(r, m) - H; r = floor(r / m); } if (dg >= 3) { c3 = md(r, m) - H; r = floor(r / m); } if (dg >= 4) { c4 = md(r, m) - H; }
      float h = abs(c0) + abs(c1) + abs(c2) + abs(c3) + abs(c4);
      if (h > 0) {
        float v = abs(c0 + c1 * a1 + c2 * a2 + c3 * a3 + c4 * a4);
        if (v < bv - 0.000000000001 || (v < 0.000000001 && bv < 0.000000001 && h < bh)) { bv = v; bh = h; bc0 = c0; bc1 = c1; bc2 = c2; bc3 = c3; bc4 = c4; }
      }
    }
    key = pre * 10000 + dg * 100 + H;
  }
  A.pos.x = al; A.pos.y = 0;
  info = "**Алгебраическое число** — корень ненулевого многочлена с рациональными (равносильно — целыми) коэффициентами; остальные вещественные числа — **трансцендентные**. Число α ≈ **" + format(al, 8) + "**.\n\n";
  info = info + "Среди " + format(cnt, 0) + " ненулевых многочленов степени ≤ " + format(dg, 0) + " с целыми коэффициентами, по модулю не больше " + format(H, 0) + ", наименьшее значение |p(α)| = " + (bv < 0.000000001 ? "0" : format(bv, 9)) + " даёт p(x) = **" + poly() + "**. ";
  if (bv < 0.000000001) { info = info + "Это нуль: α — корень p, значит, α **алгебраическое**, а его степень не больше " + format(dg, 0) + ".\n\n"; }
  if (bv >= 0.000000001) { info = info + "Нуля нет: ни один многочлен из перебранных не обращается в нуль в α (график проходит рядом с α, но не через неё). Из этого ещё не следует трансцендентность — возможно, нужны большие степень или коэффициенты.\n\n"; }
  info = info + "Известно: " + known();
}
]
