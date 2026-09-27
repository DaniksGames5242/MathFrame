[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Полярное соответствие относительно окружности ω (радиус r = 2): точке P = (x₀, y₀)
// отвечает прямая p: x₀x + y₀y = r² (её поляра), и наоборот. Точки A, B, C перетаскиваются;
// цветные прямые a, b, c — их поляры, пунктир — стороны треугольника ABC, а точки A′, B′, C′ —
// полюсы сторон — это вершины «двойственного» треугольника, образованного полярами. ----
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; size = 0.5 }
new Point { name = "RR"; pos = (2, 0); dynamic = false; collision = false; active = false }
new Circle { name = "om"; center = O; radius = RR; thickness = 2 }
new Point { name = "A"; pos = (1.1, 1.4); text = true("A"); pauseOnDrag = false; color = #3b82f6; layer = 60 }
new Point { name = "B"; pos = (-1.5, 0.6); text = true("B"); pauseOnDrag = false; color = #ef4444; layer = 60 }
new Point { name = "C"; pos = (0.4, -1.4); text = true("C"); pauseOnDrag = false; color = #22c55e; layer = 60 }
new Point { name = "a1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "a2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "b1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "b2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "c1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "c2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "pa"; pos = (a1, a2); color = #3b82f6; thickness = 2.5; interact = false }
new Line { name = "pb"; pos = (b1, b2); color = #ef4444; thickness = 2.5; interact = false }
new Line { name = "pc"; pos = (c1, c2); color = #22c55e; thickness = 2.5; interact = false }
draw Text { name = "la"; pos = (lx(A), ly(A)); text = "a"; color = #3b82f6; size = 1.3 }
draw Text { name = "lb"; pos = (lx(B), ly(B)); text = "b"; color = #ef4444; size = 1.3 }
draw Text { name = "lc"; pos = (lx(C), ly(C)); text = "c"; color = #22c55e; size = 1.3 }
// стороны ABC (продлённые) и полюсы сторон
new Point { name = "s1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "s2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "s3"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "s4"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "s5"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "s6"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "sAB"; pos = (s1, s2); active = false }
new Line { name = "sBC"; pos = (s3, s4); active = false }
new Line { name = "sCA"; pos = (s5, s6); active = false }
draw Punctir { name = "dAB"; edge = "sAB"; color = #6b7280; thickness = 1.5 }
draw Punctir { name = "dBC"; edge = "sBC"; color = #6b7280; thickness = 1.5 }
draw Punctir { name = "dCA"; edge = "sCA"; color = #6b7280; thickness = 1.5 }
new Point { name = "Ap"; pos = (0, 0); dynamic = false; collision = false; text = true("A′"); color = #f59e0b; size = 0.8 }
new Point { name = "Bp"; pos = (0, 0); dynamic = false; collision = false; text = true("B′"); color = #f59e0b; size = 0.8 }
new Point { name = "Cp"; pos = (0, 0); dynamic = false; collision = false; text = true("C′"); color = #f59e0b; size = 0.8 }

// ---- Логика ----
float r = 2;
float col = 0;
string info = "";

// Место подписи поляры — у её точки, ближайшей к O, чуть сдвинутой вдоль прямой
Function lx(P) { float d2 = P.pos.x ^ 2 + P.pos.y ^ 2; return r * r * P.pos.x / d2 - 0.9 * P.pos.y / sqrt(d2) + 0.25; }
Function ly(P) { float d2 = P.pos.x ^ 2 + P.pos.y ^ 2; return r * r * P.pos.y / d2 + 0.9 * P.pos.x / sqrt(d2) + 0.25; }
// Поляра точки P — через два далёких конца E1, E2
Function polar(P, E1, E2) {
  float d2 = P.pos.x ^ 2 + P.pos.y ^ 2; float d = sqrt(d2);
  float bx = r * r * P.pos.x / d2; float by = r * r * P.pos.y / d2;
  E1.pos.x = bx - 30 * P.pos.y / d; E1.pos.y = by + 30 * P.pos.x / d;
  E2.pos.x = bx + 30 * P.pos.y / d; E2.pos.y = by - 30 * P.pos.x / d;
  return 0;
}
// Прямая через P и Q — продлённая
Function thru(P, Q, E1, E2) {
  float dx = Q.pos.x - P.pos.x; float dy = Q.pos.y - P.pos.y; float l = sqrt(dx * dx + dy * dy) + 0.000001;
  E1.pos.x = P.pos.x - 30 * dx / l; E1.pos.y = P.pos.y - 30 * dy / l; E2.pos.x = P.pos.x + 30 * dx / l; E2.pos.y = P.pos.y + 30 * dy / l;
  return 0;
}
// Полюс прямой PQ: точка X с X·P = r², X·Q = r²
Function pole(P, Q, X) {
  float det = P.pos.x * Q.pos.y - P.pos.y * Q.pos.x;
  if (abs(det) < 0.0001) { X.pos.x = 99; X.pos.y = 99; return 0; }
  X.pos.x = r * r * (Q.pos.y - P.pos.y) / det; X.pos.y = r * r * (P.pos.x - Q.pos.x) / det;
  return 0;
}
Function away(P) { float d = sqrt(P.pos.x ^ 2 + P.pos.y ^ 2); if (d < 0.5) { if (d < 0.001) { P.pos.x = 0.5; d = 0.5; } else { P.pos.x = P.pos.x * 0.5 / d; P.pos.y = P.pos.y * 0.5 / d; } } return 0; }

Update {
  away(A); away(B); away(C);
  // Если C почти на прямой AB — ставим точно на неё (коллинеарность)
  float dx = B.pos.x - A.pos.x; float dy = B.pos.y - A.pos.y; float l = sqrt(dx * dx + dy * dy) + 0.000001;
  float dist = ((C.pos.x - A.pos.x) * dy - (C.pos.y - A.pos.y) * dx) / l;
  col = 0;
  if (abs(dist) < 0.12) { C.pos.x = C.pos.x - dist * dy / l; C.pos.y = C.pos.y + dist * dx / l; col = 1; away(C); }
  polar(A, a1, a2); polar(B, b1, b2); polar(C, c1, c2);
  thru(A, B, s1, s2); thru(B, C, s3, s4); thru(C, A, s5, s6);
  pole(B, C, Ap); pole(C, A, Bp); pole(A, B, Cp);

  info = "**Принцип двойственности** проективной плоскости: если в верном утверждении о точках и прямых заменить «точка» на «прямая», «лежит на» на «проходит через», «коллинеарны» на «пересекаются в одной точке», снова получится верное утверждение. Так теорема Паскаля превращается в теорему Брианшона, а теорема Дезарга — сама в себя.\n\nЗамену «точка ↔ прямая» конкретно осуществляет полярное соответствие относительно окружности: точка P и её поляра p. Оно сохраняет инцидентность: P лежит на прямой q ⇔ полюс Q прямой q лежит на поляре p. Поэтому вершинам треугольника ABC отвечают прямые a, b, c, а его сторонам — точки A′, B′, C′, в которых поляры пересекаются.";
  if (col == 1) { info = info + "\n\n**A, B, C коллинеарны — и их поляры a, b, c проходят через одну точку** (полюс прямой ABC): двойственное утверждение."; }
  else { info = info + "\n\nПоднесите C к прямой AB: как только три точки станут коллинеарными, три поляры пересекутся в одной точке."; }
}
]
