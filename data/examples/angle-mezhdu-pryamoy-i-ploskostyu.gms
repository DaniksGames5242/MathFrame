[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (35, 68);
camera start zoom = 1.3;

// Плоскость α — горизонтальный квадрат (синий). Прямая a (жёлтая) пересекает её в точке O,
// B′ — проекция B на α, OB′ — проекция прямой (зелёная). Синяя прямая c лежит в α и проходит через O:
// среди углов между a и прямыми плоскости наименьший — с проекцией.
new Point3D { name = "P0"; pos = (2, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "P1"; pos = (-1, 0, 1.7); dynamic = false; collision = false; active = false }
new Point3D { name = "P2"; pos = (-1, 0, -1.7); dynamic = false; collision = false; active = false }
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("O") }
new Point3D { name = "B"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("B") }
new Point3D { name = "B2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "Bp"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("B′") }
new Point3D { name = "C1"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("c") }
new Point3D { name = "C2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }

draw InfPlane { name = "alpha"; points = (P0, P1, P2); size = 3.5; opacity = 0.22; color = #3b82f6 }
new Line3D { name = "la"; pos = (B2, B); interact = false; thickness = 4; color = #f59e0b }
new Line3D { name = "lproj"; pos = (O, Bp); interact = false; thickness = 4; color = #22c55e }
new Line3D { name = "lperp"; pos = (B, Bp); interact = false; thickness = 1.5 }
new Line3D { name = "lc"; pos = (C2, C1); interact = false; thickness = 3; color = #3b82f6 }
new Angle3D { name = "θ"; type = pointAngle; vertex = O; point1 = B; point2 = Bp; radius = 1.4; active = showArc }

new UI { name = "sG"; type = slider; label = "наклон γ, °"; variable = gam; min = 0; max = 90; step = 1; default = 40 }
new UI { name = "sA"; type = slider; label = "направление a, °"; variable = alp; min = 0; max = 360; step = 1; default = 30 }
new UI { name = "sB"; type = slider; label = "направление c, °"; variable = bet; min = 0; max = 360; step = 1; default = 110 }

string info = "";
float showArc = 1; float gam = 40; float alp = 30; float bet = 110;

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  showArc = 0;
  if (gam > 0.5 && gam < 89.5) { showArc = 1; }
  float g = radians(gam); float a = radians(alp); float b = radians(bet);
  float L = 3.4;
  B.pos.x = L * cos(g) * cos(a); B.pos.y = L * sin(g); B.pos.z = L * cos(g) * sin(a);
  B2.pos.x = -B.pos.x; B2.pos.y = -B.pos.y; B2.pos.z = -B.pos.z;
  Bp.pos.x = B.pos.x; Bp.pos.y = 0; Bp.pos.z = B.pos.z;
  C1.pos.x = 3.2 * cos(b); C1.pos.y = 0; C1.pos.z = 3.2 * sin(b);
  C2.pos.x = -C1.pos.x; C2.pos.y = 0; C2.pos.z = -C1.pos.z;

  // угол между a и c: cos φ = cos γ · |cos(a − b)|
  float fc = acos(min(cos(g) * abs(cos(a - b)), 1)) * 57.29578;
  info = "**Угол между прямой и плоскостью** — наименьший из углов между данной прямой и прямыми, лежащими в плоскости. Он равен углу между прямой a и её ортогональной проекцией на плоскость: **γ = " + format(gam, 0) + "°**.\n\n";
  if (gam < 0.5) {
    info = info + "Прямая параллельна плоскости (или лежит в ней): угол равен 0°.";
  } else if (gam > 89.5) {
    info = info + "Прямая перпендикулярна плоскости: угол равен 90°, проекция — точка O, а угол с любой прямой плоскости прямой.";
  } else {
    info = info + "Проекция OB′ — длина " + format(3.4 * cos(g), 2) + ", высота BB′ = " + format(3.4 * sin(g), 2) + ". Угол между a и нормалью к плоскости: 90° − γ = " + format(90 - gam, 0) + "°.";
  }
  info = info + "\n\nУгол между a и прямой c плоскости: **" + format(fc, 1) + "°** ≥ γ. Равенство — когда c совпадает с проекцией (та же ориентация в плоскости).";
}
]
