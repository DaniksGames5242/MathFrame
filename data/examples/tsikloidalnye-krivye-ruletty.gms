[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float mode = 1; float n = 2; float h = 1; float u = 0.5;
float rr = 1.6; float RR = 4; float dd = 1.6; float th = 0; float qq = 1; float gy = -3.5; float cx = 0; float cy = 0; float k1 = 1;
string info = "";
new Curve { name = "ground"; type = parametric; x = "-10 + 20 * t"; y = "gy"; segments = 2; thickness = 2; active = mode < 1.5 }
new Curve { name = "fixed"; type = parametric; x = "RR * cos(6.28318 * t)"; y = "RR * sin(6.28318 * t)"; segments = 120; thickness = 2; active = mode > 1.5 }
new Curve { name = "roll"; type = parametric; x = "cx + rr * cos(6.28318 * t)"; y = "cy + rr * sin(6.28318 * t)"; segments = 100; thickness = 1.5; layer = 12 }
new Curve { name = "c1"; type = parametric; x = "rr * (2 * t - 1) * 7.5 - dd * sin((2 * t - 1) * 7.5)"; y = "gy + rr - dd * cos((2 * t - 1) * 7.5)"; segments = 400; color = #3b82f6; thickness = 3; active = mode < 1.5 }
new Curve { name = "c2"; type = parametric; x = "(RR + rr) * cos(6.28318 * qq * t) - dd * cos((RR + rr) / rr * 6.28318 * qq * t)"; y = "(RR + rr) * sin(6.28318 * qq * t) - dd * sin((RR + rr) / rr * 6.28318 * qq * t)"; segments = 900; color = #3b82f6; thickness = 3; active = mode > 1.5 && mode < 2.5 }
new Curve { name = "c3"; type = parametric; x = "(RR - rr) * cos(6.28318 * qq * t) + dd * cos((RR - rr) / rr * 6.28318 * qq * t)"; y = "(RR - rr) * sin(6.28318 * qq * t) - dd * sin((RR - rr) / rr * 6.28318 * qq * t)"; segments = 900; color = #3b82f6; thickness = 3; active = mode > 2.5 }
new Point { name = "Cc"; pos = (0, 0); dynamic = false; collision = false; layer = 30 }
new Point { name = "M"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; text = true("M"); layer = 60 }
new Line { name = "cm"; pos = (Cc, M); color = #f59e0b; interact = false }
new UI { type = button; label = "По прямой"; action = "mode = 1" }
new UI { type = button; label = "Снаружи окружности"; action = "mode = 2" }
new UI { type = button; label = "Внутри окружности"; action = "mode = 3" }
new UI { type = slider; label = "d / r"; variable = h; min = 0.2; max = 2; step = 0.1; default = 1 }
new UI { type = slider; label = "R / r"; variable = n; min = 1.5; max = 8; step = 0.5; default = 2; active = mode > 1.5 }
new UI { type = slider; label = "поворот катящейся окружности"; variable = u; min = 0; max = 1; step = 0.005; default = 0.5 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  qq = 1;
  if (abs(n - round(n)) > 0.01) { qq = 2; }
  float pi2 = 6.28318;
  string nm = "";
  string eq = "";
  string ex = "";
  if (mode < 1.5) {
    rr = 1.6; dd = h * rr; th = -3.5 + 7 * u;
    cx = rr * th; cy = gy + rr;
    Cc.pos.x = cx; Cc.pos.y = cy;
    M.pos.x = rr * th - dd * sin(th); M.pos.y = gy + rr - dd * cos(th);
    nm = "трохоида (укороченная циклоида при d < r, удлинённая при d > r)";
    if (abs(h - 1) < 0.001) { nm = "циклоида"; }
    eq = "x = rθ − d·sin θ, y = r − d·cos θ";
    ex = "Окружность радиуса r = " + format(rr, 2) + " катится по прямой, d = " + format(dd, 2) + ", угол поворота θ = " + num(th, 2) + ".";
  }
  if (mode > 1.5) {
    RR = 5.5 / (1 + (1 + h) / n); rr = RR / n; dd = h * rr;
    th = u * pi2 * qq;
    if (mode < 2.5) {
      cx = (RR + rr) * cos(th); cy = (RR + rr) * sin(th);
      M.pos.x = cx - dd * cos((RR + rr) / rr * th); M.pos.y = cy - dd * sin((RR + rr) / rr * th);
      nm = "эпитрохоида";
      if (abs(h - 1) < 0.001) { nm = "эпициклоида"; }
      eq = "x = (R + r)cos φ − d·cos((R + r)φ/r), y = (R + r)sin φ − d·sin((R + r)φ/r)";
    } else {
      cx = (RR - rr) * cos(th); cy = (RR - rr) * sin(th);
      M.pos.x = cx + dd * cos((RR - rr) / rr * th); M.pos.y = cy - dd * sin((RR - rr) / rr * th);
      nm = "гипотрохоида";
      if (abs(h - 1) < 0.001) { nm = "гипоциклоида"; }
      eq = "x = (R − r)cos φ + d·cos((R − r)φ/r), y = (R − r)sin φ − d·sin((R − r)φ/r)";
    }
    Cc.pos.x = cx; Cc.pos.y = cy;
    ex = "Радиусы: R = " + format(RR, 2) + ", r = " + format(rr, 2) + " (R/r = " + format(n, 1) + "), d = " + format(dd, 2) + ", φ = " + format(th * 180 / 3.14159265, 0) + "°.";
    if (mode > 2.5 && abs(n - 2) < 0.01 && abs(h - 1) < 0.001) { ex = ex + " При R = 2r гипоциклоида вырождается в отрезок — диаметр неподвижной окружности."; }
    if (abs(n - round(n)) < 0.01) { ex = ex + " Кривая замкнута после одного оборота."; }
    else { ex = ex + " Кривая замыкается после двух оборотов."; }
  }
  info = "**Рулетта** — траектория точки M, жёстко связанной с окружностью, катящейся без проскальзывания. Здесь: **" + nm + "**.\n\n" + eq + ".\n\n" + ex;
}
]
