[
description = "{info}"

field width = 18;
field height = 12;
camera type = fixed;

// ---- Столбики: члены разложения (вкладка 1) или коэффициенты (вкладка 2) ----
new Point { name = "Z1"; pos = (-8.5, 0.8); dynamic = false; active = false }
new Point { name = "Z2"; pos = (8.5, 0.8); dynamic = false; active = false }
new Line { name = "base"; pos = (Z1, Z2); interact = false; thickness = 1 }
draw Graph { name = "gUp"; graph = "gu"; nodeRadius = 0; labels = false; interactive = false; showWeights = false; edgeWidth = 54; edgeCap = butt; layer = 8 }
draw Graph { name = "gDn"; graph = "gd"; nodeRadius = 0; labels = false; interactive = false; showWeights = false; edgeWidth = 54; edgeCap = butt; layer = 8 }
draw Text { name = "tc0"; pos = ((0 - n / 2) * 1.8, -3.4); text = coefLabel(0); active = n >= 0 }
draw Text { name = "tc1"; pos = ((1 - n / 2) * 1.8, -3.4); text = coefLabel(1); active = n >= 1 }
draw Text { name = "tc2"; pos = ((2 - n / 2) * 1.8, -3.4); text = coefLabel(2); active = n >= 2 }
draw Text { name = "tc3"; pos = ((3 - n / 2) * 1.8, -3.4); text = coefLabel(3); active = n >= 3 }
draw Text { name = "tc4"; pos = ((4 - n / 2) * 1.8, -3.4); text = coefLabel(4); active = n >= 4 }
draw Text { name = "tc5"; pos = ((5 - n / 2) * 1.8, -3.4); text = coefLabel(5); active = n >= 5 }
draw Text { name = "tc6"; pos = ((6 - n / 2) * 1.8, -3.4); text = coefLabel(6); active = n >= 6 }
draw Text { name = "tc7"; pos = ((7 - n / 2) * 1.8, -3.4); text = coefLabel(7); active = n >= 7 }
draw Text { name = "tc8"; pos = ((8 - n / 2) * 1.8, -3.4); text = coefLabel(8); active = n >= 8 }

// ---- Вкладка 1: числа a и b — перетаскиваемые точки на двух осях ----
new Point { name = "GA1"; pos = (-6, -4.4); dynamic = false; active = false }
new Point { name = "GA2"; pos = (6, -4.4); dynamic = false; active = false }
new Line { name = "guideA"; pos = (GA1, GA2); interact = false; thickness = 2 }
new Point { name = "GB1"; pos = (-6, -5.2); dynamic = false; active = false }
new Point { name = "GB2"; pos = (6, -5.2); dynamic = false; active = false }
new Line { name = "guideB"; pos = (GB1, GB2); interact = false; thickness = 2 }
new Point { name = "A"; line = "guideA"; t = 0.75; text = true("a"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "B"; line = "guideB"; t = 0.4167; text = true("b"); pauseOnDrag = false; collideWithPoints = false }
new Claster { name = "tabTerms"; elements = (GA1, GA2, guideA, GB1, GB2, guideB, A, B); active = true }

new UI { name = "btnTerms"; type = button; label = "Разложение (a + b)ⁿ"; action = "tab = 1; tabTerms.active = true" }
new UI { name = "btnCoef"; type = button; label = "Коэффициенты"; action = "tab = 2; tabTerms.active = false" }

float tab = 1;
float n = 4;
float sg = 1;
float key = -1;
float a = 1.5;
float b = -0.5;
string info = "";
new UI { name = "sN"; type = slider; label = "степень n"; variable = n; min = 1; max = 8; step = 1; default = 4 }
new UI { name = "sSg"; type = select; label = "двучлен"; variable = sg; options = (1, 2); labels = ("(a + b)ⁿ", "(a − b)ⁿ"); default = 1; active = tab == 2 }

Function C(m, k) {
  float v = 1;
  repeat (8) { if (i < k) { v = v * (m - i) / (i + 1); } }
  return round(v);
}
// Число с десятичной запятой и настоящим знаком минус; в скобках, если отрицательное
Function num(v, d) {
  if (round(v * pow(10, d)) < 0) { return "−" + format(abs(v), d); }
  return format(abs(v), d);
}
Function numP(v, d) {
  if (round(v * pow(10, d)) < 0) { return "(" + num(v, d) + ")"; }
  return num(v, d);
}
Function coefLabel(k) {
  string lab = format(C(n, k), 0);
  if (tab == 2 && sg == 2 && k % 2 == 1) { lab = "−" + lab; }
  return lab;
}
func term(k) = C(n, k) * pow(a, n - k) * pow(b, k);

Update {
  float n2 = round(n);
  n = n2;
  a = round(A.pos.x / 2 * 100) / 100;
  b = round(B.pos.x / 2 * 100) / 100;
  float s = 1; if (round(sg) == 2) { s = -1; }

  float k2 = tab * 1000000 + n2 * 100000 + a * 1000 + b * 10 + s;
  if (k2 != key) {
    key = k2;
    gu = newGraph(); gd = newGraph();
    // высота самого большого столбика — 3,6 единицы
    float mx = 0.000001;
    repeat (9) {
      if (i <= n2) {
        float v = C(n2, i) * pow(s, i);
        if (tab == 1) { v = term(i); }
        mx = max(mx, abs(v));
      }
    }
    repeat (9) {
      if (i <= n2) {
        float v2 = C(n2, i) * pow(s, i);
        if (tab == 1) { v2 = term(i); }
        float x = (i - n2 / 2) * 1.8;
        float h = 3.6 * v2 / mx;
        if (v2 >= 0) { addNode(gu, "u0" + format(i, 0), [x, 0.8]); addNode(gu, "u1" + format(i, 0), [x, 0.8 + h]); addEdge(gu, "u0" + format(i, 0), "u1" + format(i, 0), 1, "#3b82f6"); }
        else { addNode(gd, "d0" + format(i, 0), [x, 0.8]); addNode(gd, "d1" + format(i, 0), [x, 0.8 + h]); addEdge(gd, "d0" + format(i, 0), "d1" + format(i, 0), 1, "#f59e0b"); }
      }
    }
  }

  float sumC = 0;
  string cl = "";
  repeat (9) { if (i <= n2) { sumC = sumC + C(n2, i); if (cl != "") { cl = cl + ", "; } cl = cl + format(C(n2, i), 0); } }

  if (tab == 1) {
    string ts = "";
    float tot = 0;
    repeat (9) { if (i <= n2) { tot = tot + term(i); if (ts != "") { ts = ts + "; "; } ts = ts + num(term(i), 2); } }
    info = "**Бином Ньютона:** \\((a + b)^{n} = \\sum_{k=0}^{n} C_{n}^{k} a^{n-k} b^{k}\\). При a = " + num(a, 2) + ", b = " + num(b, 2) + " и n = " + format(n2, 0) + " в разложении \\(" + format(n2 + 1, 0) + "\\) членов (столбики), коэффициенты которых — " + cl + ".\n\nЧлены \\(C_{n}^{k} a^{n-k} b^{k}\\): " + ts + ". Их сумма \\(" + num(tot, 2) + "\\) равна \\((" + num(a, 2) + " + " + numP(b, 2) + ")^{" + format(n2, 0) + "} = " + num(pow(a + b, n2), 2) + "\\).\n\nПодпись под столбиком — биномиальный коэффициент. Синие столбики — члены с плюсом, оранжевые — с минусом (при отрицательном b знаки членов чередуются).";
  } else {
    info = "**Число членов** в разложении равно \\(n + 1 = " + format(n2 + 1, 0) + "\\). Коэффициенты " + cl + " **симметричны**: \\(C_{n}^{k} = C_{n}^{n-k}\\), поскольку выбор позиций для a и для b равносилен.\n\n**Сумма коэффициентов** равна \\(2^{n} = " + format(pow(2, n2), 0) + "\\): при a = b = 1 каждый из n множителей даёт либо a, либо b.";
    if (s < 0) { info = info + "\n\n**Замена знака** одного из слагаемых чередует знаки: в \\((a - b)^{n}\\) члены с нечётной степенью b входят с минусом (оранжевые столбики), и сумма коэффициентов с учётом знаков равна нулю."; }
  }
}
]
