[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (40, 62);
camera start zoom = 0.8;

// Ребро — ось x; грани — полуплоскости (квадраты; вершины задают E2, E1 и утроенный центр T).
// Линейные углы строятся в точках M₁ и M₂ ребра: лучи в гранях, перпендикулярные ребру.
// Зелёная плоскость через M₁ перпендикулярна ребру — в ней лежит линейный угол.
new Point3D { name = "E1"; pos = (-3.5, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "E2"; pos = (3.5, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "T1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "T2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "M1"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("M₁") }
new Point3D { name = "A1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "B1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "M2"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("M₂") }
new Point3D { name = "A2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "B2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "N0"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "N1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "N2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }

draw InfPlane { name = "faceA"; points = (E2, E1, T1); size = 3.5; opacity = 0.3; color = #3b82f6 }
draw InfPlane { name = "faceB"; points = (E2, E1, T2); size = 3.5; opacity = 0.3; color = #f59e0b }
draw InfPlane { name = "perp"; points = (N0, N1, N2); size = 2.6; opacity = 0.14; color = #22c55e }
new Line3D { name = "edge"; pos = (E1, E2); interact = false; thickness = 4 }
new Line3D { name = "r1a"; pos = (M1, A1); interact = false; thickness = 4; color = #22c55e }
new Line3D { name = "r1b"; pos = (M1, B1); interact = false; thickness = 4; color = #22c55e }
new Line3D { name = "r2a"; pos = (M2, A2); interact = false; thickness = 3; color = #22c55e }
new Line3D { name = "r2b"; pos = (M2, B2); interact = false; thickness = 3; color = #22c55e }
new Angle3D { name = "θ₁"; type = pointAngle; vertex = M1; point1 = A1; point2 = B1; radius = 1.1 }
new Angle3D { name = "θ₂"; type = pointAngle; vertex = M2; point1 = A2; point2 = B2; radius = 0.9 }

new UI { name = "sPhi"; type = slider; label = "двугранный угол φ, °"; variable = phi; min = 10; max = 170; step = 1; default = 65 }
new UI { name = "sM1"; type = slider; label = "точка M₁ на ребре"; variable = m1; min = -2.5; max = 2.5; step = 0.1; default = 0.8 }
new UI { name = "sM2"; type = slider; label = "точка M₂ на ребре"; variable = m2; min = -2.5; max = 2.5; step = 0.1; default = -1.8 }
new UI { name = "sPsi"; type = slider; label = "отклонение луча в грани α от перпендикуляра, °"; variable = psi; min = 0; max = 60; step = 1; default = 0 }

string info = "";
float phi = 65; float m1 = 0.8; float m2 = -1.8; float psi = 0;

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  float a1 = radians(25); float a2 = radians(25 + phi);
  float c1 = cos(a1); float s1 = sin(a1); float c2 = cos(a2); float s2 = sin(a2);
  T1.pos.y = 10.5 * c1; T1.pos.z = 10.5 * s1;
  T2.pos.y = 10.5 * c2; T2.pos.z = 10.5 * s2;
  M1.pos.x = m1; M2.pos.x = m2;
  float p = radians(psi); float cp = cos(p); float sp = sin(p);
  // M₁: луч в α отклонён от перпендикуляра ребру на угол ψ (вдоль ребра); луч в β — перпендикуляр.
  A1.pos.x = m1 + 2.4 * sp; A1.pos.y = 2.4 * cp * c1; A1.pos.z = 2.4 * cp * s1;
  B1.pos.x = m1; B1.pos.y = 2.4 * c2; B1.pos.z = 2.4 * s2;
  A2.pos.x = m2; A2.pos.y = 2.4 * c1; A2.pos.z = 2.4 * s1;
  B2.pos.x = m2; B2.pos.y = 2.4 * c2; B2.pos.z = 2.4 * s2;
  N0.pos.x = m1; N0.pos.y = -1.7; N0.pos.z = -1.7;
  N1.pos.x = m1; N1.pos.y = 1.7; N1.pos.z = -1.7;
  N2.pos.x = m1; N2.pos.y = 0; N2.pos.z = 3.4;

  float th = acos(cp * cos(radians(phi))) * 57.29578;
  info = "**Линейный угол двугранного угла** — угол между двумя лучами, каждый из которых лежит в своей грани и перпендикулярен ребру в одной и той же точке. Он лежит в плоскости, перпендикулярной ребру, и служит мерой двугранного угла: **φ = " + format(phi, 0) + "°**.\n\n";
  if (psi == 0) {
    info = info + "В точках M₁ (x = " + num(m1, 1) + ") и M₂ (x = " + num(m2, 1) + ") линейные углы равны " + format(phi, 0) + "° и " + format(phi, 0) + "° — величина не зависит от выбора точки на ребре.";
  } else {
    info = info + "Луч в грани α при M₁ отклонён на " + format(psi, 0) + "° и уже не перпендикулярен ребру: угол между лучами " + format(th, 1) + "° ≠ φ. Линейный угол при M₂ по-прежнему равен " + format(phi, 0) + "°.";
  }
  info = info + "\n\nСмежному двугранному углу отвечает линейный угол 180° − φ = " + format(180 - phi, 0) + "° (вместе — развёрнутый угол).";
}
]
