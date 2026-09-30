[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;
show axes = true; show grid = true;

float k = 0; float ang = 0; float kk = 0; float r = 3.6; string info = "";

new Point { name = "O0"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false }
new Point { name = "Z"; pos = (-3, 2); text = true("z"); pauseOnDrag = false; color = #3b82f6 }
new Line { name = "oz"; pos = (O0, Z); color = #3b82f6; thickness = 3; interact = false }

// Дуга (при k ≠ 0 — спираль) от положительной действительной оси на угол arg z = Arg z + 2πk
new Curve { name = "arc"; type = parametric; x = "(0.9 + 0.3 * abs(kk) * t) * cos(ang * t)"; y = "(0.9 + 0.3 * abs(kk) * t) * sin(ang * t)"; segments = 160; thickness = 3; color = #f59e0b; active = r > 0.05 }

new UI { name = "sK"; type = slider; label = "число оборотов k"; variable = k; min = -2; max = 2; step = 1; default = 0 }

Function num(v, d) { if (v < -0.0000001) { return "−" + format(-v, d); } return format(abs(v), d); }
Function cx(a, b) { if (b < -0.0000001) { return num(a, 2) + " − " + format(-b, 2) + "i"; } return num(a, 2) + " + " + format(abs(b), 2) + "i"; }
Function principal(a, b) {
  if (a > 0) { return atan(b / a); }
  if (a < 0 && b >= 0) { return atan(b / a) + pi; }
  if (a < 0) { return atan(b / a) - pi; }
  if (b > 0) { return pi / 2; }
  return -pi / 2;
}
Function rule(a, b) {
  if (a > 0) { return "a > 0: Arg z = arctg(b/a)"; }
  if (a < 0 && b >= 0) { return "a < 0, b ≥ 0: Arg z = arctg(b/a) + π"; }
  if (a < 0) { return "a < 0, b < 0: Arg z = arctg(b/a) − π"; }
  if (b > 0) { return "a = 0, b > 0: Arg z = π/2"; }
  return "a = 0, b < 0: Arg z = −π/2";
}

Update {
  float a = Z.pos.x; float b = Z.pos.y;
  r = hypot(a, b);
  kk = k;
  float p = principal(a, b);
  ang = p + 2 * pi * k;
  if (r < 0.05) {
    info = "**Аргумент** числа z = a + bi — угол между положительным направлением действительной оси и вектором из нуля в точку z. Для z = 0 аргумент не определён: нулевой вектор не задаёт направления.";
  }
  if (r >= 0.05) {
    info = "**Аргумент** числа z = a + bi — угол между положительным направлением действительной оси и вектором из нуля в точку z.\n\nz = " + cx(a, b) + ", |z| = " + format(r, 3) + ". По правилу «" + rule(a, b) + "» главное значение **Arg z = " + num(p, 3) + "** (" + num(p * 180 / pi, 1) + "°) — единственное в полуинтервале (−π; π].\n\nАргумент многозначен: arg z = Arg z + 2πk. При k = " + num(k, 0) + " получаем **" + num(ang, 3) + "** (" + num(ang * 180 / pi, 1) + "°) — оранжевая дуга делает нужное число оборотов и приводит в ту же точку z.";
  }
}
]
