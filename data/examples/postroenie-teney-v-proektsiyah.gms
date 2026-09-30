[
description = "{info}"

field width = 24;
field height = 16;
camera type = fixed;

// ---- Эпюр Монжа: отрезок AB (по две проекции у каждого конца) и параллельные лучи света
// l = (1; −1; −1): обе проекции луча идут под 45° к оси x. Тень падает на V или на H —
// туда, куда луч попадает раньше; тень отрезка — ломаная через точку излома на оси x. ----
draw Graph { name = "gAx"; graph = "gx"; edgeColor = #3b82f6; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gSh"; graph = "gs"; edgeColor = #22c55e; edgeWidth = 4; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 2 }
draw Text { name = "tX"; pos = (11, 0.5); text = "x"; size = 1 }
draw Text { name = "tV"; pos = (-11, 6.5); text = "V"; size = 1 }
draw Text { name = "tH"; pos = (-11, -6.5); text = "H"; size = 1 }

new Point { name = "Af"; pos = (-6, 4.5); text = true("A″"); color = #3b82f6; pauseOnDrag = false; collideWithPoints = false }
new Point { name = "Bf"; pos = (0.5, 1.5); text = true("B″"); color = #3b82f6; pauseOnDrag = false; collideWithPoints = false }
new Point { name = "Ah"; pos = (-6, -1.5); text = true("A′"); color = #f59e0b; pauseOnDrag = false; collideWithPoints = false }
new Point { name = "Bh"; pos = (0.5, -4.5); text = true("B′"); color = #f59e0b; pauseOnDrag = false; collideWithPoints = false }
new Line { name = "abf"; pos = (Af, Bf); color = #3b82f6; interact = false }
new Line { name = "abh"; pos = (Ah, Bh); color = #f59e0b; interact = false }
new Point { name = "SAv"; pos = (0, 0); text = true("A₀″"); dynamic = false; collision = false; color = #22c55e }
new Point { name = "SAh"; pos = (0, 0); text = true("A₀′"); dynamic = false; collision = false; color = #22c55e }
new Point { name = "SBv"; pos = (0, 0); text = true("B₀″"); dynamic = false; collision = false; color = #22c55e }
new Point { name = "SBh"; pos = (0, 0); text = true("B₀′"); dynamic = false; collision = false; color = #22c55e }
new Point { name = "Mk"; pos = (0, 0); text = true("K"); dynamic = false; collision = false; color = #22c55e; active = act > 0.5 }
new Line { name = "lA"; pos = (Af, Ah); active = false; interact = false }
new Line { name = "lB"; pos = (Bf, Bh); active = false; interact = false }
new Line { name = "rAv"; pos = (Af, SAv); active = false; interact = false }
new Line { name = "rAh"; pos = (Ah, SAh); active = false; interact = false }
new Line { name = "rBv"; pos = (Bf, SBv); active = false; interact = false }
new Line { name = "rBh"; pos = (Bh, SBh); active = false; interact = false }
draw Punctir { name = "pA"; edge = "lA"; layer = 1 }
draw Punctir { name = "pB"; edge = "lB"; layer = 1 }
draw Punctir { name = "qAv"; edge = "rAv"; layer = 1 }
draw Punctir { name = "qAh"; edge = "rAh"; layer = 1 }
draw Punctir { name = "qBv"; edge = "rBv"; layer = 1 }
draw Punctir { name = "qBh"; edge = "rBh"; layer = 1 }

string info = "";
float built = 0; float act = 0; float key = -1;
float pax = 0; float pay = 0; float paz = 0; float pbx = 0; float pby = 0; float pbz = 0;
float ax = 0; float ay = 0; float az = 0; float bx = 0; float by = 0; float bz = 0;

Function cl(x, a, b) { return max(a, min(b, x)); }
Function sX(x, y, z) { if (y < z) { return x + y; } return x + z; }
Function sY(x, y, z) { if (y < z) { return 0; } return y - z; }
Function sZ(x, y, z) { if (y < z) { return z - y; } return 0; }
Function pl(y, z) { if (y < z) { return "V"; } return "H"; }

Start {
  pax = Af.pos.x; paz = Af.pos.y; pay = -Ah.pos.y; pbx = Bf.pos.x; pbz = Bf.pos.y; pby = -Bh.pos.y;
}

Update {
  if (built < 1) {
    gx = newGraph(); addNode(gx, "p", [-11.4, 0]); addNode(gx, "q", [11.4, 0]); addEdge(gx, "p", "q");
    built = 1;
  }
  float mA = abs(Af.pos.x - pax) + abs(Af.pos.y - paz) + abs(Ah.pos.x - pax) + abs(Ah.pos.y + pay);
  float mB = abs(Bf.pos.x - pbx) + abs(Bf.pos.y - pbz) + abs(Bh.pos.x - pbx) + abs(Bh.pos.y + pby);
  float xhi = min(5, fieldMaxX - 6.2);
  ax = Af.pos.x; if (abs(Ah.pos.x - pax) > abs(Af.pos.x - pax)) { ax = Ah.pos.x; }
  bx = Bf.pos.x; if (abs(Bh.pos.x - pbx) > abs(Bf.pos.x - pbx)) { bx = Bh.pos.x; }
  ax = cl(ax, -fieldMaxX, xhi); bx = cl(bx, -fieldMaxX, xhi);
  az = cl(Af.pos.y, 0, 6); ay = cl(-Ah.pos.y, 0, 6); bz = cl(Bf.pos.y, 0, 6); by = cl(-Bh.pos.y, 0, 6);
  if (mA + mB > 0 && sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay) + (bz - az) * (bz - az)) < 0.8) {
    ax = pax; ay = pay; az = paz; bx = pbx; by = pby; bz = pbz;
  }
  if (abs(Af.pos.x - ax) + abs(Af.pos.y - az) + abs(Ah.pos.x - ax) + abs(Ah.pos.y + ay) > 0.000001) { Af.pos.x = ax; Af.pos.y = az; Ah.pos.x = ax; Ah.pos.y = -ay; }
  if (abs(Bf.pos.x - bx) + abs(Bf.pos.y - bz) + abs(Bh.pos.x - bx) + abs(Bh.pos.y + by) > 0.000001) { Bf.pos.x = bx; Bf.pos.y = bz; Bh.pos.x = bx; Bh.pos.y = -by; }
  pax = ax; pay = ay; paz = az; pbx = bx; pby = by; pbz = bz;

  float dA = ay - az; float dB = by - bz;
  act = 0; if (dA * dB < 0) { act = 1; }
  float t = 0; float kx = 0;
  if (act > 0.5) { t = dA / (dA - dB); kx = ax + t * (bx - ax); kx = kx + (ay + t * (by - ay)); }
  float s1x = sX(ax, ay, az); float s1y = sY(ax, ay, az); float s1z = sZ(ax, ay, az);
  float s2x = sX(bx, by, bz); float s2y = sY(bx, by, bz); float s2z = sZ(bx, by, bz);
  if (key != ax * 1000003 + ay * 10007 + az * 101 + bx * 13 + by * 7 + bz) {
    key = ax * 1000003 + ay * 10007 + az * 101 + bx * 13 + by * 7 + bz;
    SAv.pos.x = s1x; SAv.pos.y = s1z; SAh.pos.x = s1x; SAh.pos.y = -s1y;
    SBv.pos.x = s2x; SBv.pos.y = s2z; SBh.pos.x = s2x; SBh.pos.y = -s2y;
    Mk.pos.x = kx; Mk.pos.y = 0;
    gs = newGraph();
    addNode(gs, "av", [s1x, s1z]); addNode(gs, "bv", [s2x, s2z]); addNode(gs, "ah", [s1x, -s1y]); addNode(gs, "bh", [s2x, -s2y]);
    if (act > 0.5) {
      addNode(gs, "kv", [kx, 0]);
      addEdge(gs, "av", "kv"); addEdge(gs, "kv", "bv"); addEdge(gs, "ah", "kv"); addEdge(gs, "kv", "bh");
    } else {
      addEdge(gs, "av", "bv"); addEdge(gs, "ah", "bh");
    }
  }
  info = "**Тень точки** — точка пересечения светового луча, проходящего через неё, с плоскостью. Лучи параллельны и идут под 45° к оси x в обеих проекциях. Тень A₀ падает на " + pl(ay, az) + " (расстояние до V — " + format(ay, 1) + ", высота над H — " + format(az, 1) + "), тень B₀ — на " + pl(by, bz) + " (расстояние " + format(by, 1) + ", высота " + format(bz, 1) + ").\n\n";
  if (act > 0.5) { info = info + "**Тень отрезка** — линия, соединяющая тени его концов. Тени лежат на разных плоскостях, поэтому она ломается на оси x в точке K: эта точка отрезка равноудалена от V и H, и её луч идёт вдоль оси x."; }
  else { info = info + "**Тень отрезка** — прямая, соединяющая тени его концов; здесь обе тени падают на " + pl(ay, az) + ", поэтому излома нет."; }
}
]
