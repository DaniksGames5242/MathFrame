[
description = "{info}"

field width = 12; field height = 10; field depth = 12;
show grid = false; show axes = false;
camera start rot = (30, 62);
camera start zoom = 1.8;

new Point3D { name = "P0"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("A"); }
new Point3D { name = "P1"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("B"); }
new Point3D { name = "P2"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("C"); }
new Point3D { name = "P3"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("D"); }
new Point3D { name = "Q0"; pos = (0, 0, 0); dynamic = false; collision = false; active = false; }
new Point3D { name = "Q1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false; }
new Point3D { name = "Q2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false; }
new Point3D { name = "Q3"; pos = (0, 0, 0); dynamic = false; collision = false; active = false; }
new Point3D { name = "H"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("H"); }
new Line3D { name = "e01"; pos = (P0, P1); interact = false; thickness = 2; }
new Line3D { name = "e02"; pos = (P0, P2); interact = false; thickness = 2; }
new Line3D { name = "e03"; pos = (P0, P3); interact = false; thickness = 2; }
new Line3D { name = "e12"; pos = (P1, P2); interact = false; thickness = 2; }
new Line3D { name = "e13"; pos = (P1, P3); interact = false; thickness = 2; }
new Line3D { name = "e23"; pos = (P2, P3); interact = false; thickness = 2; }
new Line3D { name = "q01"; pos = (Q0, Q1); interact = false; thickness = 4; color = #3b82f6 }
new Line3D { name = "q12"; pos = (Q1, Q2); interact = false; thickness = 4; color = #3b82f6 }
new Line3D { name = "q20"; pos = (Q2, Q0); interact = false; thickness = 4; color = #3b82f6 }
new Line3D { name = "hl"; pos = (Q3, H); interact = false; thickness = 3; color = #22c55e }

new UI { name = "s_mb"; type = slider; label = "основание напротив вершины №"; variable = mb; min = 1; max = 4; step = 1; default = 4 }
new UI { name = "s_w"; type = slider; label = "форма основания"; variable = w; min = 0.6; max = 1.8; step = 0.1; default = 1 }
new UI { name = "s_h"; type = slider; label = "высота вершины D над плоскостью ABC"; variable = h; min = 2; max = 5; step = 0.1; default = 3.5 }
new UI { name = "s_dx"; type = slider; label = "смещение вершины D по x"; variable = dx; min = -2; max = 2; step = 0.1; default = 0.8 }
new UI { name = "s_dz"; type = slider; label = "смещение вершины D по z"; variable = dz; min = -2; max = 2; step = 0.1; default = 0.5 }

string info = "";
float mb = 4; float w = 1; float h = 3.5; float dx = 0.8; float dz = 0.5;

Function vx(i) { if (i == 0) { return -2.4; } if (i == 1) { return 2.4; } if (i == 2) { return 0.6 * w; } return dx; }
Function vy(i) { if (i == 3) { return h / 2; } return -h / 2; }
Function vz(i) { if (i == 0) { return 1.4; } if (i == 1) { return 1.4; } if (i == 2) { return -2.6; } return dz; }
Function idx(m, j) { return (m + j) % 4; }
Function cx(a, b, c) { return (vy(b) - vy(a)) * (vz(c) - vz(a)) - (vz(b) - vz(a)) * (vy(c) - vy(a)); }
Function cy(a, b, c) { return (vz(b) - vz(a)) * (vx(c) - vx(a)) - (vx(b) - vx(a)) * (vz(c) - vz(a)); }
Function cz(a, b, c) { return (vx(b) - vx(a)) * (vy(c) - vy(a)) - (vy(b) - vy(a)) * (vx(c) - vx(a)); }
Function fa(a, b, c) { return sqrt(cx(a, b, c) * cx(a, b, c) + cy(a, b, c) * cy(a, b, c) + cz(a, b, c) * cz(a, b, c)) / 2; }
Function vol() {
  return abs((vx(1) - vx(0)) * cx(0, 2, 3) + (vy(1) - vy(0)) * cy(0, 2, 3) + (vz(1) - vz(0)) * cz(0, 2, 3)) / 6;
}
Function hgt(m) { return 3 * vol() / fa(idx(m, 1), idx(m, 2), idx(m, 3)); }
Function pv(P, i) { P.pos.x = vx(i); P.pos.y = vy(i); P.pos.z = vz(i); }
Function nm(i) { if (i == 0) { return "A"; } if (i == 1) { return "B"; } if (i == 2) { return "C"; } return "D"; }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  float m = round(mb) - 1;
  pv(P0, 0); pv(P1, 1); pv(P2, 2); pv(P3, 3);
  pv(Q0, idx(m, 1)); pv(Q1, idx(m, 2)); pv(Q2, idx(m, 3)); pv(Q3, m);
  int a = idx(m, 1); int b = idx(m, 2); int c = idx(m, 3);
  float nx = cx(a, b, c); float ny = cy(a, b, c); float nz = cz(a, b, c);
  float nl = sqrt(nx * nx + ny * ny + nz * nz);
  float t = ((vx(m) - vx(a)) * nx + (vy(m) - vy(a)) * ny + (vz(m) - vz(a)) * nz) / (nl * nl);
  H.pos.x = vx(m) - t * nx; H.pos.y = vy(m) - t * ny; H.pos.z = vz(m) - t * nz;
  info = "**Тетраэдр** — многогранник с четырьмя треугольными гранями: вершин **4**, рёбер **6**, граней **4**, и 4 − 6 + 4 = 2. В каждой вершине сходятся три ребра и три грани.\n\n";
  info = info + "Любую грань можно считать основанием. Сейчас основание — грань " + nm(a) + nm(b) + nm(c) + " (синяя) с площадью " + format(fa(a, b, c), 2) + ", вершина пирамиды — " + nm(m) + ", высота " + nm(m) + "H = **" + format(hgt(m), 2) + "**.\n\n";
  info = info + "Объём V = ⅓·S·h = ⅓ · " + format(fa(a, b, c), 2) + " · " + format(hgt(m), 2) + " = **" + format(vol(), 2) + "** — при любом выборе основания одинаков.\n\n";
  info = info + "Рёбра образуют три пары скрещивающихся: AB и CD, AC и BD, AD и BC.";
}
]
