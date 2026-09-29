[
description = "{info}"

field width = 14; field height = 10; field depth = 10;
show grid = false; show axes = false;
camera start rot = (-35, 68);
camera start zoom = 1.2;

// Параллелепипед a×b×c, разрезанный плоскостью x = s на две части. Вторая часть переносится на вектор (g; h; 0).
new Point3D { name = "L0"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "L1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "L2"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "L3"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "L4"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "L5"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "L6"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "L7"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "R0"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "R1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "R2"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "R3"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "R4"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "R5"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "R6"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "R7"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Line3D { name = "l0_1"; pos = (L0, L1); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "l0_2"; pos = (L0, L2); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "l0_4"; pos = (L0, L4); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "l1_3"; pos = (L1, L3); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "l1_5"; pos = (L1, L5); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "l2_3"; pos = (L2, L3); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "l2_6"; pos = (L2, L6); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "l3_7"; pos = (L3, L7); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "l4_5"; pos = (L4, L5); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "l4_6"; pos = (L4, L6); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "l5_7"; pos = (L5, L7); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "l6_7"; pos = (L6, L7); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "r0_1"; pos = (R0, R1); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "r0_2"; pos = (R0, R2); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "r0_4"; pos = (R0, R4); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "r1_3"; pos = (R1, R3); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "r1_5"; pos = (R1, R5); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "r2_3"; pos = (R2, R3); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "r2_6"; pos = (R2, R6); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "r3_7"; pos = (R3, R7); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "r4_5"; pos = (R4, R5); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "r4_6"; pos = (R4, R6); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "r5_7"; pos = (R5, R7); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "r6_7"; pos = (R6, R7); interact = false; thickness = 3; color = #f59e0b }

new UI { type = slider; label = "a (вдоль x)"; variable = a; min = 2; max = 6; step = 0.5; default = 5 }
new UI { type = slider; label = "b (вдоль z)"; variable = b; min = 1; max = 4; step = 0.5; default = 3 }
new UI { type = slider; label = "c (высота)"; variable = c; min = 1; max = 4; step = 0.5; default = 3 }
new UI { type = slider; label = "s (плоскость разреза)"; variable = s; min = 1; max = a - 1; step = 0.5; default = 2 }
new UI { type = slider; label = "перенос части 2 вдоль x"; variable = g; min = 0; max = 4; step = 0.5; default = 1 }
new UI { type = slider; label = "перенос части 2 вверх"; variable = h; min = 0; max = 2; step = 0.5; default = 0.5 }

string info = "";
float a = 5; float b = 3; float c = 3; float s = 2; float g = 1; float h = 0.5;
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  L0.pos.x = -5 + 0 * s; L0.pos.y = -2 + 0 * c; L0.pos.z = (0 - 0.5) * b;
  L1.pos.x = -5 + 1 * s; L1.pos.y = -2 + 0 * c; L1.pos.z = (0 - 0.5) * b;
  L2.pos.x = -5 + 0 * s; L2.pos.y = -2 + 1 * c; L2.pos.z = (0 - 0.5) * b;
  L3.pos.x = -5 + 1 * s; L3.pos.y = -2 + 1 * c; L3.pos.z = (0 - 0.5) * b;
  L4.pos.x = -5 + 0 * s; L4.pos.y = -2 + 0 * c; L4.pos.z = (1 - 0.5) * b;
  L5.pos.x = -5 + 1 * s; L5.pos.y = -2 + 0 * c; L5.pos.z = (1 - 0.5) * b;
  L6.pos.x = -5 + 0 * s; L6.pos.y = -2 + 1 * c; L6.pos.z = (1 - 0.5) * b;
  L7.pos.x = -5 + 1 * s; L7.pos.y = -2 + 1 * c; L7.pos.z = (1 - 0.5) * b;
  R0.pos.x = -5 + s + g + 0 * (a - s); R0.pos.y = -2 + h + 0 * c; R0.pos.z = (0 - 0.5) * b;
  R1.pos.x = -5 + s + g + 1 * (a - s); R1.pos.y = -2 + h + 0 * c; R1.pos.z = (0 - 0.5) * b;
  R2.pos.x = -5 + s + g + 0 * (a - s); R2.pos.y = -2 + h + 1 * c; R2.pos.z = (0 - 0.5) * b;
  R3.pos.x = -5 + s + g + 1 * (a - s); R3.pos.y = -2 + h + 1 * c; R3.pos.z = (0 - 0.5) * b;
  R4.pos.x = -5 + s + g + 0 * (a - s); R4.pos.y = -2 + h + 0 * c; R4.pos.z = (1 - 0.5) * b;
  R5.pos.x = -5 + s + g + 1 * (a - s); R5.pos.y = -2 + h + 0 * c; R5.pos.z = (1 - 0.5) * b;
  R6.pos.x = -5 + s + g + 0 * (a - s); R6.pos.y = -2 + h + 1 * c; R6.pos.z = (1 - 0.5) * b;
  R7.pos.x = -5 + s + g + 1 * (a - s); R7.pos.y = -2 + h + 1 * c; R7.pos.z = (1 - 0.5) * b;
  float v1 = s * b * c; float v2 = (a - s) * b * c;
  info = "**Аддитивность объёма.** Плоскость x = " + format(s, 1) + " делит параллелепипед на две части без общих внутренних точек, поэтому объём тела равен сумме объёмов частей: **V = V₁ + V₂**.\n\n";
  info = info + "V₁ = s·b·c = " + format(s, 1) + "·" + format(b, 1) + "·" + format(c, 1) + " = **" + format(v1, 2) + "** (синяя часть), V₂ = (a − s)·b·c = " + format(a - s, 1) + "·" + format(b, 1) + "·" + format(c, 1) + " = **" + format(v2, 2) + "** (оранжевая часть). V₁ + V₂ = " + format(v1 + v2, 2) + " = abc = V.\n\n";
  info = info + "**Равенство равных фигур.** Вторая часть перенесена на вектор (" + format(g, 1) + "; " + format(h, 1) + "; 0). Перенос — движение: форма и размеры части те же, поэтому её объём по-прежнему V₂ = " + format(v2, 2) + ", а сумма объёмов V₁ + V₂ не зависит ни от положения частей, ни от способа разбиения.";
}
]
