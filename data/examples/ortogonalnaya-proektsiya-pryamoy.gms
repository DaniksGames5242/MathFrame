[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Эпюр Монжа: ось x, над ней — плоскость V (фронтальные проекции), под ней — H
// (горизонтальные). Отрезок AB задан четырьмя точками; A′ и A″ лежат на одной линии связи
// (одинаковый x), так что двигая любую из них, пользователь двигает точку A в пространстве. ----
draw Graph { name = "gAx"; graph = "gx"; edgeColor = #3b82f6; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Text { name = "tX"; pos = (9.3, 0.45); text = "x"; size = 1 }
draw Text { name = "tV"; pos = (-9, 5.3); text = "V"; size = 1 }
draw Text { name = "tH"; pos = (-9, -5.3); text = "H"; size = 1 }

new Point { name = "Af"; pos = (-5, 4.2); text = true("A″"); color = #3b82f6; pauseOnDrag = false; collideWithPoints = false }
new Point { name = "Bf"; pos = (3.5, 1.5); text = true("B″"); color = #3b82f6; pauseOnDrag = false; collideWithPoints = false }
new Point { name = "Ah"; pos = (-5, -1.2); text = true("A′"); color = #f59e0b; pauseOnDrag = false; collideWithPoints = false }
new Point { name = "Bh"; pos = (3.5, -4); text = true("B′"); color = #f59e0b; pauseOnDrag = false; collideWithPoints = false }
new Line { name = "abf"; pos = (Af, Bf); color = #3b82f6; interact = false }
new Line { name = "abh"; pos = (Ah, Bh); color = #f59e0b; interact = false }
new Line { name = "lA"; pos = (Af, Ah); active = false; interact = false }
new Line { name = "lB"; pos = (Bf, Bh); active = false; interact = false }
draw Punctir { name = "pA"; edge = "lA" }
draw Punctir { name = "pB"; edge = "lB" }

string info = "";
float built = 0;
float pax = 0; float pay = 0; float paz = 0; float pbx = 0; float pby = 0; float pbz = 0;

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
  // Кто двигался: точка A (Af или Ah) или B.
  float mA = abs(Af.pos.x - pax) + abs(Af.pos.y - paz) + abs(Ah.pos.x - pax) + abs(Ah.pos.y + pay);
  float mB = abs(Bf.pos.x - pbx) + abs(Bf.pos.y - pbz) + abs(Bh.pos.x - pbx) + abs(Bh.pos.y + pby);
  // Пространственные координаты (x, y — глубина, z — высота); x берём у сдвинутой из пары.
  float ax = Af.pos.x; if (abs(Ah.pos.x - pax) > abs(Af.pos.x - pax)) { ax = Ah.pos.x; }
  float bx = Bf.pos.x; if (abs(Bh.pos.x - pbx) > abs(Bf.pos.x - pbx)) { bx = Bh.pos.x; }
  float az = cl(Af.pos.y, 0, fieldMaxY); float ay = cl(-Ah.pos.y, 0, fieldMaxY);
  float bz = cl(Bf.pos.y, 0, fieldMaxY); float by = cl(-Bh.pos.y, 0, fieldMaxY);
  bool moveA = mA > mB;
  // Прилипание к частным положениям: AB ⟂ H, AB ⟂ V, AB ∥ H, AB ∥ V.
  if (sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay)) < 0.3) {
    if (moveA) { ax = bx; ay = by; } else { bx = ax; by = ay; }
  } else if (sqrt((bx - ax) * (bx - ax) + (bz - az) * (bz - az)) < 0.3) {
    if (moveA) { ax = bx; az = bz; } else { bx = ax; bz = az; }
  }
  if (abs(bz - az) < 0.15) { if (moveA) { az = bz; } else { bz = az; } }
  if (abs(by - ay) < 0.15) { if (moveA) { ay = by; } else { by = ay; } }
  // Отрезок не вырождается.
  if (sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay) + (bz - az) * (bz - az)) < 0.6) {
    ax = pax; ay = pay; az = paz; bx = pbx; by = pby; bz = pbz;
  }
  if (abs(Af.pos.x - ax) + abs(Af.pos.y - az) + abs(Ah.pos.x - ax) + abs(Ah.pos.y + ay) > 0.000001) { Af.pos.x = ax; Af.pos.y = az; Ah.pos.x = ax; Ah.pos.y = -ay; }
  if (abs(Bf.pos.x - bx) + abs(Bf.pos.y - bz) + abs(Bh.pos.x - bx) + abs(Bh.pos.y + by) > 0.000001) { Bf.pos.x = bx; Bf.pos.y = bz; Bh.pos.x = bx; Bh.pos.y = -by; }
  pax = ax; pay = ay; paz = az; pbx = bx; pby = by; pbz = bz;

  float dx = bx - ax; float dy = by - ay; float dz = bz - az;
  float l = sqrt(dx * dx + dy * dy + dz * dz);
  float lh = sqrt(dx * dx + dy * dy); float lf = sqrt(dx * dx + dz * dz);
  float al = degrees(asin(min(1, abs(dz) / l))); float be = degrees(asin(min(1, abs(dy) / l)));
  info = "**Проекция прямой** — множество оснований перпендикуляров, опущенных из её точек на плоскость: прямая AB проецируется на H в прямую A′B′, на V — в A″B″.\n\n**Длина проекции:** l′ = l · cos α. Истинная длина AB = l = " + format(l, 2) + ". На H угол наклона α = " + format(al, 0) + "°, A′B′ = " + format(l, 2) + " · " + format(cos(radians(al)), 3) + " = " + format(lh, 2) + ". На V угол β = " + format(be, 0) + "°, A″B″ = " + format(l, 2) + " · " + format(cos(radians(be)), 3) + " = " + format(lf, 2) + ".\n\n";
  if (lh < 0.001) { info = info + "**AB ⟂ H:** проекция на H сводится к точке A′ = B′, а A″B″ = AB (отрезок перпендикулярен оси x)."; }
  else if (lf < 0.001) { info = info + "**AB ⟂ V:** проекция на V сводится к точке A″ = B″, а A′B′ = AB."; }
  else if (abs(dz) < 0.001) { info = info + "**AB ∥ H:** A′B′ = AB по длине и направлению, а A″B″ лежит параллельно оси x, перпендикулярно линиям связи."; }
  else if (abs(dy) < 0.001) { info = info + "**AB ∥ V:** A″B″ = AB, а A′B′ параллельна оси x."; }
  else { info = info + "**Прямая общего положения:** обе проекции — прямые, и обе короче отрезка."; }
}
]
