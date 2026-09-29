[
description = "{info}"

field width = 20; field height = 12;
camera type = fixed;

// ---- Трапеция: нижнее основание AB на прямой y = ya, верхнее CD на прямой y = yc,
// обе горизонтальны и потому параллельны. A, B независимо двигаются по x (по нижней
// прямой), C, D — по x на верхней прямой; высота (расстояние между прямыми) общая для
// C и D и меняется, когда тянут любую из них по вертикали. Ни одна сторона не короче
// 0.6, основания не пересекаются по x, высота от 1.5 до почти всей высоты поля. ----
new Point { name = "A"; pos = (-5, -3); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5, -3); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (3, 3); text = true("C"); pauseOnDrag = false }
new Point { name = "D"; pos = (-3, 3); text = true("D"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "abcd"; elements = (ab, bc, cd, da) }


// Средняя линия MN (M, N — середины боковых сторон) и высота DH.
new Point { name = "M"; construct = median; vertex = B; base = "da"; dynamic = false; collision = false; text = true("M") }
new Point { name = "N"; construct = median; vertex = A; base = "bc"; dynamic = false; collision = false; text = true("N") }
new Line { name = "mn"; pos = (M, N); color = #f59e0b; interact = false }
new Point { name = "H"; construct = altitude; vertex = D; base = "ab"; dynamic = false; collision = false; text = true("H") }
new Line { name = "dh"; pos = (D, H); color = #3b82f6; interact = false }

float ya = -3; float h = 6; string info = "";
float pax = -5; float pay = -3; float pbx = 5; float pby = -3;
float pcx = 3; float pcy = 3; float pdx = -3; float pdy = 3;

Start { }

Update {
  float mA = abs(A.pos.x - pax) + abs(A.pos.y - pay);
  float mB = abs(B.pos.x - pbx) + abs(B.pos.y - pby);
  float mC = abs(C.pos.x - pcx) + abs(C.pos.y - pcy);
  float mD = abs(D.pos.x - pdx) + abs(D.pos.y - pdy);
  float m = max(mA, mB, mC, mD);
  // Перенос фигуры целиком: все 4 точки сдвинуты на общий вектор — двигаем ya вместе с
  // высотой сохранённой, границу поля держит сам движок.
  float shift = abs((B.pos.x - pbx) - (A.pos.x - pax)) + abs((B.pos.y - pby) - (A.pos.y - pay))
              + abs((C.pos.x - pcx) - (A.pos.x - pax)) + abs((C.pos.y - pcy) - (A.pos.y - pay))
              + abs((D.pos.x - pdx) - (A.pos.x - pax)) + abs((D.pos.y - pdy) - (A.pos.y - pay));

  if (m > 0.000001 && shift > 0.000001) {
    ya = ya + (A.pos.y - pay);
    if (ya > fieldMaxY - 0.3 - h) { ya = fieldMaxY - 0.3 - h; }
    if (ya < -fieldMaxY + 0.3) { ya = -fieldMaxY + 0.3; }
    A.pos.y = ya; B.pos.y = ya;
    float minAx = -fieldMaxX + 0.3; float maxAx = fieldMaxX - 0.3;
    float ax = A.pos.x; if (ax < minAx) { ax = minAx; } if (ax > maxAx) { ax = maxAx; }
    float bx = B.pos.x; if (bx < minAx) { bx = minAx; } if (bx > maxAx) { bx = maxAx; }
    if (bx < ax + 0.6) { bx = ax + 0.6; }
    A.pos.x = ax; B.pos.x = bx;
    float dy = ya + h;
    C.pos.y = dy; D.pos.y = dy;
    float cx = C.pos.x; if (cx < minAx) { cx = minAx; } if (cx > maxAx) { cx = maxAx; }
    float dx2 = D.pos.x; if (dx2 < minAx) { dx2 = minAx; } if (dx2 > maxAx) { dx2 = maxAx; }
    if (cx < dx2 + 0.6) { cx = dx2 + 0.6; }
    C.pos.x = cx; D.pos.x = dx2;
  } else if (m > 0.000001) {
    float minX = -fieldMaxX + 0.3; float maxX = fieldMaxX - 0.3;
    // A, B — по нижней прямой (y = ya).
    float ax = A.pos.x; if (ax < minX) { ax = minX; } if (ax > maxX) { ax = maxX; }
    float bx = B.pos.x; if (bx < minX) { bx = minX; } if (bx > maxX) { bx = maxX; }
    if (bx < ax + 0.6) {
      if (mA >= mB) { ax = bx - 0.6; } else { bx = ax + 0.6; }
    }
    A.pos.x = ax; A.pos.y = ya; B.pos.x = bx; B.pos.y = ya;
    // Высота h — общая для C и D, задаётся той из них, что подвинулась вертикально сильнее.
    float newH = h;
    if (abs(C.pos.y - pcy) >= abs(D.pos.y - pdy)) { newH = C.pos.y - ya; } else { newH = D.pos.y - ya; }
    if (newH < 1.5) { newH = 1.5; }
    if (newH > fieldMaxY - ya - 0.3) { newH = fieldMaxY - ya - 0.3; }
    h = newH;
    float dy = ya + h;
    float cx = C.pos.x; if (cx < minX) { cx = minX; } if (cx > maxX) { cx = maxX; }
    float dxp = D.pos.x; if (dxp < minX) { dxp = minX; } if (dxp > maxX) { dxp = maxX; }
    if (cx < dxp + 0.6) {
      if (mC >= mD) { cx = dxp + 0.6; } else { dxp = cx - 0.6; }
    }
    C.pos.x = cx; C.pos.y = dy; D.pos.x = dxp; D.pos.y = dy;
  }

  // Ровно одна пара параллельных сторон: основания не равны (иначе это параллелограмм).
  float bb = C.pos.x - D.pos.x; float aa = B.pos.x - A.pos.x;
  if (abs(bb - aa) < 0.5) {
    float nb = aa + 0.5;
    if (bb < aa) { nb = aa - 0.5; }
    if (nb < 0.6 || D.pos.x + nb > fieldMaxX - 0.3) { nb = aa + 0.5; if (D.pos.x + nb > fieldMaxX - 0.3) { D.pos.x = fieldMaxX - 0.3 - nb; } }
    C.pos.x = D.pos.x + nb;
  }

  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y;
  pcx = C.pos.x; pcy = C.pos.y; pdx = D.pos.x; pdy = D.pos.y;

  float a = ab.length; float b = cd.length;
  info = "**Основания параллельны** (AB ∥ CD), боковые стороны — нет: a = " + format(a, 2) + ", b = " + format(b, 2) + ", высота h = " + format(h, 2) + ".\n\n**Площадь равна произведению средней линии MN (оранжевая) на высоту DH (синяя):** MN = (a + b)/2 = " + format((a + b) / 2, 2) + ", S = MN · h = (" + format(a, 2) + " + " + format(b, 2) + ")/2 · " + format(h, 2) + " = " + format((a + b) / 2 * h, 2) + ".";
}
]
