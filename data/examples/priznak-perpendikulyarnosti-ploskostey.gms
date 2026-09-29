[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (35, 60);
camera start zoom = 1.15;

// Плоскость β — горизонтальная (синяя). Плоскость α (жёлтая) содержит прямую ℓ (зелёная)
// и линию пересечения с β. Наклон ℓ от вертикали — ползунок δ, положение линии пересечения в β — ρ.
new Point3D { name = "P0"; pos = (2, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "P1"; pos = (-1, 0, 1.7); dynamic = false; collision = false; active = false }
new Point3D { name = "P2"; pos = (-1, 0, -1.7); dynamic = false; collision = false; active = false }
new Point3D { name = "A0"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "A1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "A2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "E1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "E2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("O") }
new Point3D { name = "L1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "L2"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("ℓ") }
new Point3D { name = "K"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "U"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }

draw InfPlane { name = "beta"; points = (P0, P1, P2); size = 3.2; opacity = 0.22; color = #3b82f6 }
draw InfPlane { name = "alpha"; points = (A0, A1, A2); size = 2.4; opacity = 0.22; color = #f59e0b }
new Line3D { name = "edge"; pos = (E1, E2); interact = false; thickness = 4 }
new Line3D { name = "ell"; pos = (L1, L2); interact = false; thickness = 4; color = #22c55e }
new Line3D { name = "rk"; pos = (O, K); interact = false; thickness = 2 }
new Line3D { name = "ru"; pos = (O, U); interact = false; thickness = 2 }
new Angle3D { name = "φ"; type = pointAngle; vertex = O; point1 = K; point2 = U; radius = 1.1 }

new UI { name = "sD"; type = slider; label = "отклонение ℓ от перпендикуляра к β, °"; variable = del; min = 0; max = 60; step = 1; default = 0 }
new UI { name = "sR"; type = slider; label = "поворот α вокруг вертикали, °"; variable = rho; min = 0; max = 180; step = 1; default = 30 }

string info = "";
float del = 0; float rho = 30;

Update {
  float d = radians(del); float r = radians(rho);
  float hx = cos(r); float hz = sin(r);       // линия пересечения α ∩ β
  float kx = -sin(r); float kz = cos(r);      // перпендикуляр к ней в β
  float ux = sin(d) * kx; float uy = cos(d); float uz = sin(d) * kz;   // направление ℓ
  float cx = 1.2 * ux; float cy = 1.2 * uy; float cz = 1.2 * uz;
  E1.pos.x = -3 * hx; E1.pos.z = -3 * hz; E2.pos.x = 3 * hx; E2.pos.z = 3 * hz;
  L1.pos.x = -1.2 * ux; L1.pos.y = -1.2 * uy; L1.pos.z = -1.2 * uz;
  L2.pos.x = 3.6 * ux; L2.pos.y = 3.6 * uy; L2.pos.z = 3.6 * uz;
  // α: квадрат с центром c, стороны вдоль h и u; вершины-опоры сумма которых 3c.
  A0.pos.x = cx + hx - ux; A0.pos.y = cy - uy; A0.pos.z = cz + hz - uz;
  A1.pos.x = cx - hx - ux; A1.pos.y = cy - uy; A1.pos.z = cz - hz - uz;
  A2.pos.x = cx + 2 * ux; A2.pos.y = cy + 2 * uy; A2.pos.z = cz + 2 * uz;
  K.pos.x = 2.4 * kx; K.pos.y = 0; K.pos.z = 2.4 * kz;
  U.pos.x = 2.4 * ux; U.pos.y = 2.4 * uy; U.pos.z = 2.4 * uz;

  info = "**Признак перпендикулярности плоскостей.** Если одна из двух плоскостей содержит прямую, перпендикулярную другой плоскости, то эти плоскости перпендикулярны.\n\n";
  if (del == 0) {
    info = info + "Прямая ℓ лежит в α и перпендикулярна β, поэтому **α ⟂ β**: линейный угол двугранного угла равен 90° — угол между перпендикуляром к линии пересечения в β и ℓ. Для любой плоскости α, содержащей ℓ (поворот вокруг вертикали), вывод один и тот же.";
  } else {
    info = info + "Прямая ℓ отклонена от перпендикуляра к β на " + format(del, 0) + "°: условие признака не выполнено, и плоскости пересекаются под углом **" + format(90 - del, 0) + "°**, а не 90°.";
  }
}
]
