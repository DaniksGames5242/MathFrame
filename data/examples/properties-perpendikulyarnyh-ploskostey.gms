[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (35, 60);
camera start zoom = 1.15;

// Три попарно перпендикулярные плоскости: α (z = 0, синяя), β (y = 0, жёлтая), γ (x = 0) — до поворота.
// Их линии пересечения — оси x = α∩β, y = α∩γ, z = β∩γ. Прямая m лежит в α, M ∈ m;
// MH ⟂ β и MG ⟂ γ — перпендикуляры, лежащие в α. Вся конструкция поворачивается ползунками.
new Point3D { name = "A0"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "A1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "A2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "B0"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "B1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "B2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "C0"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "C1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "C2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "XA"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "XB"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "YA"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "YB"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "ZA"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "ZB"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "T"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("O") }
new Point3D { name = "M"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("M") }
new Point3D { name = "H"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("H") }
new Point3D { name = "G"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("G") }

draw InfPlane { name = "alpha"; points = (A0, A1, A2); size = 3; opacity = 0.2; color = #3b82f6 }
draw InfPlane { name = "beta"; points = (B0, B1, B2); size = 3; opacity = 0.2; color = #f59e0b }
draw InfPlane { name = "gamma"; points = (C0, C1, C2); size = 3; opacity = 0.14 }
new Line3D { name = "ax"; pos = (XA, XB); interact = false; thickness = 3 }
new Line3D { name = "ay"; pos = (YA, YB); interact = false; thickness = 3 }
new Line3D { name = "az"; pos = (ZA, ZB); interact = false; thickness = 3 }
new Line3D { name = "lm"; pos = (O, T); interact = false; thickness = 4; color = #22c55e }
new Line3D { name = "lmh"; pos = (M, H); interact = false; thickness = 2.5; color = #f59e0b }
new Line3D { name = "lmg"; pos = (M, G); interact = false; thickness = 2.5 }

new UI { name = "sW"; type = slider; label = "угол ω прямой m с осью x, °"; variable = om; min = 5; max = 85; step = 1; default = 35 }
new UI { name = "sR"; type = slider; label = "расстояние OM"; variable = rr; min = 0.8; max = 3.2; step = 0.1; default = 2.4 }
new UI { name = "sPsi"; type = slider; label = "поворот вокруг вертикали, °"; variable = psi; min = 0; max = 360; step = 1; default = 30 }
new UI { name = "sTau"; type = slider; label = "наклон конструкции, °"; variable = tau; min = -60; max = 60; step = 1; default = 20 }

string info = "";
float om = 35; float rr = 2.4; float psi = 30; float tau = 20;
float rt = 0; float rp = 0;

// Поворот: сначала вокруг оси z на τ, затем вокруг вертикали y на ψ.
Function gx(x, y, z) { return cos(rp) * (cos(rt) * x - sin(rt) * y) + sin(rp) * z; }
Function gy(x, y, z) { return sin(rt) * x + cos(rt) * y; }
Function gz(x, y, z) { return -sin(rp) * (cos(rt) * x - sin(rt) * y) + cos(rp) * z; }

Update {
  rt = radians(tau); rp = radians(psi);
  float w = radians(om); float c = cos(w); float s = sin(w);
  A0.pos.x = gx(1, -1, 0); A0.pos.y = gy(1, -1, 0); A0.pos.z = gz(1, -1, 0);
  A1.pos.x = gx(-1, -1, 0); A1.pos.y = gy(-1, -1, 0); A1.pos.z = gz(-1, -1, 0);
  A2.pos.x = gx(0, 2, 0); A2.pos.y = gy(0, 2, 0); A2.pos.z = gz(0, 2, 0);
  B0.pos.x = gx(1, 0, -1); B0.pos.y = gy(1, 0, -1); B0.pos.z = gz(1, 0, -1);
  B1.pos.x = gx(-1, 0, -1); B1.pos.y = gy(-1, 0, -1); B1.pos.z = gz(-1, 0, -1);
  B2.pos.x = gx(0, 0, 2); B2.pos.y = gy(0, 0, 2); B2.pos.z = gz(0, 0, 2);
  C0.pos.x = gx(0, 1, -1); C0.pos.y = gy(0, 1, -1); C0.pos.z = gz(0, 1, -1);
  C1.pos.x = gx(0, -1, -1); C1.pos.y = gy(0, -1, -1); C1.pos.z = gz(0, -1, -1);
  C2.pos.x = gx(0, 0, 2); C2.pos.y = gy(0, 0, 2); C2.pos.z = gz(0, 0, 2);
  XA.pos.x = gx(-3, 0, 0); XA.pos.y = gy(-3, 0, 0); XA.pos.z = gz(-3, 0, 0);
  XB.pos.x = gx(3, 0, 0); XB.pos.y = gy(3, 0, 0); XB.pos.z = gz(3, 0, 0);
  YA.pos.x = gx(0, -3, 0); YA.pos.y = gy(0, -3, 0); YA.pos.z = gz(0, -3, 0);
  YB.pos.x = gx(0, 3, 0); YB.pos.y = gy(0, 3, 0); YB.pos.z = gz(0, 3, 0);
  ZA.pos.x = gx(0, 0, -3); ZA.pos.y = gy(0, 0, -3); ZA.pos.z = gz(0, 0, -3);
  ZB.pos.x = gx(0, 0, 3); ZB.pos.y = gy(0, 0, 3); ZB.pos.z = gz(0, 0, 3);
  T.pos.x = gx(3.4 * c, 3.4 * s, 0); T.pos.y = gy(3.4 * c, 3.4 * s, 0); T.pos.z = gz(3.4 * c, 3.4 * s, 0);
  M.pos.x = gx(rr * c, rr * s, 0); M.pos.y = gy(rr * c, rr * s, 0); M.pos.z = gz(rr * c, rr * s, 0);
  H.pos.x = gx(rr * c, 0, 0); H.pos.y = gy(rr * c, 0, 0); H.pos.z = gz(rr * c, 0, 0);
  G.pos.x = gx(0, rr * s, 0); G.pos.y = gy(0, rr * s, 0); G.pos.z = gz(0, rr * s, 0);

  info = "**Свойства перпендикулярных плоскостей.** Плоскости α, β, γ попарно перпендикулярны, их линии пересечения (оси) тоже попарно перпендикулярны и задают систему координат. Плоскость γ перпендикулярна α и β, поэтому перпендикулярна и их линии пересечения — оси x.\n\nПрямая m лежит в α. Перпендикуляры из M ∈ m к плоскостям β и γ лежат в α и падают на линии пересечения: MH ⟂ β, MG ⟂ γ, где |MH| = OM·sin ω = **" + format(rr * s, 2) + "**, |MG| = OM·cos ω = **" + format(rr * c, 2) + "**.\n\nПроекция m на β — линия пересечения α ∩ β, поэтому угол между m и β равен ω = **" + format(om, 0) + "°**, а с γ — **" + format(90 - om, 0) + "°** (в сумме прямой угол).";
}
]
