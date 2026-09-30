[
description = "{info}"

field width = 22;
field height = 16;
camera type = fixed;

// ---- Куб с единичным ребром в ортогональной аксонометрии. Коэффициенты искажения u, v, w
// по осям x, y, z связаны условием u² + v² + w² = 2, поэтому свободны только u и v. ----
draw Graph { name = "gCube"; graph = "gc"; nodeRadius = 0; labels = false; interactive = false; showWeights = false; edgeWidth = 2 }
draw Graph { name = "gAx"; graph = "ga"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
new Point { name = "PX"; pos = (0, 0); text = true("x"); dynamic = false; collision = false }
new Point { name = "PY"; pos = (0, 0); text = true("y"); dynamic = false; collision = false }
new Point { name = "PZ"; pos = (0, 0); text = true("z"); dynamic = false; collision = false }

new UI { name = "sU"; type = slider; label = "u (ось x)"; variable = u; min = 0.3; max = 0.99; step = 0.01; default = 0.94 }
new UI { name = "sV"; type = slider; label = "v (ось y)"; variable = v; min = max(0.3, sqrt(max(0, 1 - u * u))); max = min(0.99, sqrt(1.98 - u * u)); step = 0.01; default = 0.94 }
new UI { name = "bIso"; type = button; label = "Изометрия"; action = "u = 0.816; v = 0.816" }
new UI { name = "bDi"; type = button; label = "Диметрия"; action = "u = 0.94; v = 0.94" }
new UI { name = "bTri"; type = button; label = "Триметрия"; action = "u = 0.95; v = 0.5" }

float u = 0.94; float v = 0.94; float key = -1; string info = "";
float cp = 0; float sp = 0; float sn = 0; float w = 0; float e = 6; float ox = 0; float oy = 0;

Function px(x, y, z) { return ox + e * (x * cp - y * sp); }
Function py(x, y, z) { return oy + e * (z * w - sn * (x * sp + y * cp)); }
Function ang(ax, ay, bx, by) { return degrees(acos((ax * bx + ay * by) / sqrt((ax * ax + ay * ay) * (bx * bx + by * by)))); }
Function eq(a, b) { return abs(a - b) < 0.012; }

Update {
  if (key != u * 1000 + v) {
    key = u * 1000 + v;
    float w2 = max(2 - u * u - v * v, 0.0001);
    w = sqrt(w2);
    sp = sqrt(min(1, max(0, (1 - u * u) / w2)));
    cp = sqrt(1 - sp * sp);
    sn = sqrt(max(0, 1 - w2));
    ox = -e * (cp - sp) / 2; oy = -e * (w - sn * (sp + cp)) / 2;
    gc = newGraph();
    repeat (8) {
      float bx = i - 2 * floor(i / 2); float by = floor(i / 2) - 2 * floor(i / 4); float bz = floor(i / 4);
      addNode(gc, "n" + i, [px(bx, by, bz), py(bx, by, bz)]);
    }
    addEdge(gc, "n0", "n1"); addEdge(gc, "n2", "n3"); addEdge(gc, "n4", "n5"); addEdge(gc, "n6", "n7");
    addEdge(gc, "n0", "n2"); addEdge(gc, "n1", "n3"); addEdge(gc, "n4", "n6"); addEdge(gc, "n5", "n7");
    addEdge(gc, "n0", "n4"); addEdge(gc, "n1", "n5"); addEdge(gc, "n2", "n6"); addEdge(gc, "n3", "n7");
    ga = newGraph();
    addNode(ga, "o", [px(0, 0, 0), py(0, 0, 0)]);
    addNode(ga, "x", [px(1.3, 0, 0), py(1.3, 0, 0)]); addNode(ga, "y", [px(0, 1.3, 0), py(0, 1.3, 0)]); addNode(ga, "z", [px(0, 0, 1.3), py(0, 0, 1.3)]);
    addEdge(ga, "o", "x"); addEdge(ga, "o", "y"); addEdge(ga, "o", "z");
    PX.pos.x = px(1.42, 0, 0); PX.pos.y = py(1.42, 0, 0);
    PY.pos.x = px(0, 1.42, 0); PY.pos.y = py(0, 1.42, 0);
    PZ.pos.x = px(0, 0, 1.42); PZ.pos.y = py(0, 0, 1.42);
  }
  float w2 = w * w;
  float axy = ang(cp, -sp * sn, -sp, -cp * sn); float axz = ang(cp, -sp * sn, 0, w); float ayz = ang(-sp, -cp * sn, 0, w);
  string kind = "**Триметрия:** все три коэффициента различны.";
  if (eq(u, v) && eq(v, w)) { kind = "**Изометрия:** u = v = w = √(2/3) ≈ 0.816, все углы между осями 120°."; }
  else if (eq(u, v) || eq(v, w) || eq(u, w)) { kind = "**Диметрия:** два коэффициента равны, третий отличается."; }
  info = "**Аксонометрическая проекция** — параллельное проецирование на одну плоскость. Ребро куба вдоль оси x на чертеже равно u = " + format(u, 2) + " от истинного, вдоль y — v = " + format(v, 2) + ", вдоль z — w = " + format(w, 2) + ".\n\n**Связь коэффициентов:** u² + v² + w² = " + format(u * u, 2) + " + " + format(v * v, 2) + " + " + format(w2, 2) + " = " + format(u * u + v * v + w2, 2) + ". Независимы только два коэффициента.\n\nУглы между проекциями осей: (x, y) = " + format(axy, 1) + "°, (x, z) = " + format(axz, 1) + "°, (y, z) = " + format(ayz, 1) + "°.\n\n" + kind;
}
]
