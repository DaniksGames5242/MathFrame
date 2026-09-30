[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;
show axes = true; show grid = true;

float tab = 1; float ang = 0; float r = 3.6; float phi = 4; float built = 0; string info = "";

new Point { name = "O0"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false }

// ---- Вкладка 1: плоскость с разрезом по отрицательной действительной полуоси ----
new Point { name = "Z"; pos = (-3, 2); text = true("z"); pauseOnDrag = false; color = #3b82f6 }
new Line { name = "oz"; pos = (O0, Z); color = #3b82f6; thickness = 3; interact = false }
new Curve { name = "arc"; type = parametric; x = "1.1 * cos(ang * t)"; y = "1.1 * sin(ang * t)"; segments = 120; thickness = 3; color = #f59e0b; active = r > 0.05 }
draw Graph { name = "gCut"; graph = "gcut"; edgeWidth = 5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; edgeColor = #f59e0b; layer = 5 }
new Claster { name = "tabPlane"; elements = (O0, Z, oz, arc, gCut); active = true }

// ---- Вкладка 2: любое значение аргумента φ сводится к главному Arg φ ----
new Point { name = "Q"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; color = #3b82f6; text = true("Arg φ") }
draw Graph { name = "gSaw"; graph = "gsaw"; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; edgeColor = #3b82f6; layer = 5 }
draw Graph { name = "gLim"; graph = "glim"; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; edgeColor = #3b82f688; layer = 4 }
new Claster { name = "tabGraph"; elements = (Q, gSaw, gLim); active = false }

new UI { name = "sPhi"; type = slider; label = "значение аргумента φ"; variable = phi; min = -8; max = 8; step = 0.05; default = 4; active = tab == 2 }
new UI { name = "b1"; type = button; label = "Плоскость и разрез"; action = "tab = 1; tabPlane.active = true; tabGraph.active = false" }
new UI { name = "b2"; type = button; label = "Из φ в главное значение"; action = "tab = 2; tabPlane.active = false; tabGraph.active = true" }

Function num(v, d) { if (v < -0.0000001) { return "−" + format(-v, d); } return format(abs(v), d); }
Function cx(a, b) { if (b < -0.0000001) { return num(a, 2) + " − " + format(-b, 2) + "i"; } return num(a, 2) + " + " + format(abs(b), 2) + "i"; }
Function principal(a, b) {
  if (a > 0) { return atan(b / a); }
  if (a < 0 && b >= 0) { return atan(b / a) + pi; }
  if (a < 0) { return atan(b / a) - pi; }
  if (b > 0) { return pi / 2; }
  return -pi / 2;
}
Function reduce(x) { return x - 2 * pi * ceil((x - pi) / (2 * pi)); }

Update {
  if (built == 0) {
    built = 1;
    gcut = newGraph(); addNode(gcut, "a", [-8, 0]); addNode(gcut, "b", [0, 0]); addEdge(gcut, "a", "b");
    gsaw = newGraph();
    addNode(gsaw, "a1", [-8, -8 + 2 * pi]); addNode(gsaw, "a2", [-pi, pi]); addEdge(gsaw, "a1", "a2");
    addNode(gsaw, "b1", [-pi, -pi]); addNode(gsaw, "b2", [pi, pi]); addEdge(gsaw, "b1", "b2");
    addNode(gsaw, "c1", [pi, -pi]); addNode(gsaw, "c2", [8, 8 - 2 * pi]); addEdge(gsaw, "c1", "c2");
    glim = newGraph();
    addNode(glim, "u1", [-8, pi]); addNode(glim, "u2", [8, pi]); addEdge(glim, "u1", "u2");
    addNode(glim, "d1", [-8, -pi]); addNode(glim, "d2", [8, -pi]); addEdge(glim, "d1", "d2");
    addNode(glim, "l1", [-pi, -pi]); addNode(glim, "l2", [-pi, pi]); addEdge(glim, "l1", "l2");
    addNode(glim, "r1", [pi, -pi]); addNode(glim, "r2", [pi, pi]); addEdge(glim, "r1", "r2");
  }
  float a = Z.pos.x; float b = Z.pos.y;
  r = hypot(a, b);
  float p = principal(a, b);
  ang = p;
  float ap = reduce(phi);
  Q.pos.x = phi; Q.pos.y = ap;
  if (tab == 1) {
    if (r < 0.05) {
      info = "**Главное значение аргумента** — единственное значение из полуинтервала (−π; π]. Для z = 0 аргумент не определён.";
    }
    if (r >= 0.05) {
      string side = "Точка вне разреза: значение меняется непрерывно.";
      if (a < 0 && b >= 0) { side = "Точка в верхней полуплоскости у разреза: Arg z близок к π; на самом разрезе Arg z = π."; }
      if (a < 0 && b < 0) { side = "Точка в нижней полуплоскости у разреза: Arg z близок к −π; при переходе через разрез значение скачком меняется на 2π."; }
      info = "**Главное значение аргумента** Arg z — единственное значение из полуинтервала (−π; π]; разрез идёт вдоль отрицательной действительной полуоси (оранжевая линия).\n\nz = " + cx(a, b) + ", Arg z = **" + num(p, 3) + "** (" + num(p * 180 / pi, 1) + "°).\n\n" + side;
    }
  }
  if (tab == 2) {
    float kq = (phi - ap) / (2 * pi);
    info = "**Из любого значения — в главное.** Значения аргумента одного числа отличаются на 2πk; из них в (−π; π] попадает ровно одно.\n\nφ = " + num(phi, 2) + " = Arg z + 2πk, где k = " + num(round(kq), 0) + ", поэтому Arg z = " + num(phi, 2) + " − 2π · " + num(round(kq), 0) + " = **" + num(ap, 3) + "**.\n\nГрафик Arg φ — «пила» со скачками 2π при φ = π + 2πk.";
  }
}
]
