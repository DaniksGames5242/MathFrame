[
description = "{info}"

field width = 14; field height = 14; field depth = 14;
show grid = false; show axes = false;
camera start rot = (22, 66);
camera start zoom = 1.6;

// Описанный многогранник — n-угольная бипирамида: основание (n вершин, все на одном уровне) и две вершины P, Q над и под ним.
draw Surface { name = "sph"; type = parametric; x = "Rs * sin(pi * u) * cos(6.283185 * v)"; y = "Rs * cos(pi * u)"; z = "Rs * sin(pi * u) * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 32; color = #3b82f6; opacity = 0.1 }
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("O"); color = #f59e0b }
new Point3D { name = "P"; pos = (0, 3, 0); dynamic = false; collision = false; size = 0.4; text = true("P") }
new Point3D { name = "Q"; pos = (0, -3, 0); dynamic = false; collision = false; size = 0.4; text = true("Q") }
new Point3D { name = "V1"; pos = (2, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("A"); active = n > 0 }
new Point3D { name = "V2"; pos = (2, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("B"); active = n > 1 }
new Point3D { name = "V3"; pos = (2, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("C"); active = n > 2 }
new Point3D { name = "V4"; pos = (2, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("D"); active = n > 3 }
new Point3D { name = "V5"; pos = (2, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("E"); active = n > 4 }
new Point3D { name = "V6"; pos = (2, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("F"); active = n > 5 }
new Point3D { name = "V7"; pos = (2, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("G"); active = n > 6 }
new Point3D { name = "V8"; pos = (2, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("H"); active = n > 7 }
new Line3D { name = "b1"; pos = (V1, V2); interact = false; thickness = 3; active = n > 0 }
new Line3D { name = "t1"; pos = (P, V1); interact = false; thickness = 3; active = n > 0 }
new Line3D { name = "d1"; pos = (Q, V1); interact = false; thickness = 3; active = n > 0; color = #f59e0b }
new Line3D { name = "b2"; pos = (V2, V3); interact = false; thickness = 3; active = n > 1 }
new Line3D { name = "t2"; pos = (P, V2); interact = false; thickness = 3; active = n > 1 }
new Line3D { name = "d2"; pos = (Q, V2); interact = false; thickness = 3; active = n > 1; color = #f59e0b }
new Line3D { name = "b3"; pos = (V3, V4); interact = false; thickness = 3; active = n > 2 }
new Line3D { name = "t3"; pos = (P, V3); interact = false; thickness = 3; active = n > 2 }
new Line3D { name = "d3"; pos = (Q, V3); interact = false; thickness = 3; active = n > 2; color = #f59e0b }
new Line3D { name = "b4"; pos = (V4, V5); interact = false; thickness = 3; active = n > 3 }
new Line3D { name = "t4"; pos = (P, V4); interact = false; thickness = 3; active = n > 3 }
new Line3D { name = "d4"; pos = (Q, V4); interact = false; thickness = 3; active = n > 3; color = #f59e0b }
new Line3D { name = "b5"; pos = (V5, V6); interact = false; thickness = 3; active = n > 4 }
new Line3D { name = "t5"; pos = (P, V5); interact = false; thickness = 3; active = n > 4 }
new Line3D { name = "d5"; pos = (Q, V5); interact = false; thickness = 3; active = n > 4; color = #f59e0b }
new Line3D { name = "b6"; pos = (V6, V7); interact = false; thickness = 3; active = n > 5 }
new Line3D { name = "t6"; pos = (P, V6); interact = false; thickness = 3; active = n > 5 }
new Line3D { name = "d6"; pos = (Q, V6); interact = false; thickness = 3; active = n > 5; color = #f59e0b }
new Line3D { name = "b7"; pos = (V7, V8); interact = false; thickness = 3; active = n > 6 }
new Line3D { name = "t7"; pos = (P, V7); interact = false; thickness = 3; active = n > 6 }
new Line3D { name = "d7"; pos = (Q, V7); interact = false; thickness = 3; active = n > 6; color = #f59e0b }
new Line3D { name = "b8"; pos = (V8, V1); interact = false; thickness = 3; active = n > 7 }
new Line3D { name = "t8"; pos = (P, V8); interact = false; thickness = 3; active = n > 7 }
new Line3D { name = "d8"; pos = (Q, V8); interact = false; thickness = 3; active = n > 7; color = #f59e0b }

new UI { type = slider; label = "число вершин основания n"; variable = n; min = 3; max = 8; step = 1; default = 5 }
new UI { type = slider; label = "радиус сферы R"; variable = Rs; min = 2.5; max = 4.5; step = 0.1; default = 3.5 }
new UI { type = slider; label = "уровень основания y₀"; variable = e; min = -2; max = 2; step = 0.1; default = 0.8 }
new UI { type = slider; label = "сдвиг вершины Q по оси (ε)"; variable = eps; min = -1.5; max = 1.5; step = 0.1; default = 0 }

string info = "";
float n = 5; float Rs = 3.5; float e = 0.8; float eps = 0;
Function num(x, d) { if (x < -0.0000001) { return "−" + format(-x, d); } return format(abs(x), d); }
Function put(V, k, a) {
  float kk = k;
  if (kk > n) { kk = 1; }
  V.pos.x = a * cos(2 * pi * (kk - 1) / n); V.pos.y = e; V.pos.z = a * sin(2 * pi * (kk - 1) / n);
}
Update {
  float a = sqrt(Rs * Rs - e * e);
  put(V1, 1, a); put(V2, 2, a); put(V3, 3, a); put(V4, 4, a); put(V5, 5, a); put(V6, 6, a); put(V7, 7, a); put(V8, 8, a);
  P.pos.y = Rs; Q.pos.y = -(Rs + eps);
  float h1 = Rs - e; float h2 = Rs + eps + e;
  float dq = Rs + eps;
  info = "**Описанный многогранник** — многогранник, все вершины которого лежат на одной сфере. Здесь " + num(n, 0) + "-угольная бипирамида: основание ABC… радиуса " + format(a, 2) + " лежит в плоскости y = " + num(e, 1) + ", вершины P и Q — над и под ним. У неё " + num(n + 2, 0) + " вершин, " + num(3 * n, 0) + " рёбер, " + num(2 * n, 0) + " граней.\n\n";
  info = info + "**Расстояния от центра O до вершин:** OA = … = " + format(sqrt(a * a + e * e), 2) + ", OP = " + format(Rs, 2) + ", OQ = " + format(dq, 2) + ".\n\n";
  if (abs(eps) < 0.05) {
    info = info + "Все вершины на сфере с центром O и радиусом R = " + format(Rs, 2) + ": сфера описана около многогранника, её центр равноудалён от вершин. Условие существования для такой бипирамиды: h₁ · h₂ = a², где h₁ = " + format(h1, 2) + ", h₂ = " + format(h2, 2) + " — расстояния от P и Q до плоскости основания: " + format(h1 * h2, 2) + " = " + format(a * a, 2) + ".";
  } else {
    info = info + "Основание и вершина P однозначно определяют сферу (синяя), но вершина Q ей не принадлежит: OQ = " + format(dq, 2) + " ≠ R = " + format(Rs, 2) + ". Здесь h₁ · h₂ = " + format(h1 * h2, 2) + " ≠ a² = " + format(a * a, 2) + " — описанной сферы у многогранника нет.";
  }
}
]
