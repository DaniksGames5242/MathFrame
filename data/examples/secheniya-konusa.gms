[
description = "{info}"

field width = 14; field height = 11; field depth = 14;
show grid = false; show axes = false;
camera start rot = (30, 66);
camera start zoom = 1.3;

float alpha = 30; float phi = 90; float cc = 2; float mk = 0; float k = 0.577; string info = ""; float HH = 4.5;

new Point3D { name = "S"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("S") }
new Point3D { name = "K"; pos = (0, 2, 0); dynamic = false; collision = false; text = true("K"); color = #f59e0b }
new Point3D { name = "U"; pos = (1, 2, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "W"; pos = (0, 2, 1); dynamic = false; collision = false; active = false }
new Curve3D { name = "rimU"; type = parametric; x = "k * HH * cos(2 * pi * t)"; y = "HH"; z = "k * HH * sin(2 * pi * t)"; segments = 96; thickness = 1 }
new Curve3D { name = "rimD"; type = parametric; x = "k * HH * cos(2 * pi * t)"; y = "-HH"; z = "k * HH * sin(2 * pi * t)"; segments = 96; thickness = 1 }
new Curve3D { name = "fanU"; type = parametric; x = "fp(t, 0, 1)"; y = "fp(t, 1, 1)"; z = "fp(t, 2, 1)"; segments = 128; thickness = 1 }
new Curve3D { name = "fanD"; type = parametric; x = "fp(t, 0, -1)"; y = "fp(t, 1, -1)"; z = "fp(t, 2, -1)"; segments = 128; thickness = 1 }
draw InfPlane { name = "pl"; points = (K, U, W); size = 4.5; opacity = 0.2; color = #f59e0b }
new Curve3D { name = "sec1"; type = parametric; x = "sx(t, 1, 0)"; y = "sx(t, 1, 1)"; z = "sx(t, 1, 2)"; segments = 160; color = #f59e0b; thickness = 5 }
new Curve3D { name = "sec2"; type = parametric; x = "sx(t, 2, 0)"; y = "sx(t, 2, 1)"; z = "sx(t, 2, 2)"; segments = 120; color = #f59e0b; thickness = 5; active = mk > 1 + cc / HH }

new UI { name = "s_a"; type = slider; label = "угол образующей с осью α, °"; variable = alpha; min = 20; max = 55; step = 1; default = 30 }
new UI { name = "s_p"; type = slider; label = "угол плоскости с осью φ, °"; variable = phi; min = 10; max = 90; step = 1; default = 60 }
new UI { name = "s_c"; type = slider; label = "расстояние плоскости от вершины"; variable = cc; min = 0.5; max = 3; step = 0.1; default = 2 }

Function fp(t, c, sg) {
  float u = t * 32; float j = floor(u + 0.000001); float f = u - j;
  if (f < 0) { f = 0; }
  float q = floor(j / 2); float a = 6.283185 * q / 16;
  float w = f; if (j - 2 * q > 0.5) { w = 1 - f; }
  if (c < 0.5) { return w * k * HH * cos(a); }
  if (c < 1.5) { return sg * w * HH; }
  return w * k * HH * sin(a);
}
// точка сечения: направление образующей (k cos θ, 1, k sin θ), плоскость y = m x + c
// ветвь 1 — верхняя полость, ветвь 2 — нижняя (у гиперболы)
Function sx(t, br, c) {
  float m = cos(radians(phi)) / sin(radians(phi));
  float mq = m * k;
  float th = 0;
  if (br < 1.5) {
    float rt = 1; if (mq > 0.000001) { rt = (1 - cc / HH) / mq; }
    float th0 = 0; if (rt < 1) { th0 = acos(max(rt, -1)); }
    th = th0 + (6.283185 - 2 * th0) * t;
  } else {
    float rt = 1; if (mq > 0.000001) { rt = (1 + cc / HH) / mq; }
    float th1 = 0; if (rt < 1) { th1 = acos(max(rt, -1)); }
    th = th1 * (2 * t - 1);
  }
  float lam = cc / (1 - mq * cos(th));
  if (c < 0.5) { return lam * k * cos(th); }
  if (c < 1.5) { return lam; }
  return lam * k * sin(th);
}

Update {
  k = tan(radians(alpha));
  float m = cos(radians(phi)) / sin(radians(phi));
  mk = m * k;
  float ln = sqrt(1 + m * m);
  K.pos.x = 0; K.pos.y = cc; K.pos.z = 0;
  U.pos.x = 1 / ln; U.pos.y = cc + m / ln; U.pos.z = 0;
  W.pos.x = 0; W.pos.y = cc; W.pos.z = 1;
  float e = cos(radians(phi)) / cos(radians(alpha));
  string name = "";
  if (phi > 89.5) { name = "окружность"; }
  else if (abs(phi - alpha) < 0.01) { name = "парабола"; }
  else if (phi > alpha) { name = "эллипс"; }
  else { name = "гипербола"; }
  info = "**Сечение конуса плоскостью, не проходящей через вершину** S. Угол образующих с осью α = " + format(alpha, 0) + "°, угол секущей плоскости с осью φ = " + format(phi, 0) + "°. Конус продолжен в обе стороны от вершины (две полости).\n\n";
  info = info + "Вид сечения зависит от сравнения φ и α: φ > α — эллипс (плоскость пересекает все образующие одной полости, при φ = 90° — окружность), φ = α — парабола (плоскость параллельна одной образующей), φ < α — гипербола (плоскость пересекает обе полости).\n\n";
  info = info + "Сейчас φ " + (phi > alpha + 0.01 ? "> " : (phi < alpha - 0.01 ? "< " : "= ")) + "α, получается **" + name + "**, эксцентриситет e = cos φ / cos α = " + format(e, 2) + ".";
}
]
