[
description = "{info}"

field width = 7;
field height = 7;
field depth = 7;
show grid = false;
show axes = true;
camera start rot = (35, 65);
camera start zoom = 1.9;

// ---- Элемент объёма в сферических координатах: r ∈ [r; r + dr], θ ∈ [θ; θ + dθ],
// φ ∈ [φ; φ + dφ]. Вертикальная ось сцены — ось z. Внешняя грань — кусок сферы радиуса r + dr. ----
draw Surface { name = "outer"; type = parametric; x = "sx(r + dr, th + dth * u, ph + dph * v)"; y = "sz(r + dr, th + dth * u, ph + dph * v)"; z = "sy(r + dr, th + dth * u, ph + dph * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 12; color = #3b82f6; opacity = 0.55 }
draw Surface { name = "inner"; type = parametric; x = "sx(r, th + dth * u, ph + dph * v)"; y = "sz(r, th + dth * u, ph + dph * v)"; z = "sy(r, th + dth * u, ph + dph * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 12; color = #3b82f6; opacity = 0.3 }
new Curve3D { name = "e0"; type = parametric; x = "ex(0, t)"; y = "ez(0, t)"; z = "ey(0, t)"; segments = 24; color = #22c55e; thickness = 3 }
new Curve3D { name = "e1"; type = parametric; x = "ex(1, t)"; y = "ez(1, t)"; z = "ey(1, t)"; segments = 24; color = #22c55e; thickness = 3 }
new Curve3D { name = "e2"; type = parametric; x = "ex(2, t)"; y = "ez(2, t)"; z = "ey(2, t)"; segments = 24; color = #22c55e; thickness = 3 }
new Curve3D { name = "e3"; type = parametric; x = "ex(3, t)"; y = "ez(3, t)"; z = "ey(3, t)"; segments = 24; color = #22c55e; thickness = 3 }
new Curve3D { name = "e4"; type = parametric; x = "ex(4, t)"; y = "ez(4, t)"; z = "ey(4, t)"; segments = 24; color = #f59e0b; thickness = 3 }
new Curve3D { name = "e5"; type = parametric; x = "ex(5, t)"; y = "ez(5, t)"; z = "ey(5, t)"; segments = 24; color = #f59e0b; thickness = 3 }
new Curve3D { name = "e6"; type = parametric; x = "ex(6, t)"; y = "ez(6, t)"; z = "ey(6, t)"; segments = 24; color = #f59e0b; thickness = 3 }
new Curve3D { name = "e7"; type = parametric; x = "ex(7, t)"; y = "ez(7, t)"; z = "ey(7, t)"; segments = 24; color = #f59e0b; thickness = 3 }
new Curve3D { name = "e8"; type = parametric; x = "ex(8, t)"; y = "ez(8, t)"; z = "ey(8, t)"; segments = 24; color = #ef4444; thickness = 3 }
new Curve3D { name = "e9"; type = parametric; x = "ex(9, t)"; y = "ez(9, t)"; z = "ey(9, t)"; segments = 24; color = #ef4444; thickness = 3 }
new Curve3D { name = "e10"; type = parametric; x = "ex(10, t)"; y = "ez(10, t)"; z = "ey(10, t)"; segments = 24; color = #ef4444; thickness = 3 }
new Curve3D { name = "e11"; type = parametric; x = "ex(11, t)"; y = "ez(11, t)"; z = "ey(11, t)"; segments = 24; color = #ef4444; thickness = 3 }
// направляющие: радиус OM, дуга меридиана от оси z и дуга параллели от плоскости φ = 0
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; size = 0.6 }
new Point3D { name = "M"; pos = (1, 1, 1); dynamic = false; text = true("M"); color = #f59e0b }
new Line3D { name = "om"; pos = (O, M); color = #6b7280; thickness = 1.5 }
new Curve3D { name = "mer"; type = parametric; x = "sx(r, th * t, ph)"; y = "sz(r, th * t, ph)"; z = "sy(r, th * t, ph)"; segments = 40; color = #6b7280; thickness = 1 }
new Curve3D { name = "par"; type = parametric; x = "sx(r, th, ph * t)"; y = "sz(r, th, ph * t)"; z = "sy(r, th, ph * t)"; segments = 40; color = #6b7280; thickness = 1 }
draw Text { name = "tr"; pos = (lx(0), lz(0), ly(0)); text = "dr"; color = #22c55e; size = 1.2 }
draw Text { name = "tt"; pos = (lx(1), lz(1), ly(1)); text = "r·dθ"; color = #f59e0b; size = 1.2 }
draw Text { name = "tp"; pos = (lx(2), lz(2), ly(2)); text = "r·sinθ·dφ"; color = #ef4444; size = 1.2 }

new UI { name = "sR"; type = slider; label = "r"; variable = r; min = 0.5; max = 2.4; step = 0.05; default = 1.8 }
new UI { name = "sT"; type = slider; label = "θ°"; variable = thd; min = 5; max = 150; step = 1; default = 55 }
new UI { name = "sP"; type = slider; label = "φ°"; variable = phd; min = 0; max = 330; step = 1; default = 30 }
new UI { name = "sD"; type = slider; label = "размер элемента"; variable = k; min = 0.1; max = 1; step = 0.05; default = 0.8 }

// ---- Логика ----
float r = 1.8; float thd = 55; float phd = 30; float k = 0.8;
float th = 1; float ph = 0.5; float dr = 0.5; float dth = 0.4; float dph = 0.5;
string info = "";

// Декартовы координаты точки (r, θ, φ); на сцене вертикальная ось — z
Function sx(rr, t, p) { return rr * sin(t) * cos(p); }
Function sy(rr, t, p) { return rr * sin(t) * sin(p); }
Function sz(rr, t, p) { return rr * cos(t); }
// Рёбра элемента: 0–3 — вдоль r (зелёные), 4–7 — вдоль θ (оранжевые), 8–11 — вдоль φ (красные)
Function er(q, t) { float b = q; if (b < 4) { return r + dr * t; } b = b - 4 * floor(b / 4); if (b < 2) { return r; } return r + dr; }
Function et(q, t) { if (q >= 4 && q < 8) { return th + dth * t; } float b = q - 4 * floor(q / 4); if (q < 4) { if (b < 2) { return th; } return th + dth; } if (b == 0 || b == 2) { return th; } return th + dth; }
Function ep(q, t) { if (q >= 8) { return ph + dph * t; } float b = q - 4 * floor(q / 4); if (q < 4) { if (b == 0 || b == 2) { return ph; } return ph + dph; } if (b == 0 || b == 2) { return ph; } return ph + dph; }
Function ex(q, t) { return sx(er(q, t), et(q, t), ep(q, t)); }
Function ey(q, t) { return sy(er(q, t), et(q, t), ep(q, t)); }
Function ez(q, t) { return sz(er(q, t), et(q, t), ep(q, t)); }
// Места подписей — середины рёбер 0, 4 и 8, чуть вынесенные наружу
Function lx(q) { float e = q * 4; return 1.15 * ex(e, 0.5); }
Function ly(q) { float e = q * 4; return 1.15 * ey(e, 0.5); }
Function lz(q) { float e = q * 4; return 1.15 * ez(e, 0.5); }

Update {
  th = radians(thd); ph = radians(phd);
  dr = 0.8 * k; dth = radians(32) * k; dph = radians(45) * k;
  M.pos.x = sx(r, th, ph); M.pos.y = sz(r, th, ph); M.pos.z = sy(r, th, ph);
  // Точный объём элемента и его приближение r²·sinθ·dr·dθ·dφ
  float Vex = ((r + dr) ^ 3 - r ^ 3) / 3 * (cos(th) - cos(th + dth)) * dph;
  float Vap = r * r * sin(th) * dr * dth * dph;

  info = "**Сферические координаты в тройном интеграле:** точка задаётся расстоянием r до начала координат, углом θ от оси z и углом φ в плоскости xy: x = r·sinθ·cosφ, y = r·sinθ·sinφ, z = r·cosθ. Элемент объёма — «кубик», ограниченный двумя сферами, двумя конусами и двумя полуплоскостями; его рёбра примерно равны dr, r·dθ и r·sinθ·dφ, поэтому

dV = r²·sinθ dr dθ dφ,   ∭ f dV = ∭ f(r sinθ cosφ, r sinθ sinφ, r cosθ)·r² sinθ dr dθ dφ.

r = " + format(r, 2) + ", θ = " + format(thd, 0) + "°, φ = " + format(phd, 0) + "°:   точный объём элемента " + format(Vex, 4) + ", приближение r²·sinθ·dr·dθ·dφ = " + format(Vap, 4) + " (относительная ошибка " + format(100 * abs(Vap - Vex) / Vex, 1) + "%). Уменьшите размер элемента — ошибка стремится к нулю.

Сцену можно вращать мышью.";
}
]
