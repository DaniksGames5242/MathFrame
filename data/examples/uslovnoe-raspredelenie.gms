[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Нормальная пара (X, Y): эллипсы — линии уровня совместной плотности (1σ и 2σ). Точка T задаёт
// значение X = x; вертикаль — «срез» при этом x. Оранжевая кривая, отложенная от вертикали вправо, —
// условная плотность Y при X = x, обычная тонкая — безусловная (маргинальная) плотность Y. ----
draw Graph { name = "gEl"; graph = "gel"; edgeColor = #3b82f6; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gRg"; graph = "grg"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 2 }
draw Graph { name = "gCd"; graph = "gcd"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gMg"; graph = "gmg"; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 7 }
draw Graph { name = "gSl"; graph = "gsl"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Text { name = "l1"; pos = (-9.6, 5.6); text = "условная плотность f(y | x)"; size = 0.9; align = left; color = #f59e0b }
draw Text { name = "l2"; pos = (-9.6, 4.9); text = "безусловная f₂(y)"; size = 0.9; align = left }
draw Text { name = "l3"; pos = (-9.6, 4.2); text = "линия E(Y | X = x)"; size = 0.9; align = left; color = #3b82f6 }
new Point { name = "T"; pos = (-2, -5.4); text = true("x"); pauseOnDrag = false; collision = false; color = #f59e0b }
new Point { name = "C"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }

new UI { name = "sR"; type = slider; label = "ρ"; variable = rho; min = -0.95; max = 0.95; step = 0.05; default = 0.7 }

// ---- Логика ----
float rho = 0.7; float key = -1; string info = "";
float sx = 2.2; float sy = 1.6;
Function num(x, d) { float v = x; if (abs(v) < 0.5 * pow(10, -d)) { v = 0; } if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Function nd(y, m, s) { float z = (y - m) / s; return exp(-z * z / 2) / (s * 2.5066283); }

Update {
  if (abs(T.pos.y + 5.4) > 0.0001) { T.pos.y = -5.4; }
  if (T.pos.x < -6) { T.pos.x = -6; } if (T.pos.x > 4.5) { T.pos.x = 4.5; }
  if (key != T.pos.x * 100 + rho * 13) {
    gel = newGraph(); grg = newGraph(); gcd = newGraph(); gmg = newGraph(); gsl = newGraph();
    float x0 = T.pos.x; float q = sqrt(1 - rho * rho);
    float cm = rho * sy / sx * x0; float cs = sy * q;
    addNode(gsl, "a", [-9.4, 0]); addNode(gsl, "b", [9.4, 0]); addEdge(gsl, "a", "b");
    addNode(gsl, "c", [0, -5.4]); addNode(gsl, "d", [0, 5.4]); addEdge(gsl, "c", "d");
    addNode(gsl, "e", [x0, -5.4]); addNode(gsl, "f", [x0, 5.4]); addEdge(gsl, "e", "f");
    repeat (65) {
      float th = 6.2831853 * i / 64; string s = format(i, 0);
      addNode(gel, "a" + s, [sx * cos(th), sy * (rho * cos(th) + q * sin(th))]);
      addNode(gel, "b" + s, [2 * sx * cos(th), 2 * sy * (rho * cos(th) + q * sin(th))]);
      if (i > 0) { addEdge(gel, "a" + format(i - 1, 0), "a" + s); addEdge(gel, "b" + format(i - 1, 0), "b" + s); }
    }
    addNode(grg, "a", [-6, rho * sy / sx * -6]); addNode(grg, "b", [6, rho * sy / sx * 6]); addEdge(grg, "a", "b");
    repeat (81) {
      float y = -5 + i * 0.125; string s = format(i, 0);
      addNode(gcd, "c" + s, [x0 + 4 * nd(y, cm, cs), y]);
      addNode(gmg, "m" + s, [x0 + 4 * nd(y, 0, sy), y]);
      if (i > 0) { addEdge(gcd, "c" + format(i - 1, 0), "c" + s); addEdge(gmg, "m" + format(i - 1, 0), "m" + s); }
    }
    C.pos.x = x0; C.pos.y = cm;
    info = "**Условное распределение** Y при X = x — распределение Y, когда X зафиксировано: f(y | x) = f(x, y) / f₁(x) (f₁ — плотность X), то есть срез совместной плотности по вертикали x = " + num(x0, 2) + ", пронормированный так, чтобы площадь под кривой была равна 1.\n\n";
    info = info + "**Для нормальной пары** оно тоже нормально: E(Y | X = x) = E Y + ρ·σ(Y)/σ(X)·(x − E X) = " + num(cm, 2) + " (точка на синей линии), D(Y | X = x) = σ²(Y)·(1 − ρ²) = " + format(cs * cs, 3) + " против безусловной D(Y) = " + format(sy * sy, 3) + ". Условная дисперсия от x не зависит, а с ростом |ρ| уменьшается: знание X сужает Y.\n\n";
    info = info + "При ρ = " + num(rho, 2) + " условное среднее ";
    if (abs(rho) < 0.025) { info = info + "не зависит от x и условное распределение совпадает с безусловным — величины независимы."; }
    if (abs(rho) >= 0.025) { info = info + "смещается вместе с x, и условное распределение отличается от безусловного — величины зависимы."; }
    key = T.pos.x * 100 + rho * 13;
  }
}
]
