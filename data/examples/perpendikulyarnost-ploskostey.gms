[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (35, 62);
camera start zoom = 1.2;

// Плоскости α (синяя) и β (жёлтая) взаимно перпендикулярны при любом положении в пространстве:
// в исходной сцене ребро — ось x, α ⟂ y, β ⟂ z, затем вся конструкция поворачивается ползунками.
// Нормали n₁, n₂ — стрелки из O; прямая m ⊂ α перпендикулярна ребру в точке M.
new Point3D { name = "A0"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "A1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "A2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "B0"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "B1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "B2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "E1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "E2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "N1"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("n₁"); color = #3b82f6 }
new Point3D { name = "N2"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("n₂"); color = #f59e0b }
new Point3D { name = "M"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("M") }
new Point3D { name = "Q1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "Q2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "Q3"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("m") }

draw InfPlane { name = "alpha"; points = (A0, A1, A2); size = 3; opacity = 0.22; color = #3b82f6 }
draw InfPlane { name = "beta"; points = (B0, B1, B2); size = 3; opacity = 0.22; color = #f59e0b }
new Line3D { name = "edge"; pos = (E1, E2); interact = false; thickness = 4 }
new Line3D { name = "nn1"; pos = (O, N1); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "nn2"; pos = (O, N2); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "lm"; pos = (Q3, Q1); interact = false; thickness = 4; color = #22c55e }
new Line3D { name = "lq"; pos = (M, Q2); interact = false; thickness = 3; color = #22c55e }
new Angle3D { name = "φ"; type = pointAngle; vertex = M; point1 = Q1; point2 = Q2; radius = 0.9 }

new UI { name = "sPsi"; type = slider; label = "поворот вокруг вертикали, °"; variable = psi; min = 0; max = 360; step = 1; default = 30 }
new UI { name = "sTau"; type = slider; label = "наклон конструкции, °"; variable = tau; min = -60; max = 60; step = 1; default = 20 }
new UI { name = "sM"; type = slider; label = "точка M на ребре"; variable = mx; min = -2.4; max = 2.4; step = 0.1; default = 0.6 }

string info = "";
float psi = 30; float tau = 20; float mx = 0.6;
float rt = 0; float rp = 0;

// Поворот: сначала вокруг оси z на τ (наклон ребра), затем вокруг вертикали y на ψ.
Function gx(x, y, z) { return cos(rp) * (cos(rt) * x - sin(rt) * y) + sin(rp) * z; }
Function gy(x, y, z) { return sin(rt) * x + cos(rt) * y; }
Function gz(x, y, z) { return -sin(rp) * (cos(rt) * x - sin(rt) * y) + cos(rp) * z; }
Function num(x, d) { if (abs(x) < 0.005) { return "0"; } if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  rt = radians(tau); rp = radians(psi);
  A0.pos.x = gx(2, 0, 0); A0.pos.y = gy(2, 0, 0); A0.pos.z = gz(2, 0, 0);
  A1.pos.x = gx(-1, 0, 1.7); A1.pos.y = gy(-1, 0, 1.7); A1.pos.z = gz(-1, 0, 1.7);
  A2.pos.x = gx(-1, 0, -1.7); A2.pos.y = gy(-1, 0, -1.7); A2.pos.z = gz(-1, 0, -1.7);
  B0.pos.x = A0.pos.x; B0.pos.y = A0.pos.y; B0.pos.z = A0.pos.z;
  B1.pos.x = gx(-1, 1.7, 0); B1.pos.y = gy(-1, 1.7, 0); B1.pos.z = gz(-1, 1.7, 0);
  B2.pos.x = gx(-1, -1.7, 0); B2.pos.y = gy(-1, -1.7, 0); B2.pos.z = gz(-1, -1.7, 0);
  E1.pos.x = gx(-3, 0, 0); E1.pos.y = gy(-3, 0, 0); E1.pos.z = gz(-3, 0, 0);
  E2.pos.x = gx(3, 0, 0); E2.pos.y = gy(3, 0, 0); E2.pos.z = gz(3, 0, 0);
  N1.pos.x = gx(0, 2.2, 0); N1.pos.y = gy(0, 2.2, 0); N1.pos.z = gz(0, 2.2, 0);
  N2.pos.x = gx(0, 0, 2.2); N2.pos.y = gy(0, 0, 2.2); N2.pos.z = gz(0, 0, 2.2);
  M.pos.x = gx(mx, 0, 0); M.pos.y = gy(mx, 0, 0); M.pos.z = gz(mx, 0, 0);
  Q1.pos.x = gx(mx, 0, 2.4); Q1.pos.y = gy(mx, 0, 2.4); Q1.pos.z = gz(mx, 0, 2.4);
  Q3.pos.x = gx(mx, 0, -2.4); Q3.pos.y = gy(mx, 0, -2.4); Q3.pos.z = gz(mx, 0, -2.4);
  Q2.pos.x = gx(mx, 2.4, 0); Q2.pos.y = gy(mx, 2.4, 0); Q2.pos.z = gz(mx, 2.4, 0);

  // Нормали единичной длины: n₁ = R·(0,1,0), n₂ = R·(0,0,1).
  float ax = gx(0, 1, 0); float ay = gy(0, 1, 0); float az = gz(0, 1, 0);
  float bx = gx(0, 0, 1); float by = gy(0, 0, 1); float bz = gz(0, 0, 1);
  float dt = ax * bx + ay * by + az * bz;
  info = "**Перпендикулярные плоскости** α и β — плоскости, двугранный угол между которыми прямой (линейный угол при M равен 90°). Равносильно: перпендикулярны их нормальные векторы.\n\nn₁ = (" + num(ax, 2) + "; " + num(ay, 2) + "; " + num(az, 2) + "), n₂ = (" + num(bx, 2) + "; " + num(by, 2) + "; " + num(bz, 2) + "): **n₁·n₂ = A₁A₂ + B₁B₂ + C₁C₂ = " + num(dt, 2) + "**.\n\nПрямая m лежит в α и перпендикулярна линии пересечения плоскостей, поэтому m ⟂ β: она перпендикулярна и ребру, и второй прямой из β, проходящей через M (угол между ними 90°).";
}
]
