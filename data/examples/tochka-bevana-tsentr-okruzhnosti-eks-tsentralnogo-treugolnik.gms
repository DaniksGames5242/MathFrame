[
description = "{info}"

field width = 26;
field height = 18;
camera type = fixed;

new Point { name = "A"; pos = (-6, -3); text = true("A") }
new Point { name = "B"; pos = (6, -3.5); text = true("B") }
new Point { name = "C"; pos = (1, 4); text = true("C") }

new Line { name = "ab"; pos = (A, B); interact = false }
new Line { name = "bc"; pos = (B, C); interact = false }
new Line { name = "ca"; pos = (C, A); interact = false }
new Figure { name = "abc"; elements = (ab, bc, ca); interact = false }

// ---- Экс-центры: центры вневписанных окружностей ----
new Point { name = "Ia"; pos = (0, 0); dynamic = false; collision = false; text = true("I_a") }
new Point { name = "Ib"; pos = (0, 0); dynamic = false; collision = false; text = true("I_b") }
new Point { name = "Ic"; pos = (0, 0); dynamic = false; collision = false; text = true("I_c") }
new Line { name = "iab"; pos = (Ia, Ib); interact = false }
new Line { name = "ibc"; pos = (Ib, Ic); interact = false }
new Line { name = "ica"; pos = (Ic, Ia); interact = false }
draw Punctir { name = "eIab"; edge = "iab" }
draw Punctir { name = "eIbc"; edge = "ibc" }
draw Punctir { name = "eIca"; edge = "ica" }

new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
new Point { name = "I"; pos = (0, 0); dynamic = false; collision = false; text = true("I") }
new Point { name = "Be"; pos = (0, 0); dynamic = false; collision = false; color = #3b82f6; text = true("Be") }
new Curve { name = "excirc"; type = parametric; x = "bx + br * cos(6.2831853 * t)"; y = "by + br * sin(6.2831853 * t)"; color = #3b82f6 }

float bx = 0; float by = 0; float br = 1;
string info = "";
float ix = 0; float iy = 0;

Function interLL(p1x, p1y, d1x, d1y, p2x, p2y, d2x, d2y) {
  float den = d1x * d2y - d1y * d2x;
  if (abs(den) < 0.000001) { return 0; }
  float t = ((p2x - p1x) * d2y - (p2y - p1y) * d2x) / den;
  ix = p1x + t * d1x; iy = p1y + t * d1y;
  return 1;
}

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  float ax = A.pos.x; float ay = A.pos.y;
  float bcx = B.pos.x; float bcy = B.pos.y;
  float cx = C.pos.x; float cy = C.pos.y;

  float a = sqrt((bcx - cx) * (bcx - cx) + (bcy - cy) * (bcy - cy));
  float b = sqrt((cx - ax) * (cx - ax) + (cy - ay) * (cy - ay));
  float c = sqrt((ax - bcx) * (ax - bcx) + (ay - bcy) * (ay - bcy));
  float den1 = -a + b + c; float den2 = a - b + c; float den3 = a + b - c;
  if (den1 > 0.00001 && den2 > 0.00001 && den3 > 0.00001) {
    float iax = (-a * ax + b * bcx + c * cx) / den1; float iay = (-a * ay + b * bcy + c * cy) / den1;
    float ibx = (a * ax - b * bcx + c * cx) / den2; float iby = (a * ay - b * bcy + c * cy) / den2;
    float icx = (a * ax + b * bcx - c * cx) / den3; float icy = (a * ay + b * bcy - c * cy) / den3;
    Ia.pos.x = iax; Ia.pos.y = iay;
    Ib.pos.x = ibx; Ib.pos.y = iby;
    Ic.pos.x = icx; Ic.pos.y = icy;

    // Центр описанной окружности исходного треугольника.
    float ok2 = interLL((ax + bcx) / 2, (ay + bcy) / 2, -(bcy - ay), bcx - ax, (bcx + cx) / 2, (bcy + cy) / 2, -(cy - bcy), cx - bcx);
    float ox = ix; float oy = iy;
    O.pos.x = ox; O.pos.y = oy;

    float p = a + b + c;
    I.pos.x = (a * ax + b * bcx + c * cx) / p; I.pos.y = (a * ay + b * bcy + c * cy) / p;

    // Точка Бевана — центр окружности, описанной около экс-центрального треугольника
    // (пересечение серединных перпендикуляров к IaIb и к IbIc).
    float okB = interLL((iax + ibx) / 2, (iay + iby) / 2, -(iby - iay), ibx - iax, (ibx + icx) / 2, (iby + icy) / 2, -(icy - iby), icx - ibx);
    if (okB == 1) {
      bx = ix; by = iy;
      Be.pos.x = bx; Be.pos.y = by;
      br = sqrt((bx - iax) * (bx - iax) + (by - iay) * (by - iay));

      float obe = sqrt((ox - bx) * (ox - bx) + (oy - by) * (oy - by));
      float oi = sqrt((ox - I.pos.x) * (ox - I.pos.x) + (oy - I.pos.y) * (oy - I.pos.y));

      info = "**Be — точка Бевана**, центр окружности, описанной около экс-центрального треугольника I_aI_bI_c (вершины — центры вневписанных окружностей). Радиус этой окружности R' = " + format(br, 2) + ".\n\n**Связь с центром описанной окружности и инцентром.** OBe = " + format(obe, 2) + ", OI = " + format(oi, 2) + " — обе точки O и Be лежат на прямой Эйлера исходного треугольника.";
    }
  }
}
]
