[
description = "{info}"
field width = 12; field height = 7.5;
camera type = fixed;
show axes = true; show grid = true;
string info = "";
float r = 2.5; float ph = 0.6; float ax = 99; float ay = 99;

new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "z"; pos = (2.06, 1.41); text = true("z"); pauseOnDrag = false; collideWithPoints = false; color = #3b82f6 }
new Point { name = "A"; pos = (2.06, 0); text = true("a"); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "B"; pos = (0, 1.41); text = true("b"); dynamic = false; collision = false; color = #22c55e }
new Line { name = "oz"; pos = (O, z); interact = false; color = #3b82f6; thickness = 3 }
new Line { name = "oa"; pos = (O, A); interact = false; color = #f59e0b; thickness = 3 }
new Line { name = "ob"; pos = (O, B); interact = false; color = #22c55e; thickness = 3 }
new Line { name = "za"; pos = (z, A); interact = false; color = #f59e0b }
new Line { name = "zb"; pos = (z, B); interact = false; color = #22c55e }
new Curve { name = "arc"; type = parametric; x = "0.8 * cos(t * ph)"; y = "0.8 * sin(t * ph)"; color = #3b82f6 }

Function num(v) { if (v < 0) { return "−" + format(-v, 2); } return format(v, 2); }
Function term(v) { if (v < 0) { return " − " + format(-v, 2); } return " + " + format(v, 2); }

Update {
  // не даём числу стать нулём: у нуля нет аргумента
  float q = hypot(z.pos.x, z.pos.y);
  if (q < 0.5) { if (q < 0.0001) { z.pos.x = 0.5; } else { z.pos.x = z.pos.x * 0.5 / q; z.pos.y = z.pos.y * 0.5 / q; } }
  if (abs(z.pos.x - ax) > 0.00001 || abs(z.pos.y - ay) > 0.00001) {
    ax = z.pos.x; ay = z.pos.y;
    r = hypot(ax, ay); ph = atan2(ay, ax);
    A.pos.x = ax; A.pos.y = 0; B.pos.x = 0; B.pos.y = ay;
  }
  float c = ax / r; float s = ay / r;
  info = "**Тригонометрическая форма**: z = r(cos φ + i sin φ), где r = |z| — расстояние от начала координат до точки z, а φ = arg z — угол между положительной полуосью Ox и радиус-вектором. Проекции точки: a = r cos φ, b = r sin φ.\n\n";
  info = info + "r = √(a² + b²) = " + format(r, 2) + ", φ = " + num(ph * 57.29578) + "° (" + num(ph) + " рад).\n\n";
  info = info + "cos φ = " + num(c) + ", sin φ = " + num(s) + ", поэтому a = " + format(r, 2) + "·(" + num(c) + ") = " + num(ax) + ", b = " + format(r, 2) + "·(" + num(s) + ") = " + num(ay) + ".\n\n";
  info = info + "z = " + num(ax) + term(ay) + "i = " + format(r, 2) + "·(" + num(c) + term(s) + "i).";
}
]
