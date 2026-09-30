[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;
show axes = true; show grid = true;

float tab = 1; float phi = 60; float rr = 3; float r0 = 2; string info = "";

new Point { name = "O0"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false }
new Point { name = "Z"; pos = (3, 2); text = true("z"); pauseOnDrag = false; color = #3b82f6 }

// ---- Вкладка 1: модуль — расстояние до начала координат, числа одного модуля лежат на окружности ----
new Point { name = "X"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false }
new Point { name = "W"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; text = true("w"); color = #f59e0b }
new Circle { name = "cO"; center = O0; radius = rr; interact = false }
new Line { name = "oz"; pos = (O0, Z); color = #3b82f6; thickness = 3; interact = false }
new Line { name = "ow"; pos = (O0, W); color = #f59e0b; thickness = 3; interact = false }
new Line { name = "ox"; pos = (O0, X); interact = false }
new Line { name = "xz"; pos = (X, Z); interact = false }
draw Punctir { name = "pxz"; edge = "xz" }
new Claster { name = "tabO"; elements = (X, W, cO, oz, ow, ox, xz, pxz); active = true }

// ---- Вкладка 2: |z − z₀| — расстояние между точками, |z − z₀| = R — окружность ----
new Point { name = "Z0"; pos = (-3, -1); text = true("z₀"); pauseOnDrag = false; color = #f59e0b }
new Circle { name = "cZ"; center = Z0; radius = r0; interact = false }
new Line { name = "zz"; pos = (Z0, Z); color = #3b82f6; thickness = 3; interact = false }
new Claster { name = "tabD"; elements = (Z0, cZ, zz); active = false }

new UI { name = "sPhi"; type = slider; label = "поворот w = z·(cos φ + i sin φ), φ°"; variable = phi; min = 0; max = 360; step = 1; default = 60; active = tab == 1 }
new UI { name = "b1"; type = button; label = "Расстояние до начала координат"; action = "tab = 1; tabO.active = true; tabD.active = false" }
new UI { name = "b2"; type = button; label = "Расстояние между точками"; action = "tab = 2; tabO.active = false; tabD.active = true" }

Function num(v, d) { if (v < -0.0000001) { return "−" + format(-v, d); } return format(abs(v), d); }
Function cx(a, b) { if (b < -0.0000001) { return num(a, 2) + " − " + format(-b, 2) + "i"; } return num(a, 2) + " + " + format(abs(b), 2) + "i"; }

Update {
  float a = Z.pos.x; float b = Z.pos.y;
  rr = hypot(a, b);
  if (rr > 4.6) { Z.pos.x = a * 4.6 / rr; Z.pos.y = b * 4.6 / rr; a = Z.pos.x; b = Z.pos.y; rr = 4.6; }
  X.pos.x = a; X.pos.y = 0;
  float c = cos(phi * pi / 180); float s = sin(phi * pi / 180);
  W.pos.x = a * c - b * s; W.pos.y = a * s + b * c;
  float dx = a - Z0.pos.x; float dy = b - Z0.pos.y;
  r0 = hypot(dx, dy);
  if (tab == 1) {
    info = "**Модуль как расстояние.** Числу z = a + bi отвечает единственная точка (a; b), а |z| = √(a² + b²) — её расстояние до начала координат (гипотенуза треугольника с катетами |a| и |b|).\n\nz = " + cx(a, b) + ", |z| = " + format(rr, 3) + ".\n\nВсе числа с тем же модулем лежат на окружности |z| = " + format(rr, 3) + " с центром в нуле и различаются лишь аргументом. Умножение на число единичного модуля поворачивает z на φ = " + format(phi, 0) + "° и не меняет удалённость от нуля: w = " + cx(W.pos.x, W.pos.y) + ", |w| = " + format(hypot(W.pos.x, W.pos.y), 3) + ".";
  }
  if (tab == 2) {
    info = "**Модуль разности** |z − z₀| — расстояние между точками z и z₀.\n\nz − z₀ = " + cx(dx, dy) + ", |z − z₀| = " + format(r0, 3) + ".\n\nУравнение |z − z₀| = R задаёт окружность с центром z₀ и радиусом R; сейчас R = " + format(r0, 3) + ", и точка z лежит на ней. При z₀ = 0 получается окружность |z| = R с центром в начале координат.";
  }
}
]
