[
description = "{info}"

field width = 20;
field height = 9;
camera type = fixed;

// Выборка из 9 значений: целые 0…10, точки стоят стопками над осью. Три меры центра — на строках ниже:
// среднее (жёлтая), медиана (зелёная), мода (синяя). Точка c проверяет свойства мер:
// среднее минимизирует Σ(xᵢ − c)², медиана — Σ|xᵢ − c|.
float y0 = 0.2; float pc = 0; string info = "";
draw Graph { name = "gAx"; graph = "gx"; nodeRadius = 0; edgeWidth = 1; labels = false; interactive = false; showWeights = false; edgeColor = #3b82f688 }
new Point { name = "P1"; pos = (-7.2, 0.2); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "P2"; pos = (-5.4, 0.2); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "P3"; pos = (-5.4, 0.2); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "P4"; pos = (-5.4, 0.2); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "P5"; pos = (-3.6, 0.2); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "P6"; pos = (-1.8, 0.2); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "P7"; pos = (0.0, 0.2); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "P8"; pos = (5.4, 0.2); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "P9"; pos = (9.0, 0.2); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "C"; pos = (0, -0.6); pauseOnDrag = false; collideWithPoints = false; color = #f59e0b; active = showC > 0.5 }
new Point { name = "M1"; pos = (0, -2.1); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "M2"; pos = (0, -2.6); dynamic = false; collision = false; color = #22c55e }
new Point { name = "M3"; pos = (0, -3.1); dynamic = false; collision = false; color = #3b82f6 }
draw Text { name = "t0"; pos = (-9.0, -1.25); text = "0"; size = 0.9 }
draw Text { name = "t1"; pos = (-7.2, -1.25); text = "1"; size = 0.9 }
draw Text { name = "t2"; pos = (-5.4, -1.25); text = "2"; size = 0.9 }
draw Text { name = "t3"; pos = (-3.6, -1.25); text = "3"; size = 0.9 }
draw Text { name = "t4"; pos = (-1.8, -1.25); text = "4"; size = 0.9 }
draw Text { name = "t5"; pos = (0.0, -1.25); text = "5"; size = 0.9 }
draw Text { name = "t6"; pos = (1.8, -1.25); text = "6"; size = 0.9 }
draw Text { name = "t7"; pos = (3.6, -1.25); text = "7"; size = 0.9 }
draw Text { name = "t8"; pos = (5.4, -1.25); text = "8"; size = 0.9 }
draw Text { name = "t9"; pos = (7.2, -1.25); text = "9"; size = 0.9 }
draw Text { name = "t10"; pos = (9.0, -1.25); text = "10"; size = 0.9 }
float showC = 0;
new UI { type = select; label = "проверка"; variable = showC; options = (0, 1); labels = ("без точки c", "точка c"); default = 0 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function cntv(vs, v) {
  float c = 0;
  repeat (9) { if (vs[i] == v) { c = c + 1; } }
  return c;
}
Function below(vs, k) {
  float c = 0;
  repeat (k) { if (vs[i] == vs[k]) { c = c + 1; } }
  return c;
}
Function modeOf(vs) { float best = -1; float bv = 0; repeat (11) { float c = cntv(vs, i); if (c > best) { best = c; bv = i; } } return bv; }
Function vv(x) { return min(10, max(0, round((x + 9) / 1.8))); }
Function place(P, v, r) { if (abs(P.pos.x - (1.8 * v - 9)) > 0.0001) { P.pos.x = 1.8 * v - 9; } float y = y0 + 0.5 * r; if (abs(P.pos.y - y) > 0.0001) { P.pos.y = y; } }
Update {
  list vs = [vv(P1.pos.x)];

  push(vs, vv(P2.pos.x));
  push(vs, vv(P3.pos.x));
  push(vs, vv(P4.pos.x));
  push(vs, vv(P5.pos.x));
  push(vs, vv(P6.pos.x));
  push(vs, vv(P7.pos.x));
  push(vs, vv(P8.pos.x));
  push(vs, vv(P9.pos.x));
  place(P1, vs[0], below(vs, 0));
  place(P2, vs[1], below(vs, 1));
  place(P3, vs[2], below(vs, 2));
  place(P4, vs[3], below(vs, 3));
  place(P5, vs[4], below(vs, 4));
  place(P6, vs[5], below(vs, 5));
  place(P7, vs[6], below(vs, 6));
  place(P8, vs[7], below(vs, 7));
  place(P9, vs[8], below(vs, 8));
  gx = newGraph(); addNode(gx, "a", [-9.6, -0.6]); addNode(gx, "b", [9.6, -0.6]); addEdge(gx, "a", "b");
  float mn = mean(vs); float md = median(vs); float mo = modeOf(vs);
  M1.pos.x = 1.8 * mn - 9; M2.pos.x = 1.8 * md - 9; M3.pos.x = 1.8 * mo - 9;
  M3.active = cntv(vs, mo) > 1;
  if (abs(C.pos.y + 0.6) > 0.0001) { C.pos.y = -0.6; }
  string m3s = "моды нет (все значения различны)";
  if (cntv(vs, mo) > 1) { m3s = "мода = **" + format(mo, 0) + "** (встречается " + format(cntv(vs, mo), 0) + " р.)"; }
  string sk = "Среднее совпадает с медианой.";
  if (mn > md + 0.005) { sk = "Среднее правее медианы: крупные значения тянут его вверх, а медиана и мода к ним устойчивы."; }
  if (mn < md - 0.005) { sk = "Среднее левее медианы: малые значения тянут его вниз, а медиана и мода к ним устойчивы."; }
  info = "**Меры центральной тенденции** выборки из 9 значений: среднее арифметическое = **" + format(mn, 2) + "** (жёлтая), медиана = **" + format(md, 1) + "** (зелёная), " + m3s + " (синяя). Меры не обязаны совпадать. " + sk;
  if (showC > 0.5) {
    float c = (C.pos.x + 9) / 1.8; float q2 = 0; float q1 = 0;
    repeat (9) { q2 = q2 + (vs[i] - c) * (vs[i] - c); q1 = q1 + abs(vs[i] - c); }
    info = info + "\n\nТочка c = **" + format(c, 2) + "**: Σ(xᵢ − c)² = **" + format(q2, 2) + "** (наименьшее " + format(9 * variance(vs), 2) + " — при c = среднему), Σ|xᵢ − c| = **" + format(q1, 2) + "**.";
  }
}
]