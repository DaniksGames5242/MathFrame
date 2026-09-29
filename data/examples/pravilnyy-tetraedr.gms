[
description = "{info}"

field width = 12; field height = 10; field depth = 12;
show grid = false; show axes = false;
camera start rot = (30, 62);
camera start zoom = 1.6;

new Point3D { name = "A"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("A") }
new Point3D { name = "B"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("B") }
new Point3D { name = "C"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("C") }
new Point3D { name = "D"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("D") }
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("O") }
new Point3D { name = "K"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("K") }
new Point3D { name = "V"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }

new Line3D { name = "ab"; pos = (A, B); interact = false; thickness = 3 }
new Line3D { name = "ac"; pos = (A, C); interact = false; thickness = 3 }
new Line3D { name = "bc"; pos = (B, C); interact = false; thickness = 3 }
new Line3D { name = "da"; pos = (D, A); interact = false; thickness = 3 }
new Line3D { name = "db"; pos = (D, B); interact = false; thickness = 3 }
new Line3D { name = "dc"; pos = (D, C); interact = false; thickness = 3 }

// грань, противолежащая выбранной вершине
new Line3D { name = "gab"; pos = (A, B); interact = false; thickness = 6; color = #f59e0b; active = sel > 2.5 || (sel > 1.5 && sel < 2.5) }
new Line3D { name = "gac"; pos = (A, C); interact = false; thickness = 6; color = #f59e0b; active = sel > 3.5 || (sel > 1.5 && sel < 2.5) }
new Line3D { name = "gbc"; pos = (B, C); interact = false; thickness = 6; color = #f59e0b; active = sel > 3.5 || sel < 1.5 }
new Line3D { name = "gda"; pos = (D, A); interact = false; thickness = 6; color = #f59e0b; active = sel > 1.5 && sel < 3.5 }
new Line3D { name = "gdb"; pos = (D, B); interact = false; thickness = 6; color = #f59e0b; active = sel < 1.5 || (sel > 2.5 && sel < 3.5) }
new Line3D { name = "gdc"; pos = (D, C); interact = false; thickness = 6; color = #f59e0b; active = sel < 2.5 }
// высота из выбранной вершины: OV = R (синий), OK = r (зелёный)
new Line3D { name = "hR"; pos = (V, O); interact = false; thickness = 5; color = #3b82f6 }
new Line3D { name = "hr"; pos = (O, K); interact = false; thickness = 5; color = #22c55e }

new UI { name = "s_a"; type = slider; label = "ребро a"; variable = a; min = 3; max = 6.5; step = 0.1; default = 5 }
new UI { name = "s_v"; type = slider; label = "вершина, из которой проведена высота (1 — A … 4 — D)"; variable = sel; min = 1; max = 4; step = 1; default = 4 }

string info = "";
float a = 5; float sel = 4; float key = -1;
float rb = 0; float rr = 0;
Function vx(k) { if (k > 2.5) { return 0; } return rb * cos(6.283185 * k / 3 + 0.5); }
Function vy(k) { if (k > 2.5) { return rr; } return -rr / 3; }
Function vz(k) { if (k > 2.5) { return 0; } return rb * sin(6.283185 * k / 3 + 0.5); }
Function put(P, k) { P.pos.x = vx(k); P.pos.y = vy(k); P.pos.z = vz(k); }
Function nm(k) { if (k < 0.5) { return "A"; } if (k < 1.5) { return "B"; } if (k < 2.5) { return "C"; } return "D"; }
Function fc(k) { if (k < 0.5) { return "BCD"; } if (k < 1.5) { return "ACD"; } if (k < 2.5) { return "ABD"; } return "ABC"; }

Update {
  sel = round(sel);
  float k = sel - 1;
  float ky = sel * 1000 + a * 10;
  if (ky != key) {
    key = ky;
    rb = a / sqrt(3); rr = a * sqrt(6) / 4;
    put(A, 0); put(B, 1); put(C, 2); put(D, 3); put(V, k);
    O.pos.x = 0; O.pos.y = 0; O.pos.z = 0;
    K.pos.x = -vx(k) / 3; K.pos.y = -vy(k) / 3; K.pos.z = -vz(k) / 3;
  }
  float s = a * a * sqrt(3); float v = a * a * a * sqrt(2) / 12;
  float h = a * sqrt(6) / 3; float r = a * sqrt(6) / 12;
  info = "**Правильный тетраэдр ABCD** — четыре равных равносторонних треугольника, в каждой вершине сходятся три ребра; все шесть рёбер равны a = " + format(a, 1) + ", каждый двугранный угол равен arccos ⅓ ≈ **" + format(acos(1 / 3) * 57.29578, 2) + "°**.\n\n";
  info = info + "**Поверхность и объём:** S = a²√3 = " + format(s, 2) + ", V = a³√2/12 = " + format(v, 2) + ".\n\n";
  info = info + "**Высота** из вершины " + nm(k) + " к грани " + fc(k) + " (жёлтая) падает в её центр K: h = a√6/3 = " + format(h, 2) + ". Центр O делит высоту в отношении 3 : 1 от вершины: до вершины R = a√6/4 = **" + format(rr, 2) + "** (синий, радиус описанной сферы), до грани r = a√6/12 = **" + format(r, 2) + "** (зелёный, радиус вписанной сферы); R + r = " + format(rr + r, 2) + " = h, R = 3r. Проверка: 3V/S = " + format(3 * v / s, 2) + " = r.";
}
]
