[
description = "{info}"

field width = 10;
field height = 10;
camera type = fixed;

// ---- Многочлен P(x) = a·(x − x₁)…(x − xₙ). Корни — точки на оси x; коэффициенты после раскрытия
// скобок считаются из корней как элементарные симметрические суммы s₁…sₙ. ----
float n = 4; float a = 1; float s1 = 0; float s2 = 0; float s3 = 0; float s4 = 0; string info = "";
new Point { name = "X1"; pos = (-2, 0); text = true("x₁"); pauseOnDrag = false }
new Point { name = "X2"; pos = (-0.5, 0); text = true("x₂"); pauseOnDrag = false; active = n > 1.5 }
new Point { name = "X3"; pos = (0.8, 0); text = true("x₃"); pauseOnDrag = false; active = n > 2.5 }
new Point { name = "X4"; pos = (2, 0); text = true("x₄"); pauseOnDrag = false; active = n > 3.5 }

Function P(x) {
  float v = a * (x - X1.pos.x);
  if (n > 1.5) { v = v * (x - X2.pos.x); }
  if (n > 2.5) { v = v * (x - X3.pos.x); }
  if (n > 3.5) { v = v * (x - X4.pos.x); }
  return v;
}
draw Function { name = "gr"; f = "P"; xmin = -5; xmax = 5; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "степень n"; variable = n; min = 2; max = 4; step = 1; default = 4 }
new UI { type = slider; label = "ведущий коэффициент a"; variable = a; min = 0.5; max = 3; step = 0.5; default = 1 }

Function num(x, d) { if (abs(x) < 0.5 * pow(10, -d)) { return format(0, d); } if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function term(c, m) { if (abs(c) < 0.005) { return ""; } if (c < 0) { return " − " + format(-c, 2) + m; } return " + " + format(c, 2) + m; }
Function xp(m) { if (m == 0) { return ""; } if (m == 1) { return "x"; } if (m == 2) { return "x²"; } if (m == 3) { return "x³"; } return "x⁴"; }
Function sv(k) { if (k == 1) { return s1; } if (k == 2) { return s2; } if (k == 3) { return s3; } return s4; }
Function sub(k) { if (k == 1) { return "s₁"; } if (k == 2) { return "s₂"; } if (k == 3) { return "s₃"; } return "s₄"; }
Function sdef(k) {
  if (k == 1) { return "x₁ + x₂ + …"; }
  if (k == n) { return "x₁·x₂·…·xₙ"; }
  return "сумма произведений корней по " + format(k, 0);
}

Update {
  if (abs(X1.pos.y) > 0.0001) { X1.pos.y = 0; }
  if (abs(X2.pos.y) > 0.0001) { X2.pos.y = 0; }
  if (abs(X3.pos.y) > 0.0001) { X3.pos.y = 0; }
  if (abs(X4.pos.y) > 0.0001) { X4.pos.y = 0; }
  float x1 = X1.pos.x; float x2 = X2.pos.x; float x3 = X3.pos.x; float x4 = X4.pos.x;
  if (n < 2.5) { s1 = x1 + x2; s2 = x1 * x2; s3 = 0; s4 = 0; }
  if (n > 2.5 && n < 3.5) { s1 = x1 + x2 + x3; s2 = x1 * x2 + x1 * x3 + x2 * x3; s3 = x1 * x2 * x3; s4 = 0; }
  if (n > 3.5) { s1 = x1 + x2 + x3 + x4; s2 = x1 * x2 + x1 * x3 + x1 * x4 + x2 * x3 + x2 * x4 + x3 * x4; s3 = x1 * x2 * x3 + x1 * x2 * x4 + x1 * x3 * x4 + x2 * x3 * x4; s4 = x1 * x2 * x3 * x4; }
  float m = round(n);
  string q = xp(m);
  repeat (m) {
    float k = i + 1;
    float sg = 1;
    if (k - 2 * floor(k / 2) > 0.5) { sg = -1; }
    q = q + term(sg * sv(k), xp(m - k));
  }
  string t = "**Приведённый многочлен** P(x)/a = (x − x₁)·…·(x − xₙ) = " + q + ".\n\n";
  repeat (m) {
    float k = i + 1;
    float sg = 1;
    if (k - 2 * floor(k / 2) > 0.5) { sg = -1; }
    string sgn = "+";
    if (sg < 0) { sgn = "−"; }
    t = t + "**" + sub(k) + "** = " + sdef(k) + " = " + num(sv(k), 2) + "; коэффициент при " + xp(m - k) + " у P(x) равен " + sgn + "a·" + sub(k) + " = " + num(a * sg * sv(k), 2) + ".\n\n";
  }
  info = t + "Знаки коэффициентов чередуются: при " + xp(m - 1) + " стоит −a·s₁, при следующей степени +a·s₂, и так далее. Отсутствие члена при " + xp(m - 1) + " означает s₁ = 0 — сумма корней равна нулю.";
}
]
