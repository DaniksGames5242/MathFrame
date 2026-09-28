[
description = "{info}"

field width = 16; field height = 12;
camera type = fixed;

// ---- Модель: диск с отождествлёнными противоположными точками границы (проективная
// модель эллиптической плоскости). Окружность — «бесконечно удалённая прямая»: две её
// диаметрально противоположные точки — на самом деле ОДНА точка плоскости. Прямые —
// хорды, продолженные до этой окружности. Два ползунка задают направления двух прямых,
// проходящих через разные фиксированные точки: при любых направлениях они пересекаются —
// либо в обычной точке, либо (при совпадающих направлениях) в общей точке на границе. ----
new Point { name = "O"; pos = (0, 0); dynamic = false; active = false; collision = false }
new Circle { name = "inf"; center = O; radius = 5.5; interact = false }
new Point { name = "B1"; pos = (-2, -1); dynamic = false; collision = false; text = true("B₁") }
new Point { name = "B2"; pos = (2, 1); dynamic = false; collision = false; text = true("B₂") }

new Point { name = "E1a"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "E1b"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "E2a"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "E2b"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "l1"; pos = (E1a, E1b); interact = false }
new Line { name = "l2"; pos = (E2a, E2b); interact = false }

new Point { name = "X"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e; active = hasX > 0.5 }

new UI { name = "sA1"; type = slider; label = "направление прямой 1, °"; variable = a1; min = 0; max = 179; step = 1; default = 25 }
new UI { name = "sA2"; type = slider; label = "направление прямой 2, °"; variable = a2; min = 0; max = 179; step = 1; default = 100 }

// ---- Логика ----
float a1 = 25; float a2 = 100;
float R = 5.5;
float hasX = 0;
string info = "";

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

// Точка выхода прямой (через (bx,by), направление (dx,dy)) на границу R в сторону sgn (±1).
Function edge(bx, by, dx, dy, sgn) {
  float a = dx * dx + dy * dy;
  float b = 2 * (bx * dx + by * dy);
  float c = bx * bx + by * by - R * R;
  float t = (-b + sgn * sqrt(b * b - 4 * a * c)) / (2 * a);
  return t;
}

Update {
  float r1 = a1 * 3.14159265 / 180; float d1x = cos(r1); float d1y = sin(r1);
  float r2 = a2 * 3.14159265 / 180; float d2x = cos(r2); float d2y = sin(r2);
  float t1p = edge(B1.pos.x, B1.pos.y, d1x, d1y, 1); float t1m = edge(B1.pos.x, B1.pos.y, d1x, d1y, -1);
  float t2p = edge(B2.pos.x, B2.pos.y, d2x, d2y, 1); float t2m = edge(B2.pos.x, B2.pos.y, d2x, d2y, -1);
  E1a.pos.x = B1.pos.x + t1p * d1x; E1a.pos.y = B1.pos.y + t1p * d1y;
  E1b.pos.x = B1.pos.x + t1m * d1x; E1b.pos.y = B1.pos.y + t1m * d1y;
  E2a.pos.x = B2.pos.x + t2p * d2x; E2a.pos.y = B2.pos.y + t2p * d2y;
  E2b.pos.x = B2.pos.x + t2m * d2x; E2b.pos.y = B2.pos.y + t2m * d2y;

  float det = d2x * d1y - d1x * d2y;
  if (abs(det) < 0.01) {
    hasX = 0;
    info = "**Направления совпадают — прямые кажутся параллельными,** но и в этом случае они пересекаются: обе выходят на границу («бесконечно удалённую прямую») в одной и той же точке, потому что диаметрально противоположные точки границы — не две точки, а одна. Отмечены оба конца первой прямой (E₁ᵃ и E₁ᵇ) — это одна и та же точка плоскости, и вторая прямая проходит ровно через неё же.";
  } else {
    hasX = 1;
    float t = (-(B2.pos.x - B1.pos.x) * d2y + d2x * (B2.pos.y - B1.pos.y)) / det;
    X.pos.x = B1.pos.x + t * d1x; X.pos.y = B1.pos.y + t * d1y;
    info = "**Любые две прямые эллиптической плоскости пересекаются** — параллельных не существует вовсе. Точка пересечения X = (" + num(X.pos.x, 2) + ", " + num(X.pos.y, 2) + "). Поворачивайте направления ползунками: чем ближе они друг к другу, тем дальше X уходит к границе — а когда направления совпадут, X окажется прямо на ней.";
  }
}
]
