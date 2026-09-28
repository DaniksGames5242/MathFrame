[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (25, 65);
camera start zoom = 1.25;

// Плоскость α (внизу) содержит пересекающиеся прямые a₁, a₂. Плоскость β (вверху) —
// пересекающиеся прямые b₁, b₂ через точку O₂ над O₁. Ползунки t₁, t₂ отклоняют b₁, b₂
// от параллельности a₁, a₂; φ — угол между прямыми в плоскостях.
new Point3D { name = "O1"; pos = (0, -1.2, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "P1"; pos = (-3, -1.5, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "Q1"; pos = (3, -1.5, 0); dynamic = false; collision = false; text = true("a₁") }
new Point3D { name = "P2"; pos = (-3, -1.5, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "Q2"; pos = (3, -1.5, 0); dynamic = false; collision = false; text = true("a₂") }
new Point3D { name = "R1"; pos = (-3, 1.5, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "S1"; pos = (3, 1.5, 0); dynamic = false; collision = false; text = true("b₁") }
new Point3D { name = "R2"; pos = (-3, 1.5, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "S2"; pos = (3, 1.5, 0); dynamic = false; collision = false; text = true("b₂") }
new Point3D { name = "L1"; pos = (0, -1.2, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "L2"; pos = (0, -1.2, 0); dynamic = false; collision = false; active = false }

draw InfPlane { name = "planeA"; points = (P1, Q1, P2); size = 4.2; opacity = 0.25; color = #3b82f6 }
draw InfPlane { name = "planeB"; points = (R1, S1, R2); size = 4.2; opacity = 0.28; color = #f59e0b; active = notPar }
draw InfPlane { name = "planeG"; points = (R1, S1, R2); size = 4.2; opacity = 0.28; color = #22c55e; active = parl }
new Line3D { name = "a1"; pos = (P1, Q1); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "a2"; pos = (P2, Q2); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "b1"; pos = (R1, S1); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "b2"; pos = (R2, S2); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "isect"; pos = (L1, L2); interact = false; thickness = 4; color = #22c55e }

new UI { name = "sT1"; type = slider; label = "отклонение b₁ от a₁, °"; variable = t1; min = -50; max = 50; step = 1; default = 0 }
new UI { name = "sT2"; type = slider; label = "отклонение b₂ от a₂, °"; variable = t2; min = -50; max = 50; step = 1; default = 0 }
new UI { name = "sPhi"; type = slider; label = "угол между прямыми φ, °"; variable = phi; min = 30; max = 150; step = 1; default = 70 }
new UI { name = "sH"; type = slider; label = "расстояние между плоскостями"; variable = h; min = 1; max = 4; step = 0.1; default = 2.4 }

string info = "";
float parl = 0; float notPar = 1;
float t1 = 0; float t2 = 0; float phi = 70; float h = 2.4;

Update {
  float p = radians(phi);
  float ux = cos(p); float uz = sin(p);
  float y0 = -h / 2; float y1 = h / 2;
  float c1 = cos(radians(t1)); float s1 = sin(radians(t1));
  float c2 = cos(radians(t2)); float s2 = sin(radians(t2));
  // a₁ вдоль оси x, a₂ под углом φ к ней; b₁, b₂ — те же направления, приподнятые на t₁, t₂.
  P1.pos.x = -3; P1.pos.y = y0; P1.pos.z = 0;
  Q1.pos.x = 3; Q1.pos.y = y0; Q1.pos.z = 0;
  P2.pos.x = -3 * ux; P2.pos.y = y0; P2.pos.z = -3 * uz;
  Q2.pos.x = 3 * ux; Q2.pos.y = y0; Q2.pos.z = 3 * uz;
  R1.pos.x = -3 * c1; R1.pos.y = y1 - 3 * s1; R1.pos.z = 0;
  S1.pos.x = 3 * c1; S1.pos.y = y1 + 3 * s1; S1.pos.z = 0;
  R2.pos.x = -3 * ux * c2; R2.pos.y = y1 - 3 * s2; R2.pos.z = -3 * uz * c2;
  S2.pos.x = 3 * ux * c2; S2.pos.y = y1 + 3 * s2; S2.pos.z = 3 * uz * c2;

  // Нормаль β — векторное произведение направлений b₁ и b₂.
  float d1x = c1; float d1y = s1; float d1z = 0;
  float d2x = ux * c2; float d2y = s2; float d2z = uz * c2;
  float nx = d1y * d2z - d1z * d2y; float ny = d1z * d2x - d1x * d2z; float nz = d1x * d2y - d1y * d2x;
  float nl = sqrt(nx * nx + ny * ny + nz * nz);
  float ang = acos(min(abs(ny) / nl, 1)) * 57.29578;
  parl = 0;
  if (t1 == 0 && t2 == 0) { parl = 1; }
  notPar = 1 - parl;

  // Линии пересечения нет — оба конца в одной точке (отрезок нулевой длины не виден).
  L1.pos.x = 0; L1.pos.y = y0; L1.pos.z = 0; L2.pos.x = 0; L2.pos.y = y0; L2.pos.z = 0;
  if (parl == 0) {
    // α ∩ β: направление (nz, 0, −nx), точка на α ближе всех к оси.
    float q = nx * nx + nz * nz;
    float k = ny * h / q;
    float dl = sqrt(q);
    float px = nx * k; float pz = nz * k;
    if (abs(k) * dl < 6) {
      L1.pos.x = px - nz / dl * 4; L1.pos.y = y0; L1.pos.z = pz + nx / dl * 4;
      L2.pos.x = px + nz / dl * 4; L2.pos.y = y0; L2.pos.z = pz - nx / dl * 4;
    }
  }

  info = "**Признак параллельности плоскостей.** Если две пересекающиеся прямые плоскости β соответственно параллельны двум пересекающимся прямым плоскости α, то α ∥ β.\n\nСейчас угол между b₁ и a₁ равен " + format(abs(t1), 0) + "°, между b₂ и a₂ — " + format(abs(t2), 0) + "°.";
  if (parl == 1) {
    info = info + " **b₁ ∥ a₁ и b₂ ∥ a₂ — плоскости параллельны** (общих точек нет, расстояние между ними " + format(h, 1) + ").";
  } else if (t1 == 0 || t2 == 0) {
    info = info + " Параллельна только одна пара прямых — этого мало: плоскости пересекаются, угол между ними " + format(ang, 1) + "°. Линия пересечения параллельна прямой, оставшейся параллельной.";
  } else {
    info = info + " Ни одна пара не параллельна — плоскости пересекаются под углом " + format(ang, 1) + "°.";
  }
}
]
