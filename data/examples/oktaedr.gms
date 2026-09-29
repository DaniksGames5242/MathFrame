[
description = "{info}"

field width = 12; field height = 10; field depth = 12;
show grid = false; show axes = false;
camera start rot = (30, 62);
camera start zoom = 1.25;

new Point3D { name = "P0"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("A") }
new Point3D { name = "P1"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("B") }
new Point3D { name = "P2"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("C") }
new Point3D { name = "P3"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("D") }
new Point3D { name = "P4"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("E") }
new Point3D { name = "P5"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("F") }
new Line3D { name = "e0"; pos = (P0, P2); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e1"; pos = (P0, P3); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e2"; pos = (P0, P4); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e3"; pos = (P0, P5); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e4"; pos = (P1, P2); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e5"; pos = (P1, P3); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e6"; pos = (P1, P4); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e7"; pos = (P1, P5); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e8"; pos = (P2, P4); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e9"; pos = (P2, P5); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e10"; pos = (P3, P4); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e11"; pos = (P3, P5); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "g0"; pos = (P0, P2); interact = false; thickness = 6; color = #22c55e; active = ag0 }
new Line3D { name = "h0"; pos = (P0, P2); interact = false; thickness = 6; color = #f59e0b; active = ah0 }
new Line3D { name = "g1"; pos = (P0, P3); interact = false; thickness = 6; color = #22c55e; active = ag1 }
new Line3D { name = "h1"; pos = (P0, P3); interact = false; thickness = 6; color = #f59e0b; active = ah1 }
new Line3D { name = "g2"; pos = (P0, P4); interact = false; thickness = 6; color = #22c55e; active = ag2 }
new Line3D { name = "h2"; pos = (P0, P4); interact = false; thickness = 6; color = #f59e0b; active = ah2 }
new Line3D { name = "g3"; pos = (P0, P5); interact = false; thickness = 6; color = #22c55e; active = ag3 }
new Line3D { name = "h3"; pos = (P0, P5); interact = false; thickness = 6; color = #f59e0b; active = ah3 }
new Line3D { name = "g4"; pos = (P1, P2); interact = false; thickness = 6; color = #22c55e; active = ag4 }
new Line3D { name = "h4"; pos = (P1, P2); interact = false; thickness = 6; color = #f59e0b; active = ah4 }
new Line3D { name = "g5"; pos = (P1, P3); interact = false; thickness = 6; color = #22c55e; active = ag5 }
new Line3D { name = "h5"; pos = (P1, P3); interact = false; thickness = 6; color = #f59e0b; active = ah5 }
new Line3D { name = "g6"; pos = (P1, P4); interact = false; thickness = 6; color = #22c55e; active = ag6 }
new Line3D { name = "h6"; pos = (P1, P4); interact = false; thickness = 6; color = #f59e0b; active = ah6 }
new Line3D { name = "g7"; pos = (P1, P5); interact = false; thickness = 6; color = #22c55e; active = ag7 }
new Line3D { name = "h7"; pos = (P1, P5); interact = false; thickness = 6; color = #f59e0b; active = ah7 }
new Line3D { name = "g8"; pos = (P2, P4); interact = false; thickness = 6; color = #22c55e; active = ag8 }
new Line3D { name = "h8"; pos = (P2, P4); interact = false; thickness = 6; color = #f59e0b; active = ah8 }
new Line3D { name = "g9"; pos = (P2, P5); interact = false; thickness = 6; color = #22c55e; active = ag9 }
new Line3D { name = "h9"; pos = (P2, P5); interact = false; thickness = 6; color = #f59e0b; active = ah9 }
new Line3D { name = "g10"; pos = (P3, P4); interact = false; thickness = 6; color = #22c55e; active = ag10 }
new Line3D { name = "h10"; pos = (P3, P4); interact = false; thickness = 6; color = #f59e0b; active = ah10 }
new Line3D { name = "g11"; pos = (P3, P5); interact = false; thickness = 6; color = #22c55e; active = ag11 }
new Line3D { name = "h11"; pos = (P3, P5); interact = false; thickness = 6; color = #f59e0b; active = ah11 }

new UI { name = "sA"; type = slider; label = "длина ребра a"; variable = a; min = 2; max = 6; step = 0.1; default = 4.8 }
new UI { name = "sV"; type = slider; label = "вершина №"; variable = vk; min = 1; max = 6; step = 1; default = 1 }
new UI { name = "sF"; type = slider; label = "грань №"; variable = fk; min = 1; max = 8; step = 1; default = 5 }

float a = 4.8; float vk = 1; float fk = 5; string info = "";
bool ag0 = false; bool ah0 = false; bool ag1 = false; bool ah1 = false; bool ag2 = false; bool ah2 = false; bool ag3 = false; bool ah3 = false; bool ag4 = false; bool ah4 = false; bool ag5 = false; bool ah5 = false; bool ag6 = false; bool ah6 = false; bool ag7 = false; bool ah7 = false; bool ag8 = false; bool ah8 = false; bool ag9 = false; bool ah9 = false; bool ag10 = false; bool ah10 = false; bool ag11 = false; bool ah11 = false;


Update {
  float s = a / 1.414213562;
  P0.pos.x = 1.000000000 * s; P0.pos.y = 0.000000000 * s; P0.pos.z = 0.000000000 * s;
  P1.pos.x = -1.000000000 * s; P1.pos.y = 0.000000000 * s; P1.pos.z = 0.000000000 * s;
  P2.pos.x = 0.000000000 * s; P2.pos.y = 1.000000000 * s; P2.pos.z = 0.000000000 * s;
  P3.pos.x = 0.000000000 * s; P3.pos.y = -1.000000000 * s; P3.pos.z = 0.000000000 * s;
  P4.pos.x = 0.000000000 * s; P4.pos.y = 0.000000000 * s; P4.pos.z = 1.000000000 * s;
  P5.pos.x = 0.000000000 * s; P5.pos.y = 0.000000000 * s; P5.pos.z = -1.000000000 * s;
  ag0 = (fk == 1) || (fk == 2); ah0 = (vk == 1) || (vk == 3); ag1 = (fk == 3) || (fk == 4); ah1 = (vk == 1) || (vk == 4); ag2 = (fk == 1) || (fk == 3); ah2 = (vk == 1) || (vk == 5); ag3 = (fk == 2) || (fk == 4); ah3 = (vk == 1) || (vk == 6); ag4 = (fk == 5) || (fk == 6); ah4 = (vk == 2) || (vk == 3); ag5 = (fk == 7) || (fk == 8); ah5 = (vk == 2) || (vk == 4); ag6 = (fk == 5) || (fk == 7); ah6 = (vk == 2) || (vk == 5); ag7 = (fk == 6) || (fk == 8); ah7 = (vk == 2) || (vk == 6); ag8 = (fk == 1) || (fk == 5); ah8 = (vk == 3) || (vk == 5); ag9 = (fk == 2) || (fk == 6); ah9 = (vk == 3) || (vk == 6); ag10 = (fk == 3) || (fk == 7); ah10 = (vk == 4) || (vk == 5); ag11 = (fk == 4) || (fk == 8); ah11 = (vk == 4) || (vk == 6);
  float R = a / sqrt(2); float r = a / sqrt(6);
  info = "**Октаэдр** — правильный многогранник: 8 граней — правильных треугольников, 6 вершин, 12 рёбер; в каждой вершине сходятся 4 ребра. Проверка: 6 − 12 + 8 = 2.\n\n";
  info = info + "Ребро a = " + format(a, 2) + ". Площадь поверхности S = 2√3·a² = **" + format(2 * sqrt(3) * a * a, 2) + "**, объём V = (√2/3)·a³ = **" + format(sqrt(2) / 3 * a * a * a, 2) + "**. Радиус описанной сферы R = a/√2 = " + format(R, 2) + ", вписанной r = a/√6 = " + format(r, 2) + ".\n\n";
  info = info + "Вершина №" + format(vk, 0) + " (оранжевые рёбра): в ней сходятся четыре ребра, плоский угол между соседними 60°. Грань №" + format(fk, 0) + " (зелёная) — правильный треугольник со стороной a, его площадь a²√3/4 = " + format(sqrt(3) / 4 * a * a, 2) + ". Двугранный угол между смежными гранями arccos(−1/3) ≈ 109,47°.";
}
]
