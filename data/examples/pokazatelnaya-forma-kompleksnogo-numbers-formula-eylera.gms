[
description = "{info}"
field width = 12; field height = 7.5;
camera type = fixed;
show axes = true; show grid = true;
string info = "";
float r1 = 1.5; float f1 = 0.6; float r2 = 1.2; float f2 = 1.4; float ax = 99; float ay = 99; float bx = 99; float by = 99;

new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Circle { name = "cr"; center = O; radius = 1; interact = false }
new Point { name = "z"; pos = (1.24, 0.85); text = true("z"); pauseOnDrag = false; collideWithPoints = false; color = #3b82f6 }
new Point { name = "w"; pos = (0.2, 1.19); text = true("w"); pauseOnDrag = false; collideWithPoints = false; color = #f59e0b }
new Point { name = "p"; pos = (0, 0); text = true("zw"); dynamic = false; collision = false; color = #22c55e }
new Line { name = "oz"; pos = (O, z); interact = false; color = #3b82f6; thickness = 3 }
new Line { name = "ow"; pos = (O, w); interact = false; color = #f59e0b; thickness = 3 }
new Line { name = "op"; pos = (O, p); interact = false; color = #22c55e; thickness = 3 }
new Curve { name = "arz"; type = parametric; x = "0.6 * cos(t * f1)"; y = "0.6 * sin(t * f1)"; color = #3b82f6 }
new Curve { name = "arw"; type = parametric; x = "0.9 * cos(t * f2)"; y = "0.9 * sin(t * f2)"; color = #f59e0b }

Function num(v) { if (v < 0) { return "−" + format(-v, 2); } return format(v, 2); }
Function term(v) { if (v < 0) { return " − " + format(-v, 2); } return " + " + format(v, 2); }
Function clamp(p) {
  float q = hypot(p.pos.x, p.pos.y);
  if (q > 1.9) { p.pos.x = p.pos.x * 1.9 / q; p.pos.y = p.pos.y * 1.9 / q; }
  if (q < 0.3) { if (q < 0.0001) { p.pos.x = 0.3; } else { p.pos.x = p.pos.x * 0.3 / q; p.pos.y = p.pos.y * 0.3 / q; } }
  return 0;
}

Update {
  float dummy = 0;
  if (hypot(z.pos.x, z.pos.y) > 1.9 || hypot(z.pos.x, z.pos.y) < 0.3) { dummy = clamp(z); }
  if (hypot(w.pos.x, w.pos.y) > 1.9 || hypot(w.pos.x, w.pos.y) < 0.3) { dummy = clamp(w); }
  if (abs(z.pos.x - ax) > 0.00001 || abs(z.pos.y - ay) > 0.00001 || abs(w.pos.x - bx) > 0.00001 || abs(w.pos.y - by) > 0.00001) {
    ax = z.pos.x; ay = z.pos.y; bx = w.pos.x; by = w.pos.y;
    r1 = hypot(ax, ay); f1 = atan2(ay, ax);
    r2 = hypot(bx, by); f2 = atan2(by, bx);
    p.pos.x = r1 * r2 * cos(f1 + f2); p.pos.y = r1 * r2 * sin(f1 + f2);
  }
  float s = f1 + f2;
  info = "**Формула Эйлера** e^(iφ) = cos φ + i sin φ. Отсюда показательная форма z = r·e^(iφ): r = |z|, φ = arg z ∈ (−π; π]. Окружность — числа e^(iφ) с модулем 1.\n\n";
  info = info + "z = " + num(ax) + term(ay) + "i = " + format(r1, 2) + "·e^(i·" + num(f1) + "), e^(i·" + num(f1) + ") = " + num(cos(f1)) + term(sin(f1)) + "i.\n\n";
  info = info + "w = " + num(bx) + term(by) + "i = " + format(r2, 2) + "·e^(i·" + num(f2) + ").\n\n";
  info = info + "Умножение: zw = r₁r₂·e^(i(φ₁+φ₂)) = " + format(r1 * r2, 2) + "·e^(i·" + num(s) + ") = " + num(r1 * r2 * cos(s)) + term(r1 * r2 * sin(s)) + "i. Модули перемножаются, показатели складываются.";
}
]
