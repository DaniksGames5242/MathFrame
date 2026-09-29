[
description = "{info}"

field width = 12; field height = 10; field depth = 12;
show grid = false; show axes = false;
camera start rot = (30, 62);
camera start zoom = 1.6;

new Point3D { name = "N0"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("A") }
new Point3D { name = "N1"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("B") }
new Point3D { name = "N2"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("C") }
new Point3D { name = "N3"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("D") }
new Point3D { name = "N4"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("E") }
new Point3D { name = "N5"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("F") }
new Point3D { name = "N6"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("G") }
new Point3D { name = "N7"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("H") }
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("O") }
new Point3D { name = "V"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "Q1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "Q2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "Q3"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "W"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }

new Line3D { name = "e01"; pos = (N0, N1); interact = false; thickness = 3 }
new Line3D { name = "e02"; pos = (N0, N2); interact = false; thickness = 3 }
new Line3D { name = "e04"; pos = (N0, N4); interact = false; thickness = 3 }
new Line3D { name = "e13"; pos = (N1, N3); interact = false; thickness = 3 }
new Line3D { name = "e15"; pos = (N1, N5); interact = false; thickness = 3 }
new Line3D { name = "e23"; pos = (N2, N3); interact = false; thickness = 3 }
new Line3D { name = "e26"; pos = (N2, N6); interact = false; thickness = 3 }
new Line3D { name = "e37"; pos = (N3, N7); interact = false; thickness = 3 }
new Line3D { name = "e45"; pos = (N4, N5); interact = false; thickness = 3 }
new Line3D { name = "e46"; pos = (N4, N6); interact = false; thickness = 3 }
new Line3D { name = "e57"; pos = (N5, N7); interact = false; thickness = 3 }
new Line3D { name = "e67"; pos = (N6, N7); interact = false; thickness = 3 }

// из выбранной вершины: диагонали трёх граней (жёлтые) и пространственная диагональ (синяя)
new Line3D { name = "d1"; pos = (V, Q1); interact = false; thickness = 5; color = #f59e0b }
new Line3D { name = "d2"; pos = (V, Q2); interact = false; thickness = 5; color = #f59e0b }
new Line3D { name = "d3"; pos = (V, Q3); interact = false; thickness = 5; color = #f59e0b }
new Line3D { name = "dd"; pos = (V, W); interact = false; thickness = 5; color = #3b82f6 }

new UI { name = "s_a"; type = slider; label = "ребро a"; variable = a; min = 2; max = 6; step = 0.1; default = 4 }
new UI { name = "s_v"; type = slider; label = "вершина, из которой проведены диагонали (1 — A … 8 — H)"; variable = sel; min = 1; max = 8; step = 1; default = 2 }

string info = "";
float a = 4; float sel = 2; float key = -1;
Function sx(i) { if (i - 2 * floor(i / 2) > 0.5) { return 1; } return -1; }
Function sy(i) { if (floor(i / 2) - 2 * floor(i / 4) > 0.5) { return 1; } return -1; }
Function sz(i) { if (i > 3.5) { return 1; } return -1; }
Function put(P, i) { P.pos.x = sx(i) * a / 2; P.pos.y = sy(i) * a / 2; P.pos.z = sz(i) * a / 2; }
Function flip(P, i, fx, fy, fz) { P.pos.x = fx * sx(i) * a / 2; P.pos.y = fy * sy(i) * a / 2; P.pos.z = fz * sz(i) * a / 2; }
Function nm(i) { if (i < 0.5) { return "A"; } if (i < 1.5) { return "B"; } if (i < 2.5) { return "C"; } if (i < 3.5) { return "D"; } if (i < 4.5) { return "E"; } if (i < 5.5) { return "F"; } if (i < 6.5) { return "G"; } return "H"; }

Update {
  sel = round(sel);
  float k = sel - 1;
  float ky = sel * 1000 + a * 10;
  if (ky != key) {
    key = ky;
    put(N0, 0); put(N1, 1); put(N2, 2); put(N3, 3); put(N4, 4); put(N5, 5); put(N6, 6); put(N7, 7);
    O.pos.x = 0; O.pos.y = 0; O.pos.z = 0;
    put(V, k); flip(Q1, k, -1, -1, 1); flip(Q2, k, -1, 1, -1); flip(Q3, k, 1, -1, -1); flip(W, k, -1, -1, -1);
  }
  float dz = a * sqrt(3);
  info = "**Куб** — шесть равных квадратных граней, двенадцать рёбер длины a = " + format(a, 1) + ", восемь вершин, в каждой сходятся три ребра под прямыми углами; все двугранные углы прямые.\n\n";
  info = info + "**Поверхность и объём:** S = 6a² = " + format(6 * a * a, 2) + ", V = a³ = " + format(a * a * a, 2) + ".\n\n";
  info = info + "**Диагонали.** Из вершины " + nm(k) + " выходят три диагонали граней (жёлтые), каждая a√2 = " + format(a * sqrt(2), 2) + ", и одна пространственная диагональ (синяя) a√3 = **" + format(dz, 2) + "** — до противоположной вершины " + nm(7 - k) + ". Все четыре пространственные диагонали пересекаются в центре O и делятся им пополам.\n\n";
  info = info + "**Сферы с центром O:** описанная R = a√3/2 = " + format(dz / 2, 2) + " (через все вершины), полувписанная ρ = a√2/2 = " + format(a * sqrt(2) / 2, 2) + " (касается всех рёбер), вписанная r = a/2 = " + format(a / 2, 2) + " (касается всех граней).";
}
]
