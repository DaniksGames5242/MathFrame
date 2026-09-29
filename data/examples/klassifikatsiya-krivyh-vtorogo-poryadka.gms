[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
show axes = true;
float A = 1; float B = 0; float C = -1; float D = 0; float E = 0; float F = -4; float ex = 0; float ey = 0; float act = 1; string info = "";
func q(x, y) = A * x * x + B * x * y + C * y * y + D * x + E * y + F;
draw Region { name = "rq"; f = "q"; op = "<"; level = 0; color = #3b82f6; opacity = 0.15; quality = 3 }
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; text = true("O"); active = act > 0.5 }
new UI { type = slider; label = "A"; variable = A; min = -2; max = 2; step = 0.1; default = 1 }
new UI { type = slider; label = "B"; variable = B; min = -2; max = 2; step = 0.1; default = 0 }
new UI { type = slider; label = "C"; variable = C; min = -2; max = 2; step = 0.1; default = -1 }
new UI { type = slider; label = "D"; variable = D; min = -8; max = 8; step = 0.5; default = 0 }
new UI { type = slider; label = "E"; variable = E; min = -8; max = 8; step = 0.5; default = 0 }
new UI { type = slider; label = "F"; variable = F; min = -16; max = 16; step = 0.5; default = -4 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function kind(i1, i2, i3, k, flat) {
  if (flat > 0) { return "уравнение первой степени — прямая (порядок ниже второго)"; }
  if (abs(i3) > 0.000001) {
    if (i2 > 0.000001) { if (i1 * i3 < 0) { return "эллипс"; } return "мнимый эллипс (действительных точек нет)"; }
    if (i2 < -0.000001) { return "гипербола"; }
    return "парабола";
  }
  if (i2 > 0.000001) { return "точка (вырожденный эллипс)"; }
  if (i2 < -0.000001) { return "пара пересекающихся прямых"; }
  if (k < -0.000001) { return "пара параллельных прямых"; }
  if (k > 0.000001) { return "пара мнимых параллельных прямых (действительных точек нет)"; }
  return "одна прямая (двойная)";
}
Update {
  float i1 = A + C;
  float i2 = A * C - B * B / 4;
  float i3 = A * (C * F - E * E / 4) - (B / 2) * (B / 2 * F - E * D / 4) + (D / 2) * (B * E / 4 - C * D / 2);
  float kk = A * F - D * D / 4 + C * F - E * E / 4;
  float flat = 0;
  if (abs(A) < 0.001 && abs(B) < 0.001 && abs(C) < 0.001) { flat = 1; }
  act = 0;
  if (flat < 0.5 && abs(i2) > 0.000001) { act = 1; ex = (B * E - 2 * C * D) / (4 * i2); ey = (B * D - 2 * A * E) / (4 * i2); O.pos.x = ex; O.pos.y = ey; }
  string cls = "параболический (δ = 0)";
  if (i2 > 0.000001) { cls = "эллиптический (δ > 0)"; }
  if (i2 < -0.000001) { cls = "гиперболический (δ < 0)"; }
  if (flat > 0) { cls = "—"; }
  string cen = "";
  if (act > 0.5) { cen = " Центр симметрии — точка O(" + num(ex, 2) + "; " + num(ey, 2) + ")."; }
  info = "**Инварианты:** A + C = " + num(i1, 2) + ", δ = AC − B²/4 = " + num(i2, 2) + ", Δ = " + num(i3, 3) + " (определитель расширенной матрицы).\n\nТип по знаку δ: " + cls + ". Кривая — **" + kind(i1, i2, i3, kk, flat) + "**." + cen;
}
]
