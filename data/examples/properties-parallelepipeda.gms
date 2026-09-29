[
description = "{info}"

field width = 12; field height = 10; field depth = 12;
show grid = false; show axes = false;
camera start rot = (30, 62);
camera start zoom = 1.25;


// Параллелепипед: основание ABCD — параллелограмм со сторонами a, b и углом γ, боковое
// ребро задано высотой h и наклоном. Четыре диагонали (оранжевые) проходят через центр O.
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
new Line3D { name = "eCC1"; pos = (C, C1); interact = false; thickness = 2 }
new Line3D { name = "eDD1"; pos = (D, D1); interact = false; thickness = 2 }
new Line3D { name = "dAC1"; pos = (A, C1); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "dBD1"; pos = (B, D1); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "dCA1"; pos = (C, A1); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "dDB1"; pos = (D, B1); interact = false; thickness = 3; color = #f59e0b }

new UI { name = "s_a"; type = slider; label = "ребро a"; variable = a; min = 2; max = 5; step = 0.1; default = 4 }
new UI { name = "s_b"; type = slider; label = "ребро b"; variable = b; min = 2; max = 5; step = 0.1; default = 3 }
new UI { name = "s_gam"; type = slider; label = "угол γ основания, °"; variable = gam; min = 40; max = 140; step = 1; default = 70 }
new UI { name = "s_h"; type = slider; label = "высота h"; variable = h; min = 2; max = 5; step = 0.1; default = 3.5 }
new UI { name = "s_phi"; type = slider; label = "наклон бокового ребра φ, °"; variable = phi; min = 0; max = 50; step = 1; default = 25 }
new UI { name = "s_psi"; type = slider; label = "направление наклона, °"; variable = psi; min = 0; max = 360; step = 1; default = 30 }

string info = "";
float a = 4; float b = 3; float gam = 70; float h = 3.5; float phi = 25; float psi = 30;
float ux = 0; float uz = 0; float vx = 0; float vz = 0; float wx = 0; float wz = 0;
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function put(P, sx, sz, sy) {
  P.pos.x = sx * ux + sz * vx + sy * wx - (ux + vx + wx) / 2;
  P.pos.y = (sy - 0.5) * h;
  P.pos.z = sx * uz + sz * vz + sy * wz - (uz + vz + wz) / 2;
}
Function cr(x1, y1, z1, x2, y2, z2) { float p = y1 * z2 - z1 * y2; float q = z1 * x2 - x1 * z2; float r = x1 * y2 - y1 * x2; return sqrt(p * p + q * q + r * r); }

Update {
  float g = radians(gam); float t = radians(phi); float s = radians(psi);
  ux = a; uz = 0; vx = b * cos(g); vz = b * sin(g);
  wx = h * tan(t) * cos(s); wz = h * tan(t) * sin(s);
  put(A, 0, 0, 0); put(B, 1, 0, 0); put(C, 1, 1, 0); put(D, 0, 1, 0);
  put(A1, 0, 0, 1); put(B1, 1, 0, 1); put(C1, 1, 1, 1); put(D1, 0, 1, 1);
  O.pos.x = 0; O.pos.y = 0; O.pos.z = 0;
  float l = sqrt(wx * wx + h * h + wz * wz);
  float d1 = sqrt(pow(ux + vx + wx, 2) + h * h + pow(uz + vz + wz, 2));
  float d2 = sqrt(pow(ux - vx - wx, 2) + h * h + pow(uz - vz - wz, 2));
  float d3 = sqrt(pow(-ux + vx - wx, 2) + h * h + pow(-uz + vz - wz, 2));
  float d4 = sqrt(pow(ux + vx - wx, 2) + h * h + pow(uz + vz - wz, 2));
  float sq = d1 * d1 + d2 * d2 + d3 * d3 + d4 * d4;
  float se = 4 * (a * a + b * b + l * l);
  float sab = cr(ux, 0, uz, vx, 0, vz); float sal = cr(ux, 0, uz, wx, h, wz); float sbl = cr(vx, 0, vz, wx, h, wz);
  info = "**Параллелепипед** — тело, все шесть граней которого параллелограммы.\n\n";
  info = info + "**Противоположные грани параллельны и равны**: площади пар граней " + format(sab, 2) + " (основания ABCD и A₁B₁C₁D₁), " + format(sal, 2) + " (ABB₁A₁ и DCC₁D₁), " + format(sbl, 2) + " (ADD₁A₁ и BCC₁B₁). **Противоположные рёбра параллельны и равны**: четыре ребра длины a = " + format(a, 2) + ", четыре длины b = " + format(b, 2) + ", четыре длины " + format(l, 2) + ".\n\n";
  info = info + "**Диагонали пересекаются в одной точке O и делятся ею пополам**: их длины " + format(d1, 2) + ", " + format(d2, 2) + ", " + format(d3, 2) + ", " + format(d4, 2) + "; центральная симметрия относительно O переводит A в C₁, B в D₁, C в A₁, D в B₁.\n\n";
  info = info + "**Сумма квадратов диагоналей равна сумме квадратов всех рёбер**: " + format(sq, 2) + " = " + format(se, 2) + ".";
  if (abs(sq - se) > 0.001) { info = info + " Равенство не выполнено."; }
}
]
