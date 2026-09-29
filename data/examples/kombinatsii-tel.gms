[
description = "{info}"

field width = 14; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (20, 68);
camera start zoom = 2.0;

draw Surface { name = "aOut"; type = parametric; x = "xa + Ra * cos(tA + (pi - tA) * u)"; y = "Ra * sin(tA + (pi - tA) * u) * cos(6.283185 * v)"; z = "Ra * sin(tA + (pi - tA) * u) * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 28; color = #3b82f6; opacity = 0.35; active = showAout && tA < 3.1 }
draw Surface { name = "aIn"; type = parametric; x = "xa + Ra * cos(tA * u)"; y = "Ra * sin(tA * u) * cos(6.283185 * v)"; z = "Ra * sin(tA * u) * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 28; color = #3b82f6; opacity = 0.35; active = showAin && tA > 0.02 }
draw Surface { name = "bOut"; type = parametric; x = "xb - Rb * cos(tB + (pi - tB) * u)"; y = "Rb * sin(tB + (pi - tB) * u) * cos(6.283185 * v)"; z = "Rb * sin(tB + (pi - tB) * u) * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 28; color = #f59e0b; opacity = 0.35; active = showBout && tB < 3.1 }
draw Surface { name = "bIn"; type = parametric; x = "xb - Rb * cos(tB * u)"; y = "Rb * sin(tB * u) * cos(6.283185 * v)"; z = "Rb * sin(tB * u) * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 28; color = #f59e0b; opacity = 0.35; active = showBin && tB > 0.02 }
new Point3D { name = "OA"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.6; text = true("A"); color = #3b82f6 }
new Point3D { name = "OB"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.6; text = true("B"); color = #f59e0b }
new Line3D { name = "oo"; pos = (OA, OB); interact = false; thickness = 2 }

new UI { name = "bU"; type = button; label = "Объединение A ∪ B"; action = "mode = 1" }
new UI { name = "bI"; type = button; label = "Пересечение A ∩ B"; action = "mode = 2" }
new UI { name = "bD"; type = button; label = "Разность A \ B"; action = "mode = 3" }
new UI { type = slider; label = "радиус A"; variable = Ra; min = 1; max = 2.6; step = 0.1; default = 2.2 }
new UI { type = slider; label = "радиус B"; variable = Rb; min = 1; max = 2.6; step = 0.1; default = 1.8 }
new UI { type = slider; label = "расстояние между центрами"; variable = d; min = 0.2; max = 5; step = 0.1; default = 2.4 }

float mode = 1; float Ra = 2.2; float Rb = 1.8; float d = 2.4;
float xa = 0; float xb = 0; float tA = 0; float tB = 0;
bool showAout = true; bool showAin = false; bool showBout = true; bool showBin = false;
string info = "";
Function cl(x) { if (x > 1) { return 1; } if (x < -1) { return -1; } return x; }
Function cap(R, c) { float h = R * (1 - c); return pi * h * h * (3 * R - h) / 3; }
Update {
  xa = -d / 2; xb = d / 2;
  OA.pos.x = xa; OB.pos.x = xb;
  float cA = cl((d * d + Ra * Ra - Rb * Rb) / (2 * d * Ra));
  float cB = cl((d * d + Rb * Rb - Ra * Ra) / (2 * d * Rb));
  tA = acos(cA); tB = acos(cB);
  showAout = mode != 2; showBout = mode == 1; showAin = mode == 2; showBin = mode >= 2;
  float VA = 4 * pi * Ra * Ra * Ra / 3; float VB = 4 * pi * Rb * Rb * Rb / 3;
  float VI = cap(Ra, cA) + cap(Rb, cB);
  float SA = 4 * pi * Ra * Ra; float SB = 4 * pi * Rb * Rb;
  float inA = 2 * pi * Ra * Ra * (1 - cA); float inB = 2 * pi * Rb * Rb * (1 - cB);
  info = "**Комбинация тел** — объединение, пересечение или разность двух тел. Здесь тела — шары A (радиус " + format(Ra, 1) + ") и B (радиус " + format(Rb, 1) + ") с расстоянием между центрами " + format(d, 1) + ". Объёмы шаров: V(A) = " + format(VA, 2) + ", V(B) = " + format(VB, 2) + ".\n\n";
  info = info + "**Объём.** Общая часть A ∩ B (два шаровых сегмента): V(A ∩ B) = " + format(VI, 2) + ". По правилу включений и исключений V(A ∪ B) = V(A) + V(B) − V(A ∩ B) = " + format(VA + VB - VI, 2) + ", разность V(A \\ B) = V(A) − V(A ∩ B) = " + format(VA - VI, 2) + ".\n\n";
  if (mode == 1) { info = info + "**Поверхность объединения** — куски сфер, не погружённые внутрь другого шара: " + format(SA - inA, 2) + " + " + format(SB - inB, 2) + " = " + format(SA + SB - inA - inB, 2) + "."; }
  if (mode == 2) { info = info + "**Поверхность пересечения** — куски сфер, оказавшиеся внутри другого шара: " + format(inA, 2) + " + " + format(inB, 2) + " = " + format(inA + inB, 2) + ". Граница пересечения — внутренние части обеих сфер."; }
  if (mode == 3) { info = info + "**Поверхность разности A \\ B** — внешняя часть сферы A (" + format(SA - inA, 2) + ") плюс граница вычтенной части, то есть часть сферы B внутри A (" + format(inB, 2) + "): всего " + format(SA - inA + inB, 2) + "."; }
  if (VI < 0.0001) { info = info + " Шары не пересекаются, общей части нет."; }
  if (d <= abs(Ra - Rb)) { info = info + " Меньший шар целиком лежит внутри большего."; }
}
]
