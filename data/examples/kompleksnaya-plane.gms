[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;
show axes = true; show grid = true;

float tab = 1; float psi = 40; float ang = 0; float ca = 0; float cb = 0; float rr = 1; string info = "";

new Point { name = "O0"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false }
new Point { name = "Z"; pos = (3, 2); text = true("z"); pauseOnDrag = false; color = #3b82f6 }
new Line { name = "oz"; pos = (O0, Z); color = #3b82f6; thickness = 3; interact = false }

// ---- Вкладка 1: координаты (a; b) и полярные координаты (r; φ) ----
new Point { name = "X"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; text = true("a") }
new Point { name = "Y"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; text = true("bi") }
new Line { name = "xz"; pos = (X, Z); interact = false }
new Line { name = "yz"; pos = (Y, Z); interact = false }
draw Punctir { name = "pxz"; edge = "xz" }
draw Punctir { name = "pyz"; edge = "yz" }
new Curve { name = "arc"; type = parametric; x = "1.1 * cos(ang * t)"; y = "1.1 * sin(ang * t)"; segments = 100; thickness = 3; color = #f59e0b }
new Claster { name = "tabCoord"; elements = (X, Y, xz, yz, pxz, pyz, arc); active = true }

// ---- Вкладка 2: сопряжение — отражение, умножение на i и на число единичного модуля — поворот ----
new Point { name = "Zc"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; text = true("z*"); color = #f59e0b }
new Point { name = "Zi"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; text = true("iz"); color = #22c55e }
new Point { name = "Zu"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; text = true("zu"); color = #22c55e }
new Line { name = "ozc"; pos = (O0, Zc); color = #f59e0b; thickness = 2; interact = false }
new Line { name = "ozi"; pos = (O0, Zi); color = #22c55e; thickness = 2; interact = false }
new Line { name = "ozu"; pos = (O0, Zu); color = #22c55e; thickness = 2; interact = false }
new Claster { name = "tabSym"; elements = (Zc, Zi, Zu, ozc, ozi, ozu); active = false }

// ---- Вкладка 3: линии уровня |z| = r, Re z = a, Im z = b ----
new Circle { name = "cr"; center = O0; radius = rr; interact = false }
new Curve { name = "lre"; type = parametric; x = "ca"; y = "-5 + 10 * t"; segments = 2; thickness = 3; color = #f59e0b }
new Curve { name = "lim"; type = parametric; x = "-8 + 16 * t"; y = "cb"; segments = 2; thickness = 3; color = #22c55e }
new Claster { name = "tabLev"; elements = (cr, lre, lim); active = false }

new UI { name = "sPsi"; type = slider; label = "u = cos ψ + i sin ψ, ψ°"; variable = psi; min = 0; max = 360; step = 1; default = 40; active = tab == 2 }
new UI { name = "b1"; type = button; label = "Координаты"; action = "tab = 1; tabCoord.active = true; tabSym.active = false; tabLev.active = false" }
new UI { name = "b2"; type = button; label = "Сопряжение и поворот"; action = "tab = 2; tabCoord.active = false; tabSym.active = true; tabLev.active = false" }
new UI { name = "b3"; type = button; label = "Линии уровня"; action = "tab = 3; tabCoord.active = false; tabSym.active = false; tabLev.active = true" }

Function num(v, d) { if (v < -0.0000001) { return "−" + format(-v, d); } return format(abs(v), d); }
Function cx(a, b) { if (b < -0.0000001) { return num(a, 2) + " − " + format(-b, 2) + "i"; } return num(a, 2) + " + " + format(abs(b), 2) + "i"; }

Update {
  float a = Z.pos.x; float b = Z.pos.y;
  float r = hypot(a, b);
  if (r > 4.5) { Z.pos.x = a * 4.5 / r; Z.pos.y = b * 4.5 / r; a = Z.pos.x; b = Z.pos.y; r = 4.5; }
  ang = atan2(b, a);
  ca = a; cb = b; rr = r;
  X.pos.x = a; X.pos.y = 0; Y.pos.x = 0; Y.pos.y = b;
  Zc.pos.x = a; Zc.pos.y = -b;
  Zi.pos.x = -b; Zi.pos.y = a;
  float c = cos(psi * pi / 180); float s = sin(psi * pi / 180);
  Zu.pos.x = a * c - b * s; Zu.pos.y = a * s + b * c;
  if (tab == 1) {
    info = "**Комплексная плоскость.** Числу z = a + bi отвечает единственная точка (a; b): по горизонтали действительная часть, по вертикали мнимая, нуль — начало координат. Модуль |z| = " + format(r, 3) + " — длина радиус-вектора.\n\nz = " + cx(a, b) + ", Re z = " + num(a, 2) + ", Im z = " + num(b, 2) + ".\n\nПолярные координаты: r = |z| = " + format(r, 3) + ", φ = " + num(ang, 3) + " (" + num(ang * 180 / pi, 1) + "°) — с точностью до 2πk. Отсюда a = r cos φ = " + num(r * cos(ang), 2) + ", b = r sin φ = " + num(r * sin(ang), 2) + ", то есть z = r(cos φ + i sin φ).";
  }
  if (tab == 2) {
    info = "**Сопряжение** — отражение относительно действительной оси: сопряжённое z̄ (на поле z*) =" + cx(a, -b) + "; модуль сохраняется, аргумент меняет знак.\n\n**Умножение** — поворот вокруг нуля. На i: iz = " + cx(-b, a) + " — поворот на 90° против часовой стрелки. На число u единичного модуля с ψ = " + format(psi, 0) + "°: zu = " + cx(Zu.pos.x, Zu.pos.y) + ", |zu| = |z| = " + format(r, 3) + ", аргумент растёт на ψ.";
  }
  if (tab == 3) {
    info = "**Линии уровня.** Через z = " + cx(a, b) + " проходят:\n\nокружность |z| = " + format(r, 3) + " с центром в нуле — числа постоянного модуля;\n\nпрямая Re z = " + num(a, 2) + " (оранжевая), параллельная мнимой оси;\n\nпрямая Im z = " + num(b, 2) + " (зелёная), параллельная действительной оси.";
  }
}
]
