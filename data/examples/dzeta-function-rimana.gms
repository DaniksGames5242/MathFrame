[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Слева — плоскость s = σ + it (перетаскиваемая точка s), справа — плоскость значений ζ.
// Синяя кривая справа — образ вертикальной прямой Re = σ при t от 0 до 22,5; оранжевая — ζ(s). ----
draw Graph { name = "gAx"; graph = "gx"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 2 }
draw Graph { name = "gCrit"; graph = "gc"; edgeColor = #f59e0b; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gZ"; graph = "gz"; nodeColor = #22c55e; nodeRadius = 5; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "gCv"; graph = "gcv"; edgeColor = #3b82f6; edgeWidth = 2.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gV"; graph = "gv"; edgeColor = #f59e0b; edgeWidth = 2.5; nodeColor = #f59e0b; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Text { name = "tl"; pos = (-4.1, 4.85); text = "s = σ + it"; size = 1.0 }
draw Text { name = "tr"; pos = (4.0, 4.85); text = "ζ(s)"; size = 1.0 }
draw Text { name = "tc"; pos = (-3.05, -4.85); text = "σ = ½"; size = 0.8; color = #f59e0b }
draw Text { name = "t1"; pos = (-2.05, -4.85); text = "1"; size = 0.8 }
new Point { name = "S"; pos = (-3.07, 0.1); label = "s"; pauseOnDrag = false; collideWithPoints = false; color = #f59e0b }
new Point { name = "M"; pos = (-3.07, 0.1); dynamic = false; collision = false; label = "1 − s̄"; active = mAct > 0.5 }

// ---- Логика ----
float NT = 30;
list dk = [0]; list lg = [0];
float zr = 0; float zi = 0; float sg = 0.5; float tt = 12; float ck = -1; float sc = 0.5;
float mAct = 0; float ready = 0; string info = "";

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function sgn(x) { if (x < 0) { return "−"; } return "+"; }
Function px(s) { return -7.7 + (s + 4.4) * 7.2 / 7.4; }
Function py(t) { return -4.6 + (t + 1.5) * 9.2 / 24; }
// ζ(σ + it) по алгоритму Борвейна: результат в zr + i·zi
Function zeta(s0, t0) {
  float sr = 0; float si = 0;
  repeat (NT) {
    float w = (dk[i] - dk[NT]) * pow(i + 1, -s0) * (1 - 2 * (i - 2 * floor(i / 2)));
    sr = sr + w * cos(t0 * lg[i]); si = si - w * sin(t0 * lg[i]);
  }
  float q = pow(2, 1 - s0);
  float dr = 1 - q * cos(t0 * lg[1]); float di = q * sin(t0 * lg[1]);
  float m2 = dr * dr + di * di + 0.0000001;
  float f = -1 / dk[NT];
  zr = f * (sr * dr + si * di) / m2; zi = f * (si * dr - sr * di) / m2;
  return 0;
}

Update {
  if (ready < 0.5) {
    ready = 1;
    // коэффициенты d_k алгоритма Борвейна (d_0 = 1) и ln(k + 1)
    float tm = 1; float ac = 1; dk[0] = 1;
    repeat (NT) { tm = tm * (NT + i) * 4 * (NT - i) / ((2 * i + 1) * (2 * i + 2)); ac = ac + tm; push(dk, ac); }
    lg[0] = 0; repeat (NT) { push(lg, log(i + 2)); }
    gx = newGraph(); gc = newGraph(); gz = newGraph();
    addNode(gx, "a", [-7.7, -4.6]); addNode(gx, "b", [-0.5, -4.6]); addNode(gx, "c", [-0.5, 4.6]); addNode(gx, "d", [-7.7, 4.6]);
    addEdge(gx, "a", "b"); addEdge(gx, "b", "c"); addEdge(gx, "c", "d"); addEdge(gx, "d", "a");
    addNode(gx, "r1", [-7.7, py(0)]); addNode(gx, "r2", [-0.5, py(0)]); addEdge(gx, "r1", "r2");
    addNode(gx, "u1", [px(1), -4.6]); addNode(gx, "u2", [px(1), 4.6]); addEdge(gx, "u1", "u2");
    addNode(gx, "w1", [0.4, 0]); addNode(gx, "w2", [7.6, 0]); addEdge(gx, "w1", "w2");
    addNode(gx, "v1", [4, -4.5]); addNode(gx, "v2", [4, 4.5]); addEdge(gx, "v1", "v2");
    addNode(gc, "c1", [px(0.5), -4.6]); addNode(gc, "c2", [px(0.5), 4.6]); addEdge(gc, "c1", "c2");
    addNode(gz, "z1", [px(0.5), py(14.1347)]); addNode(gz, "z2", [px(0.5), py(21.022)]);
    addNode(gz, "z3", [px(-2), py(0)]); addNode(gz, "z4", [px(-4), py(0)]);
  }
  // граница точки s внутри левой панели
  if (S.pos.x < -7.55) { S.pos.x = -7.55; } if (S.pos.x > -0.65) { S.pos.x = -0.65; }
  if (S.pos.y < -4.45) { S.pos.y = -4.45; } if (S.pos.y > 4.45) { S.pos.y = 4.45; }
  float s0 = -4.4 + (S.pos.x + 7.7) * 7.4 / 7.2; float t0 = -1.5 + (S.pos.y + 4.6) * 24 / 9.2;
  float sq = round(s0 * 50) / 50;
  if (ck != sq) {
    ck = sq;
    gcv = newGraph();
    float mx = 0; float lx = 0; float ly = 0; float lin = 0;
    repeat (120) { zeta(sq, 22.5 * i / 119); if (zr * zr + zi * zi > mx) { mx = zr * zr + zi * zi; } }
    sc = 3.4 / min(max(sqrt(mx), 1.5), 6);
    repeat (120) {
      zeta(sq, 22.5 * i / 119);
      float ox = 4 + sc * zr; float oy = sc * zi; float ins = 0;
      if (sc * sc * (zr * zr + zi * zi) < 11.5) { ins = 1; }
      addNode(gcv, "k" + format(i, 0), [ox, oy]);
      if (i > 0 && ins > 0.5 && lin > 0.5) { addEdge(gcv, "k" + format(i - 1, 0), "k" + format(i, 0)); }
      lin = ins;
    }
  }
  zeta(s0, t0);
  float zre = zr; float zim = zi; float zm = sqrt(zre * zre + zim * zim);
  gv = newGraph();
  if (sc * zm < 3.45) { addNode(gv, "o", [4, 0]); addNode(gv, "z", [4 + sc * zre, sc * zim]); addEdge(gv, "o", "z"); }
  mAct = 0; float sm = 1 - s0;
  if (sm > -4.3 && sm < 2.9) { mAct = 1; M.pos.x = px(sm); M.pos.y = S.pos.y; }
  info = "**Дзета-функция Римана** ζ(s) = ∑ n⁻ˢ (n = 1, 2, …) при σ > 1; на остальной плоскости ζ — аналитическое продолжение с единственным простым полюсом s = 1.\n\n";
  info = info + "**Точка:** s = " + num(s0, 2) + " " + sgn(t0) + " " + format(abs(t0), 2) + "i; ζ(s) = " + num(zre, 3) + " " + sgn(zim) + " " + format(abs(zim), 3) + "i, |ζ(s)| = " + format(zm, 3) + ".\n\n";
  if (s0 > 2) {
    float pr = 0; float pi2 = 0;
    repeat (100) { pr = pr + pow(i + 1, -s0) * cos(t0 * log(i + 1)); pi2 = pi2 - pow(i + 1, -s0) * sin(t0 * log(i + 1)); }
    info = info + "При σ > 2 ряд сходится быстро: сумма первых 100 членов " + num(pr, 3) + " " + sgn(pi2) + " " + format(abs(pi2), 3) + "i.\n\n";
  }
  if (s0 > 1 && s0 <= 2) { info = info + "При 1 < σ ≤ 2 ряд ∑ n⁻ˢ сходится, но медленно.\n\n"; }
  if (s0 <= 1) { info = info + "При σ ≤ 1 ряд ∑ n⁻ˢ расходится, а значение ζ(s) получено аналитическим продолжением.\n\n"; }
  info = info + "**Нули:** тривиальные при s = −2, −4, … и нетривиальные в полосе 0 < σ < 1: ½ + 14,135i, ½ + 21,022i (зелёные) — они симметричны относительно прямой σ = ½ (точка 1 − s̄ — отражение s). На прямой σ = ½ синяя кривая проходит через начало координат при t, равных мнимым частям нулей.";
}
]
