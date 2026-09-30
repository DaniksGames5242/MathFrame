[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Группы наблюдений (цвет — группа; высота точки — значение, перетаскивается). Цветная горизонтальная черта —
// групповое среднее, серая — общее. Тонкие отрезки — отклонения внутри группы (SSW), слева от группы —
// отклонение группового среднего от общего (SSB). ----
float k = 3; float m = 4;
float xg = 0; float ssb = 0; float ssw = 0; float fv = 0; float pv = 1; float fc = 4.26;
float kk = -99;
string info = "";

draw Graph { name = "gW"; graph = "gw"; nodeRadius = 0; edgeWidth = 1.5; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gM"; graph = "gm"; nodeRadius = 0; edgeWidth = 4; edgeCap = butt; labels = false; interactive = false; showWeights = false; layer = 20 }
draw Graph { name = "gG"; graph = "gg"; nodeRadius = 0; edgeWidth = 1.5; edgeColor = #3b82f699; labels = false; interactive = false; showWeights = false; layer = 5 }
new Point { name = "P0"; pos = (-7.2, 3.52); pauseOnDrag = false; collideWithPoints = false; color = #3b82f6; active = k > 0.5 }
new Point { name = "P1"; pos = (-6.4, 1.54); pauseOnDrag = false; collideWithPoints = false; color = #3b82f6; active = k > 0.5 }
new Point { name = "P2"; pos = (-5.6, 2.64); pauseOnDrag = false; collideWithPoints = false; color = #3b82f6; active = k > 0.5 }
new Point { name = "P3"; pos = (-4.8, 4.62); pauseOnDrag = false; collideWithPoints = false; color = #3b82f6; active = k > 0.5 }
new Point { name = "P4"; pos = (-1.2, 0.88); pauseOnDrag = false; collideWithPoints = false; color = #f59e0b; active = k > 1.5 }
new Point { name = "P5"; pos = (-0.4, -1.10); pauseOnDrag = false; collideWithPoints = false; color = #f59e0b; active = k > 1.5 }
new Point { name = "P6"; pos = (0.4, 1.32); pauseOnDrag = false; collideWithPoints = false; color = #f59e0b; active = k > 1.5 }
new Point { name = "P7"; pos = (1.2, 0.22); pauseOnDrag = false; collideWithPoints = false; color = #f59e0b; active = k > 1.5 }
new Point { name = "P8"; pos = (4.8, -1.98); pauseOnDrag = false; collideWithPoints = false; color = #22c55e; active = k > 2.5 }
new Point { name = "P9"; pos = (5.6, 0.44); pauseOnDrag = false; collideWithPoints = false; color = #22c55e; active = k > 2.5 }
new Point { name = "P10"; pos = (6.4, -0.88); pauseOnDrag = false; collideWithPoints = false; color = #22c55e; active = k > 2.5 }
new Point { name = "P11"; pos = (7.2, -2.86); pauseOnDrag = false; collideWithPoints = false; color = #22c55e; active = k > 2.5 }

new UI { type = slider; label = "число групп k"; variable = k; min = 2; max = 3; step = 1; default = 3 }

Function cx(g) { return (g - (k - 1) / 2) * 6; }
Function gv(j) {
  if (j == 0) { return P0.pos.y; }
  if (j == 1) { return P1.pos.y; }
  if (j == 2) { return P2.pos.y; }
  if (j == 3) { return P3.pos.y; }
  if (j == 4) { return P4.pos.y; }
  if (j == 5) { return P5.pos.y; }
  if (j == 6) { return P6.pos.y; }
  if (j == 7) { return P7.pos.y; }
  if (j == 8) { return P8.pos.y; }
  if (j == 9) { return P9.pos.y; }
  if (j == 10) { return P10.pos.y; }
  if (j == 11) { return P11.pos.y; }
  return 0;
}
Function col(g) { if (g == 0) { return "#3b82f6"; } if (g == 1) { return "#f59e0b"; } return "#22c55e"; }
Function mg0(g) { float s = 0; repeat (m) { s = s + gv(g * m + i); } return s / m; }
Update {
  if (k > 0.5) { if (abs(P0.pos.x - (cx(0) + (-1.2))) > 0.0001) { P0.pos.x = cx(0) + (-1.2); } if (P0.pos.y > fieldMaxY) { P0.pos.y = fieldMaxY; } if (P0.pos.y < -fieldMaxY) { P0.pos.y = -fieldMaxY; } }
  if (k > 0.5) { if (abs(P1.pos.x - (cx(0) + (-0.4))) > 0.0001) { P1.pos.x = cx(0) + (-0.4); } if (P1.pos.y > fieldMaxY) { P1.pos.y = fieldMaxY; } if (P1.pos.y < -fieldMaxY) { P1.pos.y = -fieldMaxY; } }
  if (k > 0.5) { if (abs(P2.pos.x - (cx(0) + (0.4))) > 0.0001) { P2.pos.x = cx(0) + (0.4); } if (P2.pos.y > fieldMaxY) { P2.pos.y = fieldMaxY; } if (P2.pos.y < -fieldMaxY) { P2.pos.y = -fieldMaxY; } }
  if (k > 0.5) { if (abs(P3.pos.x - (cx(0) + (1.2))) > 0.0001) { P3.pos.x = cx(0) + (1.2); } if (P3.pos.y > fieldMaxY) { P3.pos.y = fieldMaxY; } if (P3.pos.y < -fieldMaxY) { P3.pos.y = -fieldMaxY; } }
  if (k > 1.5) { if (abs(P4.pos.x - (cx(1) + (-1.2))) > 0.0001) { P4.pos.x = cx(1) + (-1.2); } if (P4.pos.y > fieldMaxY) { P4.pos.y = fieldMaxY; } if (P4.pos.y < -fieldMaxY) { P4.pos.y = -fieldMaxY; } }
  if (k > 1.5) { if (abs(P5.pos.x - (cx(1) + (-0.4))) > 0.0001) { P5.pos.x = cx(1) + (-0.4); } if (P5.pos.y > fieldMaxY) { P5.pos.y = fieldMaxY; } if (P5.pos.y < -fieldMaxY) { P5.pos.y = -fieldMaxY; } }
  if (k > 1.5) { if (abs(P6.pos.x - (cx(1) + (0.4))) > 0.0001) { P6.pos.x = cx(1) + (0.4); } if (P6.pos.y > fieldMaxY) { P6.pos.y = fieldMaxY; } if (P6.pos.y < -fieldMaxY) { P6.pos.y = -fieldMaxY; } }
  if (k > 1.5) { if (abs(P7.pos.x - (cx(1) + (1.2))) > 0.0001) { P7.pos.x = cx(1) + (1.2); } if (P7.pos.y > fieldMaxY) { P7.pos.y = fieldMaxY; } if (P7.pos.y < -fieldMaxY) { P7.pos.y = -fieldMaxY; } }
  if (k > 2.5) { if (abs(P8.pos.x - (cx(2) + (-1.2))) > 0.0001) { P8.pos.x = cx(2) + (-1.2); } if (P8.pos.y > fieldMaxY) { P8.pos.y = fieldMaxY; } if (P8.pos.y < -fieldMaxY) { P8.pos.y = -fieldMaxY; } }
  if (k > 2.5) { if (abs(P9.pos.x - (cx(2) + (-0.4))) > 0.0001) { P9.pos.x = cx(2) + (-0.4); } if (P9.pos.y > fieldMaxY) { P9.pos.y = fieldMaxY; } if (P9.pos.y < -fieldMaxY) { P9.pos.y = -fieldMaxY; } }
  if (k > 2.5) { if (abs(P10.pos.x - (cx(2) + (0.4))) > 0.0001) { P10.pos.x = cx(2) + (0.4); } if (P10.pos.y > fieldMaxY) { P10.pos.y = fieldMaxY; } if (P10.pos.y < -fieldMaxY) { P10.pos.y = -fieldMaxY; } }
  if (k > 2.5) { if (abs(P11.pos.x - (cx(2) + (1.2))) > 0.0001) { P11.pos.x = cx(2) + (1.2); } if (P11.pos.y > fieldMaxY) { P11.pos.y = fieldMaxY; } if (P11.pos.y < -fieldMaxY) { P11.pos.y = -fieldMaxY; } }
  float key = 100 * k; repeat (k * m) { key = key * 1.3 + gv(i); }
  if (kk != key) {
    gw = newGraph(); gm = newGraph(); gg = newGraph();
    float tot = 0; repeat (k * m) { tot = tot + gv(i); }
    xg = tot / (k * m);
    ssb = 0; ssw = 0;
    repeat (k) {
      float g = i; float mg = mg0(g); string gs = format(g, 0);
      ssb = ssb + m * (mg - xg) * (mg - xg);
      addNode(gm, "a" + gs, [cx(g) - 2.2, mg]); addNode(gm, "b" + gs, [cx(g) + 2.2, mg]); addEdge(gm, "a" + gs, "b" + gs, 1, col(g));
      addNode(gm, "c" + gs, [cx(g) - 2.9, xg]); addNode(gm, "d" + gs, [cx(g) - 2.9, mg]); addEdge(gm, "c" + gs, "d" + gs, 1, col(g));
      repeat (m) {
        float v = gv(g * m + i); string id = gs + format(i, 0); float px = cx(g) - 1.2 + 0.8 * i;
        ssw = ssw + (v - mg) * (v - mg);
        addNode(gw, "p" + id, [px, v]); addNode(gw, "q" + id, [px, mg]); addEdge(gw, "p" + id, "q" + id, 1, col(g));
      }
    }
    addNode(gg, "g1", [-10, xg]); addNode(gg, "g2", [10, xg]); addEdge(gg, "g1", "g2");
    fv = (ssb / (k - 1)) / (max(ssw, 0.0001) / (k * m - k));
    fc = fQuantile(0.95, k - 1, k * m - k);
    pv = 1 - fCdf(fv, k - 1, k * m - k);
    kk = key;
  }
  info = "**Однофакторный дисперсионный анализ** проверяет H₀: средние всех k = **" + format(k, 0) + "** групп (в каждой по m = 4 наблюдения) равны. Общая изменчивость раскладывается на межгрупповую и внутригрупповую: **SST = SSB + SSW** = " + format(ssb, 2) + " + " + format(ssw, 2) + " = **" + format(ssb + ssw, 2) + "**.\n\n";
  info = info + "Средние квадраты: MSB = SSB/(k − 1) = **" + format(ssb / (k - 1), 2) + "**, MSW = SSW/(N − k) = **" + format(ssw / (k * m - k), 2) + "**. **F = MSB / MSW = " + format(fv, 2) + "** с (" + format(k - 1, 0) + "; " + format(k * m - k, 0) + ") степенями свободы; p = **" + format(pv, 4) + "**, критическое значение при α = 0.05: **" + format(fc, 2) + "**.\n\n";
  if (fv >= fc) { info = info + "F ≥ " + format(fc, 2) + ": межгрупповая вариация выше ожидаемой случайной — H₀ **отвергается**."; }
  if (fv < fc) { info = info + "F < " + format(fc, 2) + ": различия средних сравнимы со случайным разбросом — H₀ **не отвергается**."; }
  info = info + " Все k средних проверяются одной процедурой, без множества попарных t-критериев.";
}
]
