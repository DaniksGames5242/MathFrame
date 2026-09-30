[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Верхняя ось — выборка x₁…x₈ (точки перетаскиваются), значения от −5 до 5, H₀: медиана равна 0. Нижняя — та же выборка
// после монотонного нечётного преобразования g(x) = 5·sign(x)·(|x|/5)ᵖ. Синие — положительные значения, жёлтые — отрицательные. ----
float yR = 3; float yT = -3; float pw = 0.6; float n = 8;
float t1 = 0; float t2 = 0; float s1 = 0; float s2 = 0; float w1 = 0; float w2 = 0;
float kk = -99;
string info = "";

draw Graph { name = "gP"; graph = "gp"; nodeRadius = 7; nodeColor = #3b82f6; labels = false; interactive = false; showWeights = false; layer = 20 }
draw Graph { name = "gN"; graph = "gn"; nodeRadius = 7; nodeColor = #f59e0b; labels = false; interactive = false; showWeights = false; layer = 20 }
draw Graph { name = "gA"; graph = "ga"; nodeRadius = 0; edgeWidth = 1; edgeColor = #3b82f677; labels = false; interactive = false; showWeights = false; layer = 5 }
new Point { name = "P0"; pos = (2.8, 3); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "P1"; pos = (1.2, 3); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "P2"; pos = (4.4, 3); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "P3"; pos = (-1.6, 3); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "P4"; pos = (2, 3); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "P5"; pos = (6.2, 3); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "P6"; pos = (-0.6, 3); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "P7"; pos = (3.6, 3); pauseOnDrag = false; collideWithPoints = false }
draw Text { name = "lx"; pos = (-9.6, yR + 0.8); text = "x"; size = 0.95; align = left }
draw Text { name = "lg"; pos = (-9.6, yT + 0.8); text = "g(x)"; size = 0.95; align = left }
draw Text { name = "z1"; pos = (0, yR - 0.7); text = "0"; size = 0.75 }
draw Text { name = "z2"; pos = (0, yT - 0.7); text = "0"; size = 0.75 }

new UI { type = slider; label = "степень p в g(x)"; variable = pw; min = 0.3; max = 3; step = 0.1; default = 0.6 }

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function gv(k) {
  if (k == 0) { return P0.pos.x / 2; }
  if (k == 1) { return P1.pos.x / 2; }
  if (k == 2) { return P2.pos.x / 2; }
  if (k == 3) { return P3.pos.x / 2; }
  if (k == 4) { return P4.pos.x / 2; }
  if (k == 5) { return P5.pos.x / 2; }
  if (k == 6) { return P6.pos.x / 2; }
  if (k == 7) { return P7.pos.x / 2; }
  return 0;
}
Function gt(k) { float v = gv(k); if (v < 0) { return -5 * pow(-v / 5, pw); } return 5 * pow(v / 5, pw); }
// ранг |значения| (mode 0 — исходные, 1 — преобразованные)
Function rk(j, md) { float r = 1; repeat (n) { float a = abs(gv(i)); float b = abs(gv(j)); if (md == 1) { a = abs(gt(i)); b = abs(gt(j)); } if (a < b) { r = r + 1; } if (a == b) { if (i < j) { r = r + 1; } } } return r; }
Function val(j, md) { if (md == 1) { return gt(j); } return gv(j); }
Function tst(md) { float sm = 0; repeat (n) { sm = sm + val(i, md); } float mn = sm / n; float ss = 0; repeat (n) { ss = ss + (val(i, md) - mn) * (val(i, md) - mn); } float sd = sqrt(ss / (n - 1)); if (sd < 0.02) { sd = 0.02; } return mn / (sd / sqrt(n)); }
Function sgn(md) { float c = 0; repeat (n) { if (val(i, md) > 0) { c = c + 1; } } return c; }
Function wil(md) { float c = 0; repeat (n) { if (val(i, md) > 0) { c = c + rk(i, md); } } return c; }
Update {
  if (abs(P0.pos.y - yR) > 0.0001) { P0.pos.y = yR; }
  if (P0.pos.x > fieldMaxX) { P0.pos.x = fieldMaxX; }
  if (P0.pos.x < -fieldMaxX) { P0.pos.x = -fieldMaxX; }
  if (abs(P1.pos.y - yR) > 0.0001) { P1.pos.y = yR; }
  if (P1.pos.x > fieldMaxX) { P1.pos.x = fieldMaxX; }
  if (P1.pos.x < -fieldMaxX) { P1.pos.x = -fieldMaxX; }
  if (abs(P2.pos.y - yR) > 0.0001) { P2.pos.y = yR; }
  if (P2.pos.x > fieldMaxX) { P2.pos.x = fieldMaxX; }
  if (P2.pos.x < -fieldMaxX) { P2.pos.x = -fieldMaxX; }
  if (abs(P3.pos.y - yR) > 0.0001) { P3.pos.y = yR; }
  if (P3.pos.x > fieldMaxX) { P3.pos.x = fieldMaxX; }
  if (P3.pos.x < -fieldMaxX) { P3.pos.x = -fieldMaxX; }
  if (abs(P4.pos.y - yR) > 0.0001) { P4.pos.y = yR; }
  if (P4.pos.x > fieldMaxX) { P4.pos.x = fieldMaxX; }
  if (P4.pos.x < -fieldMaxX) { P4.pos.x = -fieldMaxX; }
  if (abs(P5.pos.y - yR) > 0.0001) { P5.pos.y = yR; }
  if (P5.pos.x > fieldMaxX) { P5.pos.x = fieldMaxX; }
  if (P5.pos.x < -fieldMaxX) { P5.pos.x = -fieldMaxX; }
  if (abs(P6.pos.y - yR) > 0.0001) { P6.pos.y = yR; }
  if (P6.pos.x > fieldMaxX) { P6.pos.x = fieldMaxX; }
  if (P6.pos.x < -fieldMaxX) { P6.pos.x = -fieldMaxX; }
  if (abs(P7.pos.y - yR) > 0.0001) { P7.pos.y = yR; }
  if (P7.pos.x > fieldMaxX) { P7.pos.x = fieldMaxX; }
  if (P7.pos.x < -fieldMaxX) { P7.pos.x = -fieldMaxX; }
  float key = 1000 * pw; repeat (n) { key = key * 1.3 + gv(i); }
  if (kk != key) {
    gp = newGraph(); gn = newGraph(); ga = newGraph();
    addNode(ga, "l", [-10, yR]); addNode(ga, "r", [10, yR]); addEdge(ga, "l", "r");
    addNode(ga, "l2", [-10, yT]); addNode(ga, "r2", [10, yT]); addEdge(ga, "l2", "r2");
    addNode(ga, "z1", [0, yR - 0.25]); addNode(ga, "z2", [0, yR + 0.25]); addEdge(ga, "z1", "z2");
    addNode(ga, "z3", [0, yT - 0.25]); addNode(ga, "z4", [0, yT + 0.25]); addEdge(ga, "z3", "z4");
    repeat (n) {
      string id = format(i, 0); float x1 = 2 * gv(i); float x2 = 2 * gt(i);
      addNode(ga, "u" + id, [x1, yR]); addNode(ga, "d" + id, [x2, yT]); addEdge(ga, "u" + id, "d" + id);
      if (x2 > 0) { addNode(gp, "q" + id, [x2, yT]); }
      if (x2 <= 0) { addNode(gn, "q" + id, [x2, yT]); }
    }
    t1 = tst(0); t2 = tst(1); s1 = sgn(0); s2 = sgn(1); w1 = wil(0); w2 = wil(1);
    kk = key;
  }
  info = "**Непараметрические критерии** опираются не на величины наблюдений, а на знаки и ранги. Здесь H₀: медиана выборки x₁…x₈ равна 0; нижняя ось — та же выборка после возрастающего преобразования g(x) = 5·sign(x)·(|x|/5)ᵖ, p = **" + format(pw, 1) + "**.\n\n";
  info = info + "Исходные данные: t = **" + num(t1, 2) + "**, число плюсов S⁺ = **" + format(s1, 0) + "**, сумма рангов положительных W⁺ = **" + format(w1, 0) + "**. После преобразования: t = **" + num(t2, 2) + "**, S⁺ = **" + format(s2, 0) + "**, W⁺ = **" + format(w2, 0) + "**.\n\n";
  info = info + "Знаки и ранги при монотонном преобразовании не меняются — значит, не меняются и основанные на них критерии (знаков, Уилкоксона): **инвариантность**. Параметрическая t-статистика от преобразования зависит. Сильный выброс сильно сдвигает t и s, но меняет S⁺ не более чем на 1 — **робастность**; цена — меньшая мощность, когда данные нормальны, ведь величины отброшены.";
}
]
