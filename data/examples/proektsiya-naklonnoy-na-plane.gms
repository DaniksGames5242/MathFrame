[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (25, 62);
camera start zoom = 1.1;

// Наклонная AB длины l образует с плоскостью α угол φ (ползунки l, φ, азимут ω проекции);
// OB — её проекция, AO — перпендикуляр. Вторая наклонная AC длиннее на d (при d = 0 — равная).
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("O") }
new Point3D { name = "A"; pos = (0, 2.2, 0); dynamic = false; collision = false; text = true("A") }
new Point3D { name = "B"; pos = (2.7, 0, 0); dynamic = false; collision = false; text = true("B") }
new Point3D { name = "C"; pos = (-2, 0, 1.8); dynamic = false; collision = false; text = true("C") }
new Point3D { name = "Pu"; pos = (1, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "Pv"; pos = (0, 0, 1); dynamic = false; collision = false; active = false }

draw InfPlane { name = "planeA"; points = (O, Pu, Pv); size = 3.8; opacity = 0.22; color = #3b82f6 }
new Line3D { name = "ao"; pos = (A, O); interact = false; thickness = 2 }
new Line3D { name = "ab"; pos = (A, B); interact = false; thickness = 3.5; color = #f59e0b }
new Line3D { name = "ac"; pos = (A, C); interact = false; thickness = 2.5; color = #f59e0b }
new Line3D { name = "ob"; pos = (O, B); interact = false; thickness = 3.5; color = #22c55e }
new Line3D { name = "oc"; pos = (O, C); interact = false; thickness = 2.5; color = #22c55e }

new UI { name = "sL"; type = slider; label = "длина наклонной l = AB"; variable = l; min = 2; max = 3.5; step = 0.1; default = 3.5 }
new UI { name = "sPhi"; type = slider; label = "угол с плоскостью φ, °"; variable = phi; min = 15; max = 70; step = 1; default = 40 }
new UI { name = "sW"; type = slider; label = "направление проекции ω, °"; variable = om; min = 0; max = 360; step = 5; default = 0 }
new UI { name = "sD"; type = slider; label = "AC − AB"; variable = d; min = 0; max = 1; step = 0.05; default = 0.5 }

string info = "";
float l = 3.5; float phi = 40; float om = 0; float d = 0.5;

Update {
  float p = l * cos(radians(phi));
  float h = l * sin(radians(phi));
  float l2 = l + d;
  float p2 = sqrt(l2 * l2 - h * h);
  float w2 = radians(om + 140);
  A.pos.x = 0; A.pos.y = h; A.pos.z = 0;
  B.pos.x = p * cos(radians(om)); B.pos.y = 0; B.pos.z = p * sin(radians(om));
  C.pos.x = p2 * cos(w2); C.pos.y = 0; C.pos.z = p2 * sin(w2);

  info = "**Проекция наклонной на плоскость.** Отрезок OB, соединяющий основание перпендикуляра AO с основанием наклонной AB, — проекция AB на α. Угол между наклонной и плоскостью — это угол между AB и OB: ∠ABO = φ = " + format(phi, 0) + "°.\n\nИз прямоугольного треугольника AOB: OB = l cos φ = " + format(l, 1) + " · " + format(cos(radians(phi)), 3) + " = " + format(p, 2) + ", AO = l sin φ = " + format(h, 2) + " = OB · tg φ.\n\nВторая наклонная AC = " + format(l2, 2) + ", её проекция OC = " + format(p2, 2) + ".";
  if (d < 0.001) { info = info + " Наклонные равны — равны и проекции."; }
  else { info = info + " AC длиннее AB — и проекция OC длиннее OB."; }
}
]
