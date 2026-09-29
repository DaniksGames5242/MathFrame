[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (40, 62);
camera start zoom = 0.8;

// Ребро — ось x. Две плоскости α и β через ребро делят пространство на четыре двугранных угла.
// Каждая грань — полуплоскость: квадрат, центр которого лежит на расстоянии s от ребра.
// Вершины квадрата задаются точками E2, E1 (концы ребра) и T (утроенный центр грани).
new Point3D { name = "E1"; pos = (-3.5, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "E2"; pos = (3.5, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "T1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "T2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "T3"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "T4"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "M"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("M") }
new Point3D { name = "R1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "R2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }

draw InfPlane { name = "f1"; points = (E2, E1, T1); size = 3.5; opacity = o1; color = #3b82f6 }
draw InfPlane { name = "f2"; points = (E2, E1, T2); size = 3.5; opacity = o2; color = #3b82f6 }
draw InfPlane { name = "f3"; points = (E2, E1, T3); size = 3.5; opacity = o3; color = #f59e0b }
draw InfPlane { name = "f4"; points = (E2, E1, T4); size = 3.5; opacity = o4; color = #f59e0b }
new Line3D { name = "edge"; pos = (E1, E2); interact = false; thickness = 4 }
new Line3D { name = "ray1"; pos = (M, R1); interact = false; thickness = 4; color = #22c55e }
new Line3D { name = "ray2"; pos = (M, R2); interact = false; thickness = 4; color = #22c55e }
new Angle3D { name = "φ"; type = dihedral; edge = (E1, E2); point1 = R1; point2 = R2; vertex = M; radius = 1.1 }

new UI { name = "sPhi"; type = slider; label = "угол между плоскостями φ, °"; variable = phi; min = 10; max = 170; step = 1; default = 65 }
new UI { name = "sRho"; type = slider; label = "поворот вокруг ребра, °"; variable = rho; min = 0; max = 360; step = 1; default = 20 }
new UI { name = "sK"; type = slider; label = "выбранный двугранный угол №"; variable = kk; min = 1; max = 4; step = 1; default = 1 }
new UI { name = "sM"; type = slider; label = "точка M на ребре"; variable = mx; min = -2.5; max = 2.5; step = 0.1; default = 0 }

string info = "";
float phi = 65; float rho = 20; float kk = 1; float mx = 0;
float o1 = 0.35; float o2 = 0.1; float o3 = 0.35; float o4 = 0.1;

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  float a1 = radians(rho); float a2 = radians(rho + phi);
  float c1 = cos(a1); float s1 = sin(a1); float c2 = cos(a2); float s2 = sin(a2);
  float q = 10.5;
  T1.pos.y = q * c1; T1.pos.z = q * s1;
  T2.pos.y = -q * c1; T2.pos.z = -q * s1;
  T3.pos.y = q * c2; T3.pos.z = q * s2;
  T4.pos.y = -q * c2; T4.pos.z = -q * s2;
  float sg1 = 1; float sg2 = 1;
  if (kk > 1.5 && kk < 3.5) { sg1 = -1; }
  if (kk > 2.5) { sg2 = -1; }
  o1 = 0.08; o2 = 0.08; o3 = 0.08; o4 = 0.08;
  if (sg1 > 0) { o1 = 0.4; } else { o2 = 0.4; }
  if (sg2 > 0) { o3 = 0.4; } else { o4 = 0.4; }
  // Линейный угол: лучи из M, перпендикулярные ребру, по одному в каждой грани.
  M.pos.x = mx;
  R1.pos.x = mx; R1.pos.y = 2.4 * sg1 * c1; R1.pos.z = 2.4 * sg1 * s1;
  R2.pos.x = mx; R2.pos.y = 2.4 * sg2 * c2; R2.pos.z = 2.4 * sg2 * s2;

  float ang = phi;
  if (sg1 * sg2 < 0) { ang = 180 - phi; }
  string kind = "острый";
  if (abs(ang - 90) < 0.5) { kind = "прямой"; } else if (ang > 90) { kind = "тупой"; }
  info = "**Двугранный угол** — фигура из двух полуплоскостей (граней) с общей границей — ребром. Плоскости α и β делят пространство на четыре двугранных угла: φ, 180° − φ, φ, 180° − φ.\n\nМера — **линейный угол**: угол между перпендикулярами к ребру, проведёнными в гранях из одной точки M ребра. Выбран угол №" + format(kk, 0) + ": его линейный угол равен **" + format(ang, 0) + "°** — " + kind + " двугранный угол.\n\nСмежный с ним угол равен " + format(180 - ang, 0) + "° (вместе 180°), вертикальный — " + format(ang, 0) + "°. Угол между нормалями плоскостей: cos = n₁·n₂ / (|n₁|·|n₂|) = " + num(cos(radians(phi)), 2) + ".";
}
]
