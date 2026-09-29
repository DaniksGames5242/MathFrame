[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- База AB; точка C делит её на отрезки AC и CB (перетаскивается вдоль базы) ----
new Point { name = "A"; pos = (-6, -3); dynamic = false; text = true("A") }
new Point { name = "B"; pos = (6, -3); dynamic = false; text = true("B") }
new Line { name = "base"; pos = (A, B); interact = false }
new Point { name = "C"; line = "base"; t = 0.3; text = true("C"); pauseOnDrag = false }
new Point { name = "D"; pos = (-1.2, 0); dynamic = false; collision = false; text = true("D") }

// ---- Три полуокружности на AB, AC, CB ----
float xc = -1.2; float r1 = 2.4; float r2 = 3.6; float h = 4.8;
new Curve { name = "big"; type = parametric; x = "6 * cos(3.14159265 * t)"; y = "-3 + 6 * sin(3.14159265 * t)"; segments = 120; thickness = 3 }
new Curve { name = "s1"; type = parametric; x = "(xc - 6) / 2 + r1 * cos(3.14159265 * t)"; y = "-3 + r1 * sin(3.14159265 * t)"; segments = 80; thickness = 3 }
new Curve { name = "s2"; type = parametric; x = "(xc + 6) / 2 + r2 * cos(3.14159265 * t)"; y = "-3 + r2 * sin(3.14159265 * t)"; segments = 80; thickness = 3 }
new Line { name = "hgt"; pos = (C, D); color = #f59e0b; thickness = 2.5; interact = false }
// Круг с диаметром CD
new Curve { name = "disk"; type = parametric; x = "xc + h / 2 * cos(6.2831853 * t)"; y = "-3 + h / 2 + h / 2 * sin(6.2831853 * t)"; segments = 80; color = #f59e0b; thickness = 2 }

string info = ""; float lastX = 99;
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  if (C.pos.x < -5) { C.pos.x = -5; }
  if (C.pos.x > 5) { C.pos.x = 5; }
  xc = C.pos.x;
  r1 = (xc + 6) / 2; r2 = (6 - xc) / 2; h = 2 * sqrt(r1 * r2);
  if (abs(xc - lastX) > 0.000001) { lastX = xc; D.pos.x = xc; D.pos.y = -3 + h; }
  float S = 3.14159265 * r1 * r2;
  info = "**Арбелос** — фигура между полуокружностями на AB (радиус R), AC (r₁) и CB (r₂).\n\nR = r₁ + r₂ = " + format(r1, 2) + " + " + format(r2, 2) + " = " + format(r1 + r2, 2) + ".\n\nВысота CD = 2√(r₁r₂) = 2√(" + format(r1, 2) + " · " + format(r2, 2) + ") = " + format(h, 2) + ".\n\nПлощадь арбелоса π/2 · (R² − r₁² − r₂²) = " + format(3.14159265 / 2 * ((r1 + r2) ^ 2 - r1 * r1 - r2 * r2), 2) + " равна площади круга с диаметром CD: π · CD²/4 = " + format(3.14159265 * h * h / 4, 2) + ".";
}
]
