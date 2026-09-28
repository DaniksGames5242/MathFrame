[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (25, 62);
camera start zoom = 1.1;

// AO — перпендикуляр к плоскости α, AB — наклонная, OB — её проекция. Прямая l лежит в α и
// проходит через O; l′ — прямая через B, параллельная l. Ползунки: высота h, длина проекции p,
// направление проекции ω и направление прямой l (λ).
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("O") }
new Point3D { name = "A"; pos = (0, 2.5, 0); dynamic = false; collision = false; text = true("A") }
new Point3D { name = "B"; pos = (2.5, 0, 0); dynamic = false; collision = false; text = true("B") }
new Point3D { name = "L1"; pos = (3, 0, 0); dynamic = false; collision = false; text = true("l") }
new Point3D { name = "L2"; pos = (-3, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "K1"; pos = (3, 0, 0); dynamic = false; collision = false; text = true("l′") }
new Point3D { name = "K2"; pos = (-3, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "Pu"; pos = (1, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "Pv"; pos = (0, 0, 1); dynamic = false; collision = false; active = false }

draw InfPlane { name = "planeA"; points = (O, Pu, Pv); size = 3.8; opacity = 0.22; color = #3b82f6 }
new Line3D { name = "ao"; pos = (A, O); interact = false; thickness = 2.5 }
new Line3D { name = "ab"; pos = (A, B); interact = false; thickness = 3.5; color = #f59e0b }
new Line3D { name = "ob"; pos = (O, B); interact = false; thickness = 3.5; color = #3b82f6 }
new Line3D { name = "ll"; pos = (L2, L1); interact = false; thickness = 3; color = #22c55e }
new Line3D { name = "lk"; pos = (K2, K1); interact = false; thickness = 2; color = #22c55e }

new UI { name = "sH"; type = slider; label = "высота h = AO"; variable = h; min = 1; max = 4; step = 0.1; default = 2.5 }
new UI { name = "sP"; type = slider; label = "проекция p = OB"; variable = p; min = 1; max = 2.8; step = 0.1; default = 2.5 }
new UI { name = "sW"; type = slider; label = "направление OB, °"; variable = om; min = 0; max = 360; step = 5; default = 20 }
new UI { name = "sLam"; type = slider; label = "направление l, °"; variable = lam; min = 0; max = 180; step = 1; default = 110 }

string info = "";
float h = 2.5; float p = 2.5; float om = 20; float lam = 110;

Update {
  float cw = cos(radians(om)); float sw = sin(radians(om));
  float cl = cos(radians(lam)); float sl = sin(radians(lam));
  A.pos.x = 0; A.pos.y = h; A.pos.z = 0;
  B.pos.x = p * cw; B.pos.y = 0; B.pos.z = p * sw;
  L1.pos.x = 3.4 * cl; L1.pos.y = 0; L1.pos.z = 3.4 * sl;
  L2.pos.x = -3.4 * cl; L2.pos.y = 0; L2.pos.z = -3.4 * sl;
  K1.pos.x = B.pos.x + 1.6 * cl; K1.pos.y = 0; K1.pos.z = B.pos.z + 1.6 * sl;
  K2.pos.x = B.pos.x - 1.6 * cl; K2.pos.y = 0; K2.pos.z = B.pos.z - 1.6 * sl;

  // Углы между прямыми: с проекцией OB и с наклонной AB (через направляющие векторы).
  float c1 = abs(cl * cw + sl * sw);
  if (c1 > 1) { c1 = 1; }
  float ang1 = acos(c1) * 57.29578;
  float abx = B.pos.x; float aby = -h; float abz = B.pos.z;
  float abl = sqrt(abx * abx + aby * aby + abz * abz);
  float c2 = abs(cl * abx + sl * abz) / abl;
  if (c2 > 1) { c2 = 1; }
  float ang2 = acos(c2) * 57.29578;

  info = "**Теорема о трёх перпендикулярах.** Пусть AO ⊥ α, AB — наклонная, OB — её проекция на α, а l — прямая плоскости α через O. Тогда l ⊥ OB тогда и только тогда, когда l ⊥ AB.\n\nУгол между l и проекцией OB — " + format(ang1, 1) + "°, между l и наклонной AB — " + format(ang2, 1) + "°.";
  if (abs(ang1 - 90) < 0.05) { info = info + " **l ⊥ OB, и одновременно l ⊥ AB.**"; }
  else { info = info + " l не перпендикулярна OB — и не перпендикулярна AB."; }
}
]
