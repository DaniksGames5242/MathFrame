[
description = "{info}"

field width = 12; field height = 10; field depth = 12;
show grid = false; show axes = false;
camera start rot = (30, 62);
camera start zoom = 1.25;

new Point3D { name = "P0"; pos = (0, 0, 0); dynamic = false; collision = false }
new Point3D { name = "P1"; pos = (0, 0, 0); dynamic = false; collision = false }
new Point3D { name = "P2"; pos = (0, 0, 0); dynamic = false; collision = false }
new Point3D { name = "P3"; pos = (0, 0, 0); dynamic = false; collision = false }
new Point3D { name = "P4"; pos = (0, 0, 0); dynamic = false; collision = false }
new Point3D { name = "P5"; pos = (0, 0, 0); dynamic = false; collision = false }
new Point3D { name = "P6"; pos = (0, 0, 0); dynamic = false; collision = false }
new Point3D { name = "P7"; pos = (0, 0, 0); dynamic = false; collision = false }
new Point3D { name = "P8"; pos = (0, 0, 0); dynamic = false; collision = false }
new Point3D { name = "P9"; pos = (0, 0, 0); dynamic = false; collision = false }
new Point3D { name = "P10"; pos = (0, 0, 0); dynamic = false; collision = false }
new Point3D { name = "P11"; pos = (0, 0, 0); dynamic = false; collision = false }
new Point3D { name = "P12"; pos = (0, 0, 0); dynamic = false; collision = false }
new Point3D { name = "P13"; pos = (0, 0, 0); dynamic = false; collision = false }
new Point3D { name = "P14"; pos = (0, 0, 0); dynamic = false; collision = false }
new Point3D { name = "P15"; pos = (0, 0, 0); dynamic = false; collision = false }
new Point3D { name = "P16"; pos = (0, 0, 0); dynamic = false; collision = false }
new Point3D { name = "P17"; pos = (0, 0, 0); dynamic = false; collision = false }
new Point3D { name = "P18"; pos = (0, 0, 0); dynamic = false; collision = false }
new Point3D { name = "P19"; pos = (0, 0, 0); dynamic = false; collision = false }
new Line3D { name = "e0"; pos = (P0, P8); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e1"; pos = (P0, P9); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e2"; pos = (P0, P10); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e3"; pos = (P1, P9); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e4"; pos = (P1, P11); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e5"; pos = (P1, P13); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e6"; pos = (P2, P10); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e7"; pos = (P2, P12); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e8"; pos = (P2, P14); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e9"; pos = (P3, P12); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e10"; pos = (P3, P13); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e11"; pos = (P3, P17); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e12"; pos = (P4, P8); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e13"; pos = (P4, P15); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e14"; pos = (P4, P16); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e15"; pos = (P5, P11); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e16"; pos = (P5, P15); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e17"; pos = (P5, P19); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e18"; pos = (P6, P14); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e19"; pos = (P6, P16); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e20"; pos = (P6, P18); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e21"; pos = (P7, P17); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e22"; pos = (P7, P18); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e23"; pos = (P7, P19); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e24"; pos = (P8, P14); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e25"; pos = (P9, P15); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e26"; pos = (P10, P13); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e27"; pos = (P11, P17); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e28"; pos = (P12, P18); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "e29"; pos = (P16, P19); interact = false; thickness = 2; color = #3b82f6 }
new Line3D { name = "g0"; pos = (P0, P8); interact = false; thickness = 6; color = #22c55e; active = ag0 }
new Line3D { name = "h0"; pos = (P0, P8); interact = false; thickness = 6; color = #f59e0b; active = ah0 }
new Line3D { name = "g1"; pos = (P0, P9); interact = false; thickness = 6; color = #22c55e; active = ag1 }
new Line3D { name = "h1"; pos = (P0, P9); interact = false; thickness = 6; color = #f59e0b; active = ah1 }
new Line3D { name = "g2"; pos = (P0, P10); interact = false; thickness = 6; color = #22c55e; active = ag2 }
new Line3D { name = "h2"; pos = (P0, P10); interact = false; thickness = 6; color = #f59e0b; active = ah2 }
new Line3D { name = "g3"; pos = (P1, P9); interact = false; thickness = 6; color = #22c55e; active = ag3 }
new Line3D { name = "h3"; pos = (P1, P9); interact = false; thickness = 6; color = #f59e0b; active = ah3 }
new Line3D { name = "g4"; pos = (P1, P11); interact = false; thickness = 6; color = #22c55e; active = ag4 }
new Line3D { name = "h4"; pos = (P1, P11); interact = false; thickness = 6; color = #f59e0b; active = ah4 }
new Line3D { name = "g5"; pos = (P1, P13); interact = false; thickness = 6; color = #22c55e; active = ag5 }
new Line3D { name = "h5"; pos = (P1, P13); interact = false; thickness = 6; color = #f59e0b; active = ah5 }
new Line3D { name = "g6"; pos = (P2, P10); interact = false; thickness = 6; color = #22c55e; active = ag6 }
new Line3D { name = "h6"; pos = (P2, P10); interact = false; thickness = 6; color = #f59e0b; active = ah6 }
new Line3D { name = "g7"; pos = (P2, P12); interact = false; thickness = 6; color = #22c55e; active = ag7 }
new Line3D { name = "h7"; pos = (P2, P12); interact = false; thickness = 6; color = #f59e0b; active = ah7 }
new Line3D { name = "g8"; pos = (P2, P14); interact = false; thickness = 6; color = #22c55e; active = ag8 }
new Line3D { name = "h8"; pos = (P2, P14); interact = false; thickness = 6; color = #f59e0b; active = ah8 }
new Line3D { name = "g9"; pos = (P3, P12); interact = false; thickness = 6; color = #22c55e; active = ag9 }
new Line3D { name = "h9"; pos = (P3, P12); interact = false; thickness = 6; color = #f59e0b; active = ah9 }
new Line3D { name = "g10"; pos = (P3, P13); interact = false; thickness = 6; color = #22c55e; active = ag10 }
new Line3D { name = "h10"; pos = (P3, P13); interact = false; thickness = 6; color = #f59e0b; active = ah10 }
new Line3D { name = "g11"; pos = (P3, P17); interact = false; thickness = 6; color = #22c55e; active = ag11 }
new Line3D { name = "h11"; pos = (P3, P17); interact = false; thickness = 6; color = #f59e0b; active = ah11 }
new Line3D { name = "g12"; pos = (P4, P8); interact = false; thickness = 6; color = #22c55e; active = ag12 }
new Line3D { name = "h12"; pos = (P4, P8); interact = false; thickness = 6; color = #f59e0b; active = ah12 }
new Line3D { name = "g13"; pos = (P4, P15); interact = false; thickness = 6; color = #22c55e; active = ag13 }
new Line3D { name = "h13"; pos = (P4, P15); interact = false; thickness = 6; color = #f59e0b; active = ah13 }
new Line3D { name = "g14"; pos = (P4, P16); interact = false; thickness = 6; color = #22c55e; active = ag14 }
new Line3D { name = "h14"; pos = (P4, P16); interact = false; thickness = 6; color = #f59e0b; active = ah14 }
new Line3D { name = "g15"; pos = (P5, P11); interact = false; thickness = 6; color = #22c55e; active = ag15 }
new Line3D { name = "h15"; pos = (P5, P11); interact = false; thickness = 6; color = #f59e0b; active = ah15 }
new Line3D { name = "g16"; pos = (P5, P15); interact = false; thickness = 6; color = #22c55e; active = ag16 }
new Line3D { name = "h16"; pos = (P5, P15); interact = false; thickness = 6; color = #f59e0b; active = ah16 }
new Line3D { name = "g17"; pos = (P5, P19); interact = false; thickness = 6; color = #22c55e; active = ag17 }
new Line3D { name = "h17"; pos = (P5, P19); interact = false; thickness = 6; color = #f59e0b; active = ah17 }
new Line3D { name = "g18"; pos = (P6, P14); interact = false; thickness = 6; color = #22c55e; active = ag18 }
new Line3D { name = "h18"; pos = (P6, P14); interact = false; thickness = 6; color = #f59e0b; active = ah18 }
new Line3D { name = "g19"; pos = (P6, P16); interact = false; thickness = 6; color = #22c55e; active = ag19 }
new Line3D { name = "h19"; pos = (P6, P16); interact = false; thickness = 6; color = #f59e0b; active = ah19 }
new Line3D { name = "g20"; pos = (P6, P18); interact = false; thickness = 6; color = #22c55e; active = ag20 }
new Line3D { name = "h20"; pos = (P6, P18); interact = false; thickness = 6; color = #f59e0b; active = ah20 }
new Line3D { name = "g21"; pos = (P7, P17); interact = false; thickness = 6; color = #22c55e; active = ag21 }
new Line3D { name = "h21"; pos = (P7, P17); interact = false; thickness = 6; color = #f59e0b; active = ah21 }
new Line3D { name = "g22"; pos = (P7, P18); interact = false; thickness = 6; color = #22c55e; active = ag22 }
new Line3D { name = "h22"; pos = (P7, P18); interact = false; thickness = 6; color = #f59e0b; active = ah22 }
new Line3D { name = "g23"; pos = (P7, P19); interact = false; thickness = 6; color = #22c55e; active = ag23 }
new Line3D { name = "h23"; pos = (P7, P19); interact = false; thickness = 6; color = #f59e0b; active = ah23 }
new Line3D { name = "g24"; pos = (P8, P14); interact = false; thickness = 6; color = #22c55e; active = ag24 }
new Line3D { name = "h24"; pos = (P8, P14); interact = false; thickness = 6; color = #f59e0b; active = ah24 }
new Line3D { name = "g25"; pos = (P9, P15); interact = false; thickness = 6; color = #22c55e; active = ag25 }
new Line3D { name = "h25"; pos = (P9, P15); interact = false; thickness = 6; color = #f59e0b; active = ah25 }
new Line3D { name = "g26"; pos = (P10, P13); interact = false; thickness = 6; color = #22c55e; active = ag26 }
new Line3D { name = "h26"; pos = (P10, P13); interact = false; thickness = 6; color = #f59e0b; active = ah26 }
new Line3D { name = "g27"; pos = (P11, P17); interact = false; thickness = 6; color = #22c55e; active = ag27 }
new Line3D { name = "h27"; pos = (P11, P17); interact = false; thickness = 6; color = #f59e0b; active = ah27 }
new Line3D { name = "g28"; pos = (P12, P18); interact = false; thickness = 6; color = #22c55e; active = ag28 }
new Line3D { name = "h28"; pos = (P12, P18); interact = false; thickness = 6; color = #f59e0b; active = ah28 }
new Line3D { name = "g29"; pos = (P16, P19); interact = false; thickness = 6; color = #22c55e; active = ag29 }
new Line3D { name = "h29"; pos = (P16, P19); interact = false; thickness = 6; color = #f59e0b; active = ah29 }

new UI { name = "sA"; type = slider; label = "длина ребра a"; variable = a; min = 1.5; max = 3.2; step = 0.1; default = 2.4 }
new UI { name = "sV"; type = slider; label = "вершина №"; variable = vk; min = 1; max = 20; step = 1; default = 1 }
new UI { name = "sF"; type = slider; label = "грань №"; variable = fk; min = 1; max = 12; step = 1; default = 4 }

float a = 2.4; float vk = 1; float fk = 4; string info = "";
bool ag0 = false; bool ah0 = false; bool ag1 = false; bool ah1 = false; bool ag2 = false; bool ah2 = false; bool ag3 = false; bool ah3 = false; bool ag4 = false; bool ah4 = false; bool ag5 = false; bool ah5 = false; bool ag6 = false; bool ah6 = false; bool ag7 = false; bool ah7 = false; bool ag8 = false; bool ah8 = false; bool ag9 = false; bool ah9 = false; bool ag10 = false; bool ah10 = false; bool ag11 = false; bool ah11 = false; bool ag12 = false; bool ah12 = false; bool ag13 = false; bool ah13 = false; bool ag14 = false; bool ah14 = false; bool ag15 = false; bool ah15 = false; bool ag16 = false; bool ah16 = false; bool ag17 = false; bool ah17 = false; bool ag18 = false; bool ah18 = false; bool ag19 = false; bool ah19 = false; bool ag20 = false; bool ah20 = false; bool ag21 = false; bool ah21 = false; bool ag22 = false; bool ah22 = false; bool ag23 = false; bool ah23 = false; bool ag24 = false; bool ah24 = false; bool ag25 = false; bool ah25 = false; bool ag26 = false; bool ah26 = false; bool ag27 = false; bool ah27 = false; bool ag28 = false; bool ah28 = false; bool ag29 = false; bool ah29 = false;


Update {
  float s = a / 1.236067977;
  P0.pos.x = 1.000000000 * s; P0.pos.y = 1.000000000 * s; P0.pos.z = 1.000000000 * s;
  P1.pos.x = 1.000000000 * s; P1.pos.y = 1.000000000 * s; P1.pos.z = -1.000000000 * s;
  P2.pos.x = 1.000000000 * s; P2.pos.y = -1.000000000 * s; P2.pos.z = 1.000000000 * s;
  P3.pos.x = 1.000000000 * s; P3.pos.y = -1.000000000 * s; P3.pos.z = -1.000000000 * s;
  P4.pos.x = -1.000000000 * s; P4.pos.y = 1.000000000 * s; P4.pos.z = 1.000000000 * s;
  P5.pos.x = -1.000000000 * s; P5.pos.y = 1.000000000 * s; P5.pos.z = -1.000000000 * s;
  P6.pos.x = -1.000000000 * s; P6.pos.y = -1.000000000 * s; P6.pos.z = 1.000000000 * s;
  P7.pos.x = -1.000000000 * s; P7.pos.y = -1.000000000 * s; P7.pos.z = -1.000000000 * s;
  P8.pos.x = 0.000000000 * s; P8.pos.y = 0.618033989 * s; P8.pos.z = 1.618033989 * s;
  P9.pos.x = 0.618033989 * s; P9.pos.y = 1.618033989 * s; P9.pos.z = 0.000000000 * s;
  P10.pos.x = 1.618033989 * s; P10.pos.y = 0.000000000 * s; P10.pos.z = 0.618033989 * s;
  P11.pos.x = 0.000000000 * s; P11.pos.y = 0.618033989 * s; P11.pos.z = -1.618033989 * s;
  P12.pos.x = 0.618033989 * s; P12.pos.y = -1.618033989 * s; P12.pos.z = 0.000000000 * s;
  P13.pos.x = 1.618033989 * s; P13.pos.y = 0.000000000 * s; P13.pos.z = -0.618033989 * s;
  P14.pos.x = 0.000000000 * s; P14.pos.y = -0.618033989 * s; P14.pos.z = 1.618033989 * s;
  P15.pos.x = -0.618033989 * s; P15.pos.y = 1.618033989 * s; P15.pos.z = 0.000000000 * s;
  P16.pos.x = -1.618033989 * s; P16.pos.y = 0.000000000 * s; P16.pos.z = 0.618033989 * s;
  P17.pos.x = 0.000000000 * s; P17.pos.y = -0.618033989 * s; P17.pos.z = -1.618033989 * s;
  P18.pos.x = -0.618033989 * s; P18.pos.y = -1.618033989 * s; P18.pos.z = 0.000000000 * s;
  P19.pos.x = -1.618033989 * s; P19.pos.y = 0.000000000 * s; P19.pos.z = -0.618033989 * s;
  ag0 = (fk == 2) || (fk == 3); ah0 = (vk == 1) || (vk == 9); ag1 = (fk == 1) || (fk == 3); ah1 = (vk == 1) || (vk == 10); ag2 = (fk == 1) || (fk == 2); ah2 = (vk == 1) || (vk == 11); ag3 = (fk == 1) || (fk == 5); ah3 = (vk == 2) || (vk == 10); ag4 = (fk == 4) || (fk == 5); ah4 = (vk == 2) || (vk == 12); ag5 = (fk == 1) || (fk == 4); ah5 = (vk == 2) || (vk == 14); ag6 = (fk == 2) || (fk == 6); ah6 = (vk == 3) || (vk == 11); ag7 = (fk == 6) || (fk == 7); ah7 = (vk == 3) || (vk == 13); ag8 = (fk == 2) || (fk == 7); ah8 = (vk == 3) || (vk == 15); ag9 = (fk == 6) || (fk == 8); ah9 = (vk == 4) || (vk == 13); ag10 = (fk == 4) || (fk == 6); ah10 = (vk == 4) || (vk == 14); ag11 = (fk == 4) || (fk == 8); ah11 = (vk == 4) || (vk == 18); ag12 = (fk == 3) || (fk == 10); ah12 = (vk == 5) || (vk == 9); ag13 = (fk == 3) || (fk == 9); ah13 = (vk == 5) || (vk == 16); ag14 = (fk == 9) || (fk == 10); ah14 = (vk == 5) || (vk == 17); ag15 = (fk == 5) || (fk == 11); ah15 = (vk == 6) || (vk == 12); ag16 = (fk == 5) || (fk == 9); ah16 = (vk == 6) || (vk == 16); ag17 = (fk == 9) || (fk == 11); ah17 = (vk == 6) || (vk == 20); ag18 = (fk == 7) || (fk == 10); ah18 = (vk == 7) || (vk == 15); ag19 = (fk == 10) || (fk == 12); ah19 = (vk == 7) || (vk == 17); ag20 = (fk == 7) || (fk == 12); ah20 = (vk == 7) || (vk == 19); ag21 = (fk == 8) || (fk == 11); ah21 = (vk == 8) || (vk == 18); ag22 = (fk == 8) || (fk == 12); ah22 = (vk == 8) || (vk == 19); ag23 = (fk == 11) || (fk == 12); ah23 = (vk == 8) || (vk == 20); ag24 = (fk == 2) || (fk == 10); ah24 = (vk == 9) || (vk == 15); ag25 = (fk == 3) || (fk == 5); ah25 = (vk == 10) || (vk == 16); ag26 = (fk == 1) || (fk == 6); ah26 = (vk == 11) || (vk == 14); ag27 = (fk == 4) || (fk == 11); ah27 = (vk == 12) || (vk == 18); ag28 = (fk == 7) || (fk == 8); ah28 = (vk == 13) || (vk == 19); ag29 = (fk == 9) || (fk == 12); ah29 = (vk == 17) || (vk == 20);
  float t = (1 + sqrt(5)) / 2;
  float R = a * sqrt(3) * t / 2;
  float rho = a * t * t / 2;
  info = "**Додекаэдр** — правильный многогранник: 12 граней — равных правильных пятиугольников, 20 вершин, 30 рёбер; в каждой вершине сходятся 3 ребра. Проверка: 20 − 30 + 12 = 2.\n\n";
  info = info + "Ребро a = " + format(a, 2) + ". Площадь поверхности S = 3√(25 + 10√5)·a² = **" + format(3 * sqrt(25 + 10 * sqrt(5)) * a * a, 2) + "**, объём V = (15 + 7√5)/4·a³ = **" + format((15 + 7 * sqrt(5)) / 4 * a * a * a, 2) + "**.\n\n";
  info = info + "Сферы: описанная R = a√3·(1 + √5)/4 = " + format(R, 2) + ", полувписанная (через середины рёбер) ρ = a(3 + √5)/4 = " + format(rho, 2) + ", вписанная r = " + format(a * sqrt(250 + 110 * sqrt(5)) / 20, 2) + ".\n\n";
  info = info + "Вершина №" + format(vk, 0) + " (оранжевые рёбра): три ребра, плоский угол между ними 108°. Грань №" + format(fk, 0) + " (зелёная) — правильный пятиугольник со стороной a. Двугранный угол между смежными гранями ≈ 116,565°.";
}
]
