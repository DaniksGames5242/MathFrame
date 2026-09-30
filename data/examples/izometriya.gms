[
description = "{info}"

field width = 22;
field height = 16;
camera type = fixed;

// ---- Изометрия: оси проецируются под углами 120°, коэффициент искажения k = √(2/3)
// по всем трём осям. Вкладка 1 — построение точки по координатам, вкладка 2 — куб
// и вписанные в его грани окружности (эллипсы). ----
draw Graph { name = "gAx"; graph = "ga"; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false }
new Point { name = "PX"; pos = (0, 0); text = true("x"); dynamic = false; collision = false }
new Point { name = "PY"; pos = (0, 0); text = true("y"); dynamic = false; collision = false }
new Point { name = "PZ"; pos = (0, 0); text = true("z"); dynamic = false; collision = false }

draw Graph { name = "gPath"; graph = "gp"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
new Point { name = "M"; pos = (0, 0); text = true("M"); dynamic = false; collision = false; color = #f59e0b }
new Claster { name = "tabPt"; elements = (gPath, M); active = true }

draw Graph { name = "gCube"; graph = "gc"; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false }
draw Graph { name = "gEl"; graph = "ge"; edgeColor = #3b82f6; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
new Claster { name = "tabCircle"; elements = (gCube, gEl); active = false }

new UI { name = "btnPt"; type = button; label = "Точка"; action = "tab = 1; tabPt.active = true; tabCircle.active = false" }
new UI { name = "btnCi"; type = button; label = "Окружности"; action = "tab = 2; tabPt.active = false; tabCircle.active = true" }
new UI { name = "sX"; type = slider; label = "x"; variable = cx; min = 0; max = 5; step = 0.5; default = 3 }
new UI { name = "sY"; type = slider; label = "y"; variable = cy; min = 0; max = 5; step = 0.5; default = 2 }
new UI { name = "sZ"; type = slider; label = "z"; variable = cz; min = 0; max = 5; step = 0.5; default = 4 }
new UI { name = "sA"; type = slider; label = "ребро куба a"; variable = ca; min = 1; max = 4.5; step = 0.5; default = 4 }

float tab = 1; float cx = 3; float cy = 2; float cz = 4; float ca = 4; float key = -1; float built = 0; string info = "";
float k = 0.8165;

Function px(x, y, z) { return k * 0.8660 * (x - y); }
Function py(x, y, z) { return k * (z - 0.5 * (x + y)) + 0.6; }

Update {
  if (built < 1) {
    ga = newGraph();
    addNode(ga, "o", [px(0, 0, 0), py(0, 0, 0)]);
    addNode(ga, "x", [px(6, 0, 0), py(6, 0, 0)]); addNode(ga, "y", [px(0, 6, 0), py(0, 6, 0)]); addNode(ga, "z", [px(0, 0, 6), py(0, 0, 6)]);
    addEdge(ga, "o", "x"); addEdge(ga, "o", "y"); addEdge(ga, "o", "z");
    PX.pos.x = px(6.5, 0, 0); PX.pos.y = py(6.5, 0, 0);
    PY.pos.x = px(0, 6.5, 0); PY.pos.y = py(0, 6.5, 0);
    PZ.pos.x = px(0, 0, 6.5); PZ.pos.y = py(0, 0, 6.5);
    built = 1;
  }
  if (tab == 1) {
    if (key != cx * 10000 + cy * 100 + cz) {
      key = cx * 10000 + cy * 100 + cz;
      gp = newGraph();
      addNode(gp, "o", [px(0, 0, 0), py(0, 0, 0)]); addNode(gp, "a", [px(cx, 0, 0), py(cx, 0, 0)]);
      addNode(gp, "b", [px(cx, cy, 0), py(cx, cy, 0)]); addNode(gp, "m", [px(cx, cy, cz), py(cx, cy, cz)]);
      addEdge(gp, "o", "a"); addEdge(gp, "a", "b"); addEdge(gp, "b", "m");
      M.pos.x = px(cx, cy, cz); M.pos.y = py(cx, cy, cz);
    }
    info = "**Изометрия.** Точка M(" + format(cx, 1) + "; " + format(cy, 1) + "; " + format(cz, 1) + ") строится ломаной от начала координат: по оси x откладывается " + format(cx, 1) + " · k = " + format(cx * k, 2) + ", затем параллельно y — " + format(cy, 1) + " · k = " + format(cy * k, 2) + ", затем параллельно z — " + format(cz, 1) + " · k = " + format(cz * k, 2) + ".\n\nВсе три коэффициента одинаковы: k = √(2/3) ≈ " + format(k, 4) + ", а проекции осей образуют углы по 120°, поэтому равные отрезки на разных осях выглядят равными.";
  }
  if (tab == 2) {
    if (key != ca) {
      key = ca;
      gc = newGraph();
      repeat (8) {
        float bx = i - 2 * floor(i / 2); float by = floor(i / 2) - 2 * floor(i / 4); float bz = floor(i / 4);
        addNode(gc, "n" + i, [px(bx * ca, by * ca, bz * ca), py(bx * ca, by * ca, bz * ca)]);
      }
      addEdge(gc, "n0", "n1"); addEdge(gc, "n2", "n3"); addEdge(gc, "n4", "n5"); addEdge(gc, "n6", "n7");
      addEdge(gc, "n0", "n2"); addEdge(gc, "n1", "n3"); addEdge(gc, "n4", "n6"); addEdge(gc, "n5", "n7");
      addEdge(gc, "n0", "n4"); addEdge(gc, "n1", "n5"); addEdge(gc, "n2", "n6"); addEdge(gc, "n3", "n7");
      ge = newGraph();
      float h = ca / 2;
      repeat (49) {
        float t = i * 6.2832 / 48;
        float c1 = h + h * cos(t); float s1 = h + h * sin(t);
        addNode(ge, "t" + i, [px(c1, s1, ca), py(c1, s1, ca)]);
        addNode(ge, "r" + i, [px(ca, c1, s1), py(ca, c1, s1)]);
        addNode(ge, "l" + i, [px(c1, ca, s1), py(c1, ca, s1)]);
        if (i > 0) { addEdge(ge, "t" + (i - 1), "t" + i); addEdge(ge, "r" + (i - 1), "r" + i); addEdge(ge, "l" + (i - 1), "l" + i); }
      }
    }
    info = "**Окружности в изометрии.** В каждую видимую грань куба с ребром a = " + format(ca, 1) + " вписана окружность диаметра d = a. Каждая проецируется в эллипс: большая ось равна d = " + format(ca, 1) + ", малая — d · k = " + format(ca * k, 2) + ".\n\nВсе три эллипса одинаковы и повёрнуты друг относительно друга на 60° и 120°: большая ось каждого перпендикулярна той оси, которой нет в плоскости окружности.";
  }
}
]
