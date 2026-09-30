[
description = "{info}"

field width = 20;
field height = 16;
camera type = fixed;

// ---- Замена плоскостей: чертёж отрезка AB на V и H (ось x) и новая плоскость V₁ ⟂ H с осью x₁.
// Точка Q задаёт направление x₁. A₁ отстоит от x₁ на столько же, на сколько A″ от x. ----
new Point { name = "O0"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Circle { name = "cq"; center = O0; radius = 7; active = false }
draw Graph { name = "gAx"; graph = "gx"; edgeColor = #3b82f688; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gX1"; graph = "gx1"; edgeColor = #22c55e; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Text { name = "tX"; pos = (9.3, 0.5); text = "x"; size = 1 }

new Point { name = "Q"; circle = "cq"; t = 0.93; text = true("x₁"); color = #22c55e; pauseOnDrag = false; collideWithPoints = false }
new Point { name = "Af"; pos = (-3.5, 3); text = true("A″"); color = #3b82f6; pauseOnDrag = false; collideWithPoints = false }
new Point { name = "Bf"; pos = (2.5, 1.2); text = true("B″"); color = #3b82f6; pauseOnDrag = false; collideWithPoints = false }
new Point { name = "Ah"; pos = (-3.5, -1.5); text = true("A′"); color = #f59e0b; pauseOnDrag = false; collideWithPoints = false }
new Point { name = "Bh"; pos = (2.5, -3); text = true("B′"); color = #f59e0b; pauseOnDrag = false; collideWithPoints = false }
new Point { name = "A1"; pos = (0, 3); text = true("A₁"); color = #22c55e; dynamic = false; collision = false }
new Point { name = "B1"; pos = (1, 3); text = true("B₁"); color = #22c55e; dynamic = false; collision = false }
new Line { name = "abf"; pos = (Af, Bf); color = #3b82f6; interact = false }
new Line { name = "abh"; pos = (Ah, Bh); color = #f59e0b; interact = false }
new Line { name = "ab1"; pos = (A1, B1); color = #22c55e; interact = false }
new Line { name = "lA"; pos = (Af, Ah); active = false; interact = false }
new Line { name = "lB"; pos = (Bf, Bh); active = false; interact = false }
new Line { name = "mA"; pos = (Ah, A1); active = false; interact = false }
new Line { name = "mB"; pos = (Bh, B1); active = false; interact = false }
draw Punctir { name = "pA"; edge = "lA" }
draw Punctir { name = "pB"; edge = "lB" }
draw Punctir { name = "pA1"; edge = "mA" }
draw Punctir { name = "pB1"; edge = "mB" }

string info = "";
float built = 0;
float pax = 0; float pay = 0; float paz = 0; float pbx = 0; float pby = 0; float pbz = 0;
float lastPhi = 999;

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function cl(x, a, b) { return max(a, min(b, x)); }

Start {
  pax = Af.pos.x; paz = Af.pos.y; pay = -Ah.pos.y; pbx = Bf.pos.x; pbz = Bf.pos.y; pby = -Bh.pos.y;
}

Update {
  if (built < 1) {
    gx = newGraph(); addNode(gx, "p", [-9.6, 0]); addNode(gx, "q", [9.6, 0]); addEdge(gx, "p", "q");
    built = 1;
  }
  float lim = min(5.5, fieldMaxX);
  float mA = abs(Af.pos.x - pax) + abs(Af.pos.y - paz) + abs(Ah.pos.x - pax) + abs(Ah.pos.y + pay);
  float mB = abs(Bf.pos.x - pbx) + abs(Bf.pos.y - pbz) + abs(Bh.pos.x - pbx) + abs(Bh.pos.y + pby);
  float ax = Af.pos.x; if (abs(Ah.pos.x - pax) > abs(Af.pos.x - pax)) { ax = Ah.pos.x; }
  float bx = Bf.pos.x; if (abs(Bh.pos.x - pbx) > abs(Bf.pos.x - pbx)) { bx = Bh.pos.x; }
  ax = cl(ax, -lim, lim); bx = cl(bx, -lim, lim);
  float az = cl(Af.pos.y, 0, 3.5); float ay = cl(-Ah.pos.y, 0, 3.5);
  float bz = cl(Bf.pos.y, 0, 3.5); float by = cl(-Bh.pos.y, 0, 3.5);
  if (sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay) + (bz - az) * (bz - az)) < 0.6) {
    ax = pax; ay = pay; az = paz; bx = pbx; by = pby; bz = pbz;
  }
  if (abs(Af.pos.x - ax) + abs(Af.pos.y - az) + abs(Ah.pos.x - ax) + abs(Ah.pos.y + ay) > 0.000001) { Af.pos.x = ax; Af.pos.y = az; Ah.pos.x = ax; Ah.pos.y = -ay; }
  if (abs(Bf.pos.x - bx) + abs(Bf.pos.y - bz) + abs(Bh.pos.x - bx) + abs(Bh.pos.y + by) > 0.000001) { Bf.pos.x = bx; Bf.pos.y = bz; Bh.pos.x = bx; Bh.pos.y = -by; }
  pax = ax; pay = ay; paz = az; pbx = bx; pby = by; pbz = bz;

  // Направление оси x₁; прилипание к x₁ ∥ A′B′ и x₁ ⟂ A′B′.
  float qx = Q.pos.x; float qy = Q.pos.y;
  float qr = sqrt(qx * qx + qy * qy);
  float ux = qx / qr; float uy = qy / qr;
  float dx = bx - ax; float dy = by - ay; float dz = bz - az;
  float lh = sqrt(dx * dx + dy * dy);
  float snap = 0;
  if (lh > 0.4) {
    float hx = dx / lh; float hy = -dy / lh;
    float cr = ux * hy - uy * hx; float dt = ux * hx + uy * hy;
    if (abs(cr) < 0.05) { if (dt < 0) { hx = -hx; hy = -hy; } ux = hx; uy = hy; snap = 1; }
    else if (abs(dt) < 0.05) { float px = -hy; float py = hx; if (ux * px + uy * py < 0) { px = -px; py = -py; } ux = px; uy = py; snap = 2; }
    if (snap > 0) { Q.pos.x = 7 * ux; Q.pos.y = 7 * uy; }
  }
  // x₁ проходит через O; A′ = (ax, −ay), B′ = (bx, −by); n — нормаль к x₁ (сторона V₁).
  float nx = -uy; float ny = ux;
  float sa = ax * ux + (-ay) * uy; float sb = bx * ux + (-by) * uy;
  A1.pos.x = sa * ux + az * nx; A1.pos.y = sa * uy + az * ny;
  B1.pos.x = sb * ux + bz * nx; B1.pos.y = sb * uy + bz * ny;
  float phi = degrees(atan2(uy, ux));
  if (abs(phi - lastPhi) > 0.0001) {
    gx1 = newGraph(); addNode(gx1, "p", [-9.6 * ux, -9.6 * uy]); addNode(gx1, "q", [9.6 * ux, 9.6 * uy]); addEdge(gx1, "p", "q");
    lastPhi = phi;
  }

  float l = sqrt(dx * dx + dy * dy + dz * dz);
  float l1 = sqrt((sb - sa) * (sb - sa) + dz * dz);
  float al = degrees(asin(min(1, abs(dz) / l)));
  info = "**Замена плоскостей проекций.** Плоскость V заменена новой V₁ ⟂ H; ось x₁ = H ∩ V₁ повёрнута на " + format(abs(phi), 0) + "° к оси x. Положение AB в пространстве не меняется.\n\n**Построение:** из A′ и B′ проводят линии связи ⟂ x₁ и откладывают на них расстояния до x₁, равные расстояниям A″ и B″ до x: A₁ — " + format(az, 2) + ", B₁ — " + format(bz, 2) + ". Высоты z над H сохраняются.\n\nИстинная длина AB = " + format(l, 2) + ", проекция A₁B₁ = " + format(l1, 2) + ".\n\n";
  if (snap == 1) { info = info + "**x₁ ∥ A′B′:** AB становится параллельной V₁ (частное положение), поэтому A₁B₁ = AB = " + format(l1, 2) + " — истинная длина, а угол A₁B₁ с x₁ равен углу α = " + format(al, 0) + "° наклона AB к H."; }
  else if (snap == 2 && abs(dz) < 0.05) { info = info + "**x₁ ⟂ A′B′ и AB ∥ H:** AB становится перпендикулярной V₁, и A₁ совпадает с B₁."; }
  else if (snap == 2) { info = info + "**x₁ ⟂ A′B′:** A₁ и B₁ лежат на одной линии связи, A₁B₁ ⟂ x₁, а её длина равна разности высот = " + format(abs(dz), 2) + "."; }
  else { info = info + "**Общее положение относительно V₁:** A₁B₁ короче AB. Чтобы получить натуральную величину, ось x₁ направляют параллельно A′B′."; }
}
]
