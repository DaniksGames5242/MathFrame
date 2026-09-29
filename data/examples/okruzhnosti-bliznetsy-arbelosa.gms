[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Арбелос: база AB, точка C делит её на AC и CB ----
new Point { name = "A"; pos = (-6, -3); dynamic = false; text = true("A") }
new Point { name = "B"; pos = (6, -3); dynamic = false; text = true("B") }
new Line { name = "base"; pos = (A, B); interact = false }
new Point { name = "C"; line = "base"; t = 0.3; text = true("C"); pauseOnDrag = false }
new Point { name = "D"; pos = (-1.2, 0); dynamic = false; collision = false; text = true("D") }
new Point { name = "P1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; size = 0.7 }
new Point { name = "P2"; pos = (0, 0); dynamic = false; collision = false; color = #3b82f6; size = 0.7 }

float xc = -1.2; float r1 = 2.4; float r2 = 3.6; float h = 4.8; float rt = 1.44;
float p1x = 0; float p1y = 0; float p2x = 0; float p2y = 0;
new Curve { name = "big"; type = parametric; x = "6 * cos(3.14159265 * t)"; y = "-3 + 6 * sin(3.14159265 * t)"; segments = 120; thickness = 3 }
new Curve { name = "s1"; type = parametric; x = "(xc - 6) / 2 + r1 * cos(3.14159265 * t)"; y = "-3 + r1 * sin(3.14159265 * t)"; segments = 80; thickness = 3 }
new Curve { name = "s2"; type = parametric; x = "(xc + 6) / 2 + r2 * cos(3.14159265 * t)"; y = "-3 + r2 * sin(3.14159265 * t)"; segments = 80; thickness = 3 }
new Line { name = "hgt"; pos = (C, D); interact = false }
// Окружности-близнецы
new Curve { name = "tw1"; type = parametric; x = "p1x + rt * cos(6.2831853 * t)"; y = "p1y + rt * sin(6.2831853 * t)"; segments = 80; color = #f59e0b; thickness = 2.5 }
new Curve { name = "tw2"; type = parametric; x = "p2x + rt * cos(6.2831853 * t)"; y = "p2y + rt * sin(6.2831853 * t)"; segments = 80; color = #3b82f6; thickness = 2.5 }

string info = ""; float lastX = 99;

Update {
  if (C.pos.x < -5) { C.pos.x = -5; }
  if (C.pos.x > 5) { C.pos.x = 5; }
  xc = C.pos.x;
  r1 = (xc + 6) / 2; r2 = (6 - xc) / 2; h = 2 * sqrt(r1 * r2);
  rt = r1 * r2 / (r1 + r2);
  // Центры: расстояние до высоты равно r, до центра малой полуокружности — r₁ + r (или r₂ + r)
  p1x = xc - rt; p1y = -3 + 2 * sqrt(r1 * rt);
  p2x = xc + rt; p2y = -3 + 2 * sqrt(r2 * rt);
  if (abs(xc - lastX) > 0.000001) {
    lastX = xc; D.pos.x = xc; D.pos.y = -3 + h;
    P1.pos.x = p1x; P1.pos.y = p1y; P2.pos.x = p2x; P2.pos.y = p2y;
  }
  float o1 = sqrt(p1x * p1x + (p1y + 3) ^ 2); float o2 = sqrt(p2x * p2x + (p2y + 3) ^ 2);
  float q1 = sqrt((p1x - (xc - 6) / 2) ^ 2 + (p1y + 3) ^ 2); float q2 = sqrt((p2x - (xc + 6) / 2) ^ 2 + (p2y + 3) ^ 2);
  info = "**Окружности-близнецы арбелоса** касаются высоты CD, большей полуокружности изнутри и одной из меньших снаружи; их радиусы равны.\n\nr = r₁r₂/(r₁ + r₂) = " + format(r1, 2) + " · " + format(r2, 2) + " / " + format(r1 + r2, 2) + " = " + format(rt, 2) + " — для обеих.\n\nПроверка касания: расстояние от центра большой полуокружности до центров близнецов " + format(o1, 2) + " и " + format(o2, 2) + " равно R − r = " + format(6 - rt, 2) + "; до центров малых полуокружностей " + format(q1, 2) + " и " + format(q2, 2) + " равно r₁ + r = " + format(r1 + rt, 2) + " и r₂ + r = " + format(r2 + rt, 2) + ".";
}
]
