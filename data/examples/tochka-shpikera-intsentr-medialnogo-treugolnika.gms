[
description = "{info}"

field width = 20;
field height = 14;
camera type = fixed;

new Point { name = "A"; pos = (-7, -4); text = true("A") }
new Point { name = "B"; pos = (7, -4.5); text = true("B") }
new Point { name = "C"; pos = (1, 5); text = true("C") }

new Line { name = "ab"; pos = (A, B); interact = false }
new Line { name = "bc"; pos = (B, C); interact = false }
new Line { name = "ca"; pos = (C, A); interact = false }
new Figure { name = "abc"; elements = (ab, bc, ca); interact = false }

// ---- Медиальный треугольник — середины сторон ----
new Point { name = "Ma"; pos = (0, 0); dynamic = false; collision = false; text = true("Ma") }
new Point { name = "Mb"; pos = (0, 0); dynamic = false; collision = false; text = true("Mb") }
new Point { name = "Mc"; pos = (0, 0); dynamic = false; collision = false; text = true("Mc") }
new Line { name = "mab"; pos = (Ma, Mb); interact = false }
new Line { name = "mbc"; pos = (Mb, Mc); interact = false }
new Line { name = "mca"; pos = (Mc, Ma); interact = false }
draw Punctir { name = "eMab"; edge = "mab" }
draw Punctir { name = "eMbc"; edge = "mbc" }
draw Punctir { name = "eMca"; edge = "mca" }

new Point { name = "G"; pos = (0, 0); dynamic = false; collision = false; text = true("G") }
new Point { name = "I"; pos = (0, 0); dynamic = false; collision = false; text = true("I") }
new Point { name = "S"; pos = (0, 0); dynamic = false; collision = false; color = #3b82f6; text = true("S") }
new Line { name = "gis"; pos = (I, S); interact = false; active = false }
draw Punctir { name = "gisLine"; edge = "gis" }

// Вписанная окружность медиального треугольника — центр S, радиус r/2.
new Curve { name = "inc9"; type = parametric; x = "sx + sr * cos(6.2831853 * t)"; y = "sy + sr * sin(6.2831853 * t)"; color = #3b82f6 }

float sx = 0; float sy = 0; float sr = 1;
string info = "";

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  float ax = A.pos.x; float ay = A.pos.y;
  float bx = B.pos.x; float by = B.pos.y;
  float cx = C.pos.x; float cy = C.pos.y;

  float a = sqrt((bx - cx) * (bx - cx) + (by - cy) * (by - cy)); // BC
  float b = sqrt((cx - ax) * (cx - ax) + (cy - ay) * (cy - ay)); // CA
  float c = sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by)); // AB
  float p = a + b + c;
  if (p > 0.00001) {
    float mabx = (bx + cx) / 2; float maby = (by + cy) / 2;
    float mbbx = (cx + ax) / 2; float mbby = (cy + ay) / 2;
    float mcbx = (ax + bx) / 2; float mcby = (ay + by) / 2;
    Ma.pos.x = mabx; Ma.pos.y = maby;
    Mb.pos.x = mbbx; Mb.pos.y = mbby;
    Mc.pos.x = mcbx; Mc.pos.y = mcby;

    G.pos.x = (ax + bx + cx) / 3; G.pos.y = (ay + by + cy) / 3;
    I.pos.x = (a * ax + b * bx + c * cx) / p; I.pos.y = (a * ay + b * by + c * cy) / p;
    sx = (a * mabx + b * mbbx + c * mcbx) / p; sy = (a * maby + b * mbby + c * mcby) / p;
    S.pos.x = sx; S.pos.y = sy;

    // Площадь по формуле Герона и вписанный радиус исходного треугольника.
    float sp = p / 2;
    float area = sqrt(max(0, sp * (sp - a) * (sp - b) * (sp - c)));
    float r = area / sp;
    sr = r / 2;

    float gi = sqrt((G.pos.x - I.pos.x) * (G.pos.x - I.pos.x) + (G.pos.y - I.pos.y) * (G.pos.y - I.pos.y));
    float gs = sqrt((G.pos.x - sx) * (G.pos.x - sx) + (G.pos.y - sy) * (G.pos.y - sy));

    info = "**S — точка Шпикера**, центр вписанной окружности медиального треугольника MaMbMc (вершины — середины сторон). Радиус этой окружности r/2 = " + format(sr, 2) + " — вдвое меньше радиуса вписанной окружности r = " + format(r, 2) + " исходного треугольника.\n\n**Гомотетия с центром G.** Медиальный треугольник гомотетичен исходному относительно центроида G с коэффициентом −1/2, поэтому S — образ инцентра I: GS = " + format(gs, 2) + " = ½ · GI = ½ · " + format(gi, 2) + " = " + format(gi / 2, 2) + ", а G лежит между I и S на одной прямой.";
  }
}
]
