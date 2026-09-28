[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (25, 62);
camera start zoom = 1.1;

// Точка A на высоте h над плоскостью α. AO — перпендикуляр, AB и AC — наклонные;
// OB и OC — их проекции. Ползунки: высота h и длины проекций p₁ = OB, p₂ = OC.
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("O") }
new Point3D { name = "A"; pos = (0, 2.5, 0); dynamic = false; collision = false; text = true("A") }
new Point3D { name = "B"; pos = (3, 0, 1); dynamic = false; collision = false; text = true("B") }
new Point3D { name = "C"; pos = (-1, 0, -2); dynamic = false; collision = false; text = true("C") }
new Point3D { name = "Pu"; pos = (1, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "Pv"; pos = (0, 0, 1); dynamic = false; collision = false; active = false }

draw InfPlane { name = "planeA"; points = (O, Pu, Pv); size = 3.8; opacity = 0.22; color = #3b82f6 }
new Line3D { name = "ao"; pos = (A, O); interact = false; thickness = 4; color = #22c55e }
new Line3D { name = "ab"; pos = (A, B); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "ac"; pos = (A, C); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "ob"; pos = (O, B); interact = false; thickness = 2.5; color = #3b82f6 }
new Line3D { name = "oc"; pos = (O, C); interact = false; thickness = 2.5; color = #3b82f6 }

new UI { name = "sH"; type = slider; label = "высота h = AO"; variable = h; min = 1; max = 4; step = 0.1; default = 2.5 }
new UI { name = "sP1"; type = slider; label = "проекция p₁ = OB"; variable = p1; min = 0.5; max = 4; step = 0.1; default = 3 }
new UI { name = "sP2"; type = slider; label = "проекция p₂ = OC"; variable = p2; min = 0.5; max = 4; step = 0.1; default = 2.2 }

string info = "";
float h = 2.5; float p1 = 3; float p2 = 2.2;

Update {
  A.pos.x = 0; A.pos.y = h; A.pos.z = 0;
  // B и C лежат в плоскости α на расстояниях p₁, p₂ от O в разных направлениях.
  B.pos.x = p1 * cos(0.35); B.pos.y = 0; B.pos.z = p1 * sin(0.35);
  C.pos.x = p2 * cos(3.6); C.pos.y = 0; C.pos.z = p2 * sin(3.6);

  float l1 = sqrt(h * h + p1 * p1);
  float l2 = sqrt(h * h + p2 * p2);
  float a1 = atan(h / p1) * 57.29578;
  info = "**Перпендикуляр и наклонная.** Из точки A к плоскости α проведены перпендикуляр AO = h = " + format(h, 1) + " и две наклонные AB, AC с проекциями OB = p₁ = " + format(p1, 1) + ", OC = p₂ = " + format(p2, 1) + ".\n\nТреугольники AOB и AOC прямоугольные, поэтому l² = h² + p²: AB = √(" + format(h * h, 2) + " + " + format(p1 * p1, 2) + ") = " + format(l1, 2) + ", AC = √(" + format(h * h, 2) + " + " + format(p2 * p2, 2) + ") = " + format(l2, 2) + ". Каждая наклонная длиннее перпендикуляра " + format(h, 1) + ", и угол наклонной AB с плоскостью острый: " + format(a1, 1) + "°.";
  if (abs(p1 - p2) < 0.05) { info = info + " Проекции равны — равны и наклонные."; }
  else if (p1 > p2) { info = info + " Проекция OB больше OC — и наклонная AB длиннее AC."; }
  else { info = info + " Проекция OC больше OB — и наклонная AC длиннее AB."; }
}
]
