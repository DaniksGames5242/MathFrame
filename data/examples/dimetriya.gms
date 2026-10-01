[
description = "{info}"

field width = 22;
field height = 16;
camera type = fixed;

// ---- Диметрия: u = v, третий коэффициент w свободен, а u выражается из u² + v² + w² = 2.
// Куб с единичным ребром и окружность, вписанная в его верхнюю грань. ----
draw Graph { name = "gCube"; graph = "gc"; nodeRadius = 0; labels = false; interactive = false; showWeights = false; edgeWidth = 2 }
draw Graph { name = "gAx"; graph = "ga"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gEl"; graph = "ge"; edgeColor = #3b82f6; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
new Point { name = "PX"; pos = (0, 0); text = true("x"); dynamic = false; collision = false }
new Point { name = "PY"; pos = (0, 0); text = true("y"); dynamic = false; collision = false }
new Point { name = "PZ"; pos = (0, 0); text = true("z"); dynamic = false; collision = false }

new UI { name = "sW"; type = slider; label = "w (ось z)"; variable = w; min = 0.1; max = 0.99; step = 0.01; default = 0.47 }
new UI { name = "bTyp"; type = button; label = "w = 0,47 (типовая диметрия)"; action = "w = 0.47" }
new UI { name = "bIso"; type = button; label = "w = 0,82 (изометрия)"; action = "w = 0.82" }

float w = 0.47; float key = -1; string info = "";
float u = 0; float cp = 0.7071; float sp = 0.7071; float sn = 0; float e = 6; float ox = 0; float oy = 0;

Function px(x, y, z) { return ox + e * (x * cp - y * sp); }
Function py(x, y, z) { return oy + e * (z * w - sn * (x * sp + y * cp)); }
Function ang(ax, ay, bx, by) { return degrees(acos((ax * bx + ay * by) / sqrt((ax * ax + ay * ay) * (bx * bx + by * by)))); }

Update {
  if (key != w) {
    key = w;
    u = sqrt((2 - w * w) / 2);
    sn = sqrt(1 - w * w);
    ox = 0; oy = -e * (w - sn * 1.4142) / 2;
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
    ge = newGraph();
    repeat (49) {
      float t = i * 6.2832 / 48;
      addNode(ge, "e" + i, [px(0.5 + 0.5 * cos(t), 0.5 + 0.5 * sin(t), 1), py(0.5 + 0.5 * cos(t), 0.5 + 0.5 * sin(t), 1)]);
      if (i > 0) { addEdge(ge, "e" + (i - 1), "e" + i); }
    }
    PX.pos.x = px(1.42, 0, 0); PX.pos.y = py(1.42, 0, 0);
    PY.pos.x = px(0, 1.42, 0); PY.pos.y = py(0, 1.42, 0);
    PZ.pos.x = px(0, 0, 1.42); PZ.pos.y = py(0, 0, 1.42);
  }
  float axy = ang(cp, -sp * sn, -sp, -cp * sn); float axz = ang(cp, -sp * sn, 0, w);
  string kind = "";
  if (abs(w - u) < 0.012) { kind = "\n\nПри w = u все три коэффициента равны: это уже **изометрия**."; }
  info = "**Диметрия** — два коэффициента искажения равны: u = v = " + format(u, 2) + ", третий w = " + format(w, 2) + " отличается.\n\n**Связь:** 2u² + w² = 2 · " + format(u * u, 3) + " + " + format(w * w, 3) + " = " + format(2 * u * u + w * w, 2) + ". Задав w, получаем u = √((2 − w²)/2).\n\n**Углы между проекциями осей:** (x, y) = " + format(axy, 1) + "°, (x, z) = (y, z) = " + format(axz, 1) + "°; сумма " + format(axy + 2 * axz, 0) + "°. При w = 0,47 они равны 97,1° и 131,4°.\n\n**Окружность** на верхней грани (в плоскости осей x, y) проецируется в эллипс: большая ось равна диаметру d, малая — d · w = " + format(w, 2) + " d." + kind;
}
]
