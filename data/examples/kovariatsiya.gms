[
description = "{info}"

field width = 16; field height = 10;
camera type = fixed;

// ---- Восемь равновероятных точек (xᵢ, yᵢ) — совместное распределение пары (X, Y). Зелёный крест — средние (E X, E Y).
// Прямоугольник каждой точки со сторонами |x − E X| и |y − E Y| — площадь произведения отклонений:
// синий, если знаки отклонений одинаковы (+), оранжевый, если разные (−). Ковариация — средняя «знаковая площадь». ----
new Point { name = "P1"; pos = (-5.5, -3); pauseOnDrag = false }
new Point { name = "P2"; pos = (-4, -1.2); pauseOnDrag = false }
new Point { name = "P3"; pos = (-2.5, -2); pauseOnDrag = false }
new Point { name = "P4"; pos = (-0.8, 0.5); pauseOnDrag = false }
new Point { name = "P5"; pos = (0.8, -0.5); pauseOnDrag = false }
new Point { name = "P6"; pos = (2.5, 1.8); pauseOnDrag = false }
new Point { name = "P7"; pos = (4.2, 2.6); pauseOnDrag = false }
new Point { name = "P8"; pos = (5.6, 3.7); pauseOnDrag = false }
new Point { name = "M"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e; text = true("E X, E Y") }
draw Graph { name = "gP"; graph = "gp"; edgeColor = #3b82f6; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "gN"; graph = "gn"; edgeColor = #f59e0b; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "gX"; graph = "gx"; edgeColor = #22c55e; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
new UI { name = "sA"; type = slider; label = "множитель a у Y"; variable = ka; min = -3; max = 3; step = 0.5; default = 2 }

// ---- Логика ----
float ka = 2; float key = -1; string info = "";
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function px(k) { if (k == 0) { return P1.pos.x; } if (k == 1) { return P2.pos.x; } if (k == 2) { return P3.pos.x; } if (k == 3) { return P4.pos.x; } if (k == 4) { return P5.pos.x; } if (k == 5) { return P6.pos.x; } if (k == 6) { return P7.pos.x; } if (k == 7) { return P8.pos.x; } return 0; }
Function py(k) { if (k == 0) { return P1.pos.y; } if (k == 1) { return P2.pos.y; } if (k == 2) { return P3.pos.y; } if (k == 3) { return P4.pos.y; } if (k == 4) { return P5.pos.y; } if (k == 5) { return P6.pos.y; } if (k == 6) { return P7.pos.y; } if (k == 7) { return P8.pos.y; } return 0; }
Function rect(g, k, x, y, mx, my) {
  string a = "a" + format(k, 0); string b = "b" + format(k, 0); string c = "c" + format(k, 0); string d = "d" + format(k, 0);
  addNode(g, a, [x, y]); addNode(g, b, [mx, y]); addNode(g, c, [mx, my]); addNode(g, d, [x, my]);
  addEdge(g, a, b); addEdge(g, b, c); addEdge(g, c, d); addEdge(g, d, a); return 0;
}

Update {
  float k2 = ka; repeat (8) { k2 = k2 * 1.0137 + px(i) * (i + 3) + py(i) * (i + 7.3); }
  if (k2 != key) {
    key = k2;
    float mx = 0; float my = 0; repeat (8) { mx = mx + px(i) / 8; my = my + py(i) / 8; }
    if (abs(M.pos.x - mx) > 0.0001 || abs(M.pos.y - my) > 0.0001) { M.pos.x = mx; M.pos.y = my; }
    gp = newGraph(); gn = newGraph(); gx = newGraph();
    float cov = 0; float exy = 0; float vx = 0; float vy = 0; float sp = 0; float sn = 0;
    repeat (8) {
      float dx = px(i) - mx; float dy = py(i) - my; float t = dx * dy / 8;
      cov = cov + t; exy = exy + px(i) * py(i) / 8; vx = vx + dx * dx / 8; vy = vy + dy * dy / 8;
      if (t >= 0) { sp = sp + t; rect(gp, i, px(i), py(i), mx, my); } else { sn = sn - t; rect(gn, i, px(i), py(i), mx, my); }
    }
    addNode(gx, "h1", [-fieldMaxX - 0.5, my]); addNode(gx, "h2", [fieldMaxX + 0.5, my]); addEdge(gx, "h1", "h2");
    addNode(gx, "v1", [mx, -fieldMaxY - 0.5]); addNode(gx, "v2", [mx, fieldMaxY + 0.5]); addEdge(gx, "v1", "v2");
    info = "**Ковариация** Cov(X, Y) = E[(X − E X)(Y − E Y)] — среднее произведение отклонений от средних: положительна, если отклонения чаще одного знака, и отрицательна, если разных.\n\n";
    info = info + "**Здесь Cov(X, Y) = " + num(cov, 2) + ":** синие прямоугольники вносят +" + format(sp, 2) + ", оранжевые −" + format(sn, 2) + " (площадь каждого берётся с весом ⅛ — точки равновероятны).\n\n";
    info = info + "Вычислительная форма: E[XY] − E X·E Y = " + num(exy, 2) + " − (" + num(mx, 2) + ")·(" + num(my, 2) + ") = " + num(exy - mx * my, 2) + ". Cov(X, X) = D X = " + format(vx, 2) + ", D Y = " + format(vy, 2) + ", и |Cov(X, Y)| ≤ σₓ·σᵧ = " + format(sqrt(vx * vy), 2) + ".\n\n";
    info = info + "Ковариация симметрична и билинейна: Cov(Y, X) = Cov(X, Y), Cov(X, aY) = a·Cov(X, Y) = " + num(ka * cov, 2) + " при a = " + num(ka, 1) + " — она зависит от единиц измерения.";
  }
}
]
