[
description = "{info}"

field width = 12; field height = 10; field depth = 12;
show grid = false; show axes = false;
camera start rot = (-35, 68);
camera start zoom = 1.25;


// Прямоугольный параллелепипед со сторонами a, b, c (вдоль x, z, y). Пространственная
// диагональ AC₁ (оранжевая), диагональ основания AC (синяя) и ребро CC₁ образуют
// прямоугольный треугольник; остальные три диагонали проходят через центр O.
new Point3D { name = "A"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("A") }
new Point3D { name = "B"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("B") }
new Point3D { name = "C"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("C") }
new Point3D { name = "D"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("D") }
new Point3D { name = "A1"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("A₁") }
new Point3D { name = "B1"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("B₁") }
new Point3D { name = "C1"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("C₁") }
new Point3D { name = "D1"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("D₁") }
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("O") }
new Line3D { name = "eAB"; pos = (A, B); interact = false; thickness = 2 }
new Line3D { name = "eBC"; pos = (B, C); interact = false; thickness = 2 }
new Line3D { name = "eCD"; pos = (C, D); interact = false; thickness = 2 }
new Line3D { name = "eDA"; pos = (D, A); interact = false; thickness = 2 }
new Line3D { name = "eA1B1"; pos = (A1, B1); interact = false; thickness = 2 }
new Line3D { name = "eB1C1"; pos = (B1, C1); interact = false; thickness = 2 }
new Line3D { name = "eC1D1"; pos = (C1, D1); interact = false; thickness = 2 }
new Line3D { name = "eD1A1"; pos = (D1, A1); interact = false; thickness = 2 }
new Line3D { name = "eAA1"; pos = (A, A1); interact = false; thickness = 2 }
new Line3D { name = "eBB1"; pos = (B, B1); interact = false; thickness = 2 }
new Line3D { name = "eDD1"; pos = (D, D1); interact = false; thickness = 2 }
new Line3D { name = "eCC1"; pos = (C, C1); interact = false; thickness = 2 }
new Line3D { name = "dBD1"; pos = (B, D1); interact = false; thickness = 1 }
new Line3D { name = "dCA1"; pos = (C, A1); interact = false; thickness = 1 }
new Line3D { name = "dDB1"; pos = (D, B1); interact = false; thickness = 1 }
new Line3D { name = "dAC"; pos = (A, C); interact = false; thickness = 4; color = #3b82f6 }
new Line3D { name = "dAC1"; pos = (A, C1); interact = false; thickness = 5; color = #f59e0b }

new UI { name = "s_a"; type = slider; label = "a (вдоль x)"; variable = a; min = 1; max = 6; step = 0.5; default = 6 }
new UI { name = "s_b"; type = slider; label = "b (вдоль z)"; variable = b; min = 1; max = 6; step = 0.5; default = 3 }
new UI { name = "s_c"; type = slider; label = "c (высота)"; variable = c; min = 1; max = 6; step = 0.5; default = 2 }

string info = "";
float a = 6; float b = 3; float c = 2;
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function put(P, sx, sy, sz) { P.pos.x = sx * a / 2; P.pos.y = sy * c / 2; P.pos.z = sz * b / 2; }

Update {
  put(A, -1, -1, -1);
  put(B, 1, -1, -1);
  put(C, 1, -1, 1);
  put(D, -1, -1, 1);
  put(A1, -1, 1, -1);
  put(B1, 1, 1, -1);
  put(C1, 1, 1, 1);
  put(D1, -1, 1, 1);
  float d1 = sqrt(a * a + b * b); float d = sqrt(a * a + b * b + c * c);
  info = "**Диагональ прямоугольного параллелепипеда** — отрезок между вершинами, не лежащими в одной грани. Квадрат её длины равен сумме квадратов трёх рёбер, выходящих из одной вершины: **d² = a² + b² + c²**.\n\n";
  info = info + "Сначала диагональ основания AC (синяя): d₁² = a² + b² = " + format(a * a, 2) + " + " + format(b * b, 2) + " = " + format(d1 * d1, 2) + ", d₁ = " + format(d1, 2) + ". Затем в прямоугольном треугольнике ACC₁ с катетами d₁ и c гипотенуза — диагональ AC₁ (оранжевая): d² = d₁² + c² = " + format(d1 * d1, 2) + " + " + format(c * c, 2) + " = **" + format(d * d, 2) + "**, откуда **d = " + format(d, 3) + "**.\n\n";
  info = info + "Все четыре диагонали AC₁, BD₁, CA₁, DB₁ равны и пересекаются в центре O, деля друг друга пополам: OA = OC₁ = d/2 = " + format(d / 2, 3) + ".";
  if (a == b && b == c) { info = info + " Здесь a = b = c — куб, d = a√3."; }
}
]
