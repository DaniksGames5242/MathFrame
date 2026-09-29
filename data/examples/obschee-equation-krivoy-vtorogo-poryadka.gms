[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
show axes = true;
float A = 1; float B = 1; float C = 2; float D = 0; float E = 0; float F = -9; string info = "";
func q(x, y) = A * x * x + B * x * y + C * y * y + D * x + E * y + F;
draw Region { name = "rq"; f = "q"; op = "<"; level = 0; color = #3b82f6; opacity = 0.15; quality = 3 }
new UI { type = slider; label = "A"; variable = A; min = -2; max = 2; step = 0.1; default = 1 }
new UI { type = slider; label = "B"; variable = B; min = -2; max = 2; step = 0.1; default = 1 }
new UI { type = slider; label = "C"; variable = C; min = -2; max = 2; step = 0.1; default = 2 }
new UI { type = slider; label = "D"; variable = D; min = -8; max = 8; step = 0.5; default = 0 }
new UI { type = slider; label = "E"; variable = E; min = -8; max = 8; step = 0.5; default = 0 }
new UI { type = slider; label = "F"; variable = F; min = -16; max = 16; step = 0.5; default = -9 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function term(x, d) { if (x < 0) { return " − " + format(-x, d); } return " + " + format(x, d); }
Update {
  string eq = num(A, 1) + "·x²" + term(B, 1) + "·xy" + term(C, 1) + "·y²" + term(D, 1) + "·x" + term(E, 1) + "·y" + term(F, 1) + " = 0";
  float det = A * C - B * B / 4;
  string part = "";
  if (abs(A) < 0.001 && abs(B) < 0.001 && abs(C) < 0.001) {
    part = "Все квадратичные коэффициенты равны нулю: порядок уравнения ниже второго, оно задаёт прямую, а не кривую второго порядка.";
  } else {
    if (abs(B) < 0.001) { part = "При B = 0 оси симметрии кривой параллельны осям координат."; }
    else { part = "При B ≠ 0 кривая повёрнута относительно осей координат."; }
  }
  info = "**Общее уравнение** Ax² + Bxy + Cy² + Dx + Ey + F = 0 — здесь " + eq + ".\n\nКвадратичная часть (A, B, C) задаётся симметричной матрицей с элементами " + num(A, 1) + ", " + num(B / 2, 2) + "; " + num(B / 2, 2) + ", " + num(C, 1) + " и определителем AC − B²/4 = " + num(det, 2) + "; линейная часть — Dx + Ey, постоянный член — F = " + num(F, 1) + ".\n\n" + part;
}
]
