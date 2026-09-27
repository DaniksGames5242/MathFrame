[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Слева — матрица выигрышей (очки игрока A / игрока B). Справа — турнир «каждый с каждым»
// (включая с самим собой): средний выигрыш за раунд. Внизу — первые 40 ходов матча A против B
// (зелёный — сотрудничать, красный — предать). ----
draw Graph { name = "gBars"; graph = "gbar"; edgeColor = #3b82f6; edgeWidth = 20; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gBarsA"; graph = "gba"; edgeColor = #f59e0b; edgeWidth = 20; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 11 }
draw Graph { name = "gC"; graph = "gcc"; nodeColor = #22c55e; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 20 }
draw Graph { name = "gD"; graph = "gdd"; nodeColor = #ef4444; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 20 }
new Point { name = "Z0"; pos = (0.6, -1.9); dynamic = false; collision = false; active = false }
new Point { name = "Z1"; pos = (7.8, -1.9); dynamic = false; collision = false; active = false }
new Line { name = "base"; pos = (Z0, Z1); thickness = 1; interact = false }
draw Text { name = "hdr"; pos = (-4.3, 4.3); text = "B: сотрудничать    B: предать"; size = 1 }
draw Text { name = "m1"; pos = (-7.1, 3.3); text = "A: сотр."; size = 1 }
draw Text { name = "m2"; pos = (-7.1, 1.9); text = "A: предать"; size = 1 }
draw Text { name = "p11"; pos = (-4.9, 3.3); text = "3 / 3"; size = 1.4; color = #22c55e }
draw Text { name = "p12"; pos = (-2.4, 3.3); text = "0 / 5"; size = 1.4 }
draw Text { name = "p21"; pos = (-4.9, 1.9); text = "5 / 0"; size = 1.4 }
draw Text { name = "p22"; pos = (-2.4, 1.9); text = "1 / 1"; size = 1.4; color = #ef4444 }
draw Text { name = "tt"; pos = (4.2, 4.3); text = "турнир: очков за раунд в среднем"; size = 1 }
draw Text { name = "ra"; pos = (-7.5, -3.3); text = "A"; size = 1.1 }
draw Text { name = "rb"; pos = (-7.5, -4.1); text = "B"; size = 1.1 }
draw Text { name = "bl0"; pos = (bx(0), -2.3); text = "C всегда"; size = 0.75 }
draw Text { name = "bv0"; pos = (bx(0), avg[0] * 1.2 - 1.9 + 0.3); text = format(avg[0], 2); size = 0.8 }
draw Text { name = "bl1"; pos = (bx(1), -2.75); text = "D всегда"; size = 0.75 }
draw Text { name = "bv1"; pos = (bx(1), avg[1] * 1.2 - 1.9 + 0.3); text = format(avg[1], 2); size = 0.8 }
draw Text { name = "bl2"; pos = (bx(2), -2.3); text = "око за око"; size = 0.75 }
draw Text { name = "bv2"; pos = (bx(2), avg[2] * 1.2 - 1.9 + 0.3); text = format(avg[2], 2); size = 0.8 }
draw Text { name = "bl3"; pos = (bx(3), -2.75); text = "злопамятный"; size = 0.75 }
draw Text { name = "bv3"; pos = (bx(3), avg[3] * 1.2 - 1.9 + 0.3); text = format(avg[3], 2); size = 0.8 }
draw Text { name = "bl4"; pos = (bx(4), -2.3); text = "Павлов"; size = 0.75 }
draw Text { name = "bv4"; pos = (bx(4), avg[4] * 1.2 - 1.9 + 0.3); text = format(avg[4], 2); size = 0.8 }
draw Text { name = "bl5"; pos = (bx(5), -2.75); text = "случайный"; size = 0.75 }
draw Text { name = "bv5"; pos = (bx(5), avg[5] * 1.2 - 1.9 + 0.3); text = format(avg[5], 2); size = 0.8 }
draw Text { name = "bl6"; pos = (bx(6), -2.3); text = "великодушный"; size = 0.75 }
draw Text { name = "bv6"; pos = (bx(6), avg[6] * 1.2 - 1.9 + 0.3); text = format(avg[6], 2); size = 0.8 }

new UI { name = "sN"; type = slider; label = "раундов"; variable = N; min = 1; max = 200; step = 1; default = 100 }
new UI { name = "sE"; type = slider; label = "шум, %"; variable = noise; min = 0; max = 10; step = 1; default = 0 }
new UI { name = "sA"; type = select; label = "A"; variable = sa; options = (0, 1, 2, 3, 4, 5, 6); labels = ("всегда сотрудничать", "всегда предавать", "око за око", "злопамятный", "Павлов", "случайный", "великодушное око за око"); default = 2 }
new UI { name = "sB"; type = select; label = "B"; variable = sb; options = (0, 1, 2, 3, 4, 5, 6); labels = ("всегда сотрудничать", "всегда предавать", "око за око", "злопамятный", "Павлов", "случайный", "великодушное око за око"); default = 1 }

// ---- Логика ----
float N = 100; float noise = 0; float sa = 2; float sb = 1;
float key = -1;
float seed = 1;
float scA = 0; float scB = 0;
list avg = (0, 0, 0, 0, 0, 0, 0);
list tot = (0, 0, 0, 0, 0, 0, 0);
list mvA = (-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1);
list mvB = (-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1);
string info = "";

Function md(a, m) { return a - floor(a / m) * m; }
// Псевдослучайные числа с фиксированным зерном — чтобы турнир не «дрожал» от кадра к кадру
Function rnd() { seed = md(seed * 16807, 2147483647); return seed / 2147483647; }
Function bx(k) { return 1.1 + 1.0 * k; }
// Ход стратегии s (1 — сотрудничать, 0 — предать): my/op — прошлые ходы, bad — соперник уже предавал, t — номер раунда
Function move(s, my, op, bad, t) {
  if (s == 0) { return 1; }
  if (s == 1) { return 0; }
  if (t == 0) { if (s == 5) { if (rnd() < 0.5) { return 1; } return 0; } return 1; }
  if (s == 2) { return op; }
  if (s == 3) { if (bad == 1) { return 0; } return 1; }
  if (s == 4) { if (my == op) { return 1; } return 0; }
  if (s == 5) { if (rnd() < 0.5) { return 1; } return 0; }
  if (op == 1) { return 1; } if (rnd() < 0.33) { return 1; } return 0;
}
Function fname(s) {
  if (s == 0) { return "всегда сотрудничать"; }
  if (s == 1) { return "всегда предавать"; }
  if (s == 2) { return "око за око"; }
  if (s == 3) { return "злопамятный"; }
  if (s == 4) { return "Павлов"; }
  if (s == 5) { return "случайный"; }
  if (s == 6) { return "великодушное око за око"; }
  return "";
}
Function pay(a, b) { if (a == 1 && b == 1) { return 3; } if (a == 1) { return 0; } if (b == 1) { return 5; } return 1; }
// Матч двух стратегий на N раундов; rec = 1 — записать ходы для ленты внизу
Function play(s1, s2, rec) {
  float a0 = 1; float b0 = 1; float ba = 0; float bb = 0;
  scA = 0; scB = 0;
  repeat (N) {
    float t = i;
    float a = move(s1, a0, b0, bb, t); float b = move(s2, b0, a0, ba, t);
    if (rnd() * 100 < noise) { a = 1 - a; }
    if (rnd() * 100 < noise) { b = 1 - b; }
    scA = scA + pay(a, b); scB = scB + pay(b, a);
    if (b == 0) { bb = 1; } if (a == 0) { ba = 1; }
    if (rec == 1 && t < 40) { mvA[t] = a; mvB[t] = b; }
    a0 = a; b0 = b;
  }
  return 0;
}

Update {
  if (N * 1000 + noise * 50 + sa * 7 + sb != key) {
    seed = 12345;
    repeat (7) { tot[i] = 0; }
    repeat (7) { float s1 = i; repeat (7) { float s2 = i; if (s2 >= s1) {
      play(s1, s2, 0);
      tot[s1] = tot[s1] + scA; if (s2 != s1) { tot[s2] = tot[s2] + scB; }
    } } }
    repeat (7) { avg[i] = tot[i] / (7 * N); }
    gbar = newGraph(); gba = newGraph();
    repeat (7) {
      string k = format(i, 0);
      if (i == sa) { addNode(gba, "a" + k, [bx(i), -1.9]); addNode(gba, "b" + k, [bx(i), -1.9 + avg[i] * 1.2]); addEdge(gba, "a" + k, "b" + k); }
      else { addNode(gbar, "a" + k, [bx(i), -1.9]); addNode(gbar, "b" + k, [bx(i), -1.9 + avg[i] * 1.2]); addEdge(gbar, "a" + k, "b" + k); }
    }
    // Матч A против B для ленты
    repeat (40) { mvA[i] = -1; mvB[i] = -1; }
    seed = 777; play(sa, sb, 1);
    gcc = newGraph(); gdd = newGraph();
    repeat (40) {
      if (mvA[i] == 1) { addNode(gcc, "a" + format(i, 0), [-7 + 0.37 * i, -3.3]); } if (mvA[i] == 0) { addNode(gdd, "a" + format(i, 0), [-7 + 0.37 * i, -3.3]); }
      if (mvB[i] == 1) { addNode(gcc, "b" + format(i, 0), [-7 + 0.37 * i, -4.1]); } if (mvB[i] == 0) { addNode(gdd, "b" + format(i, 0), [-7 + 0.37 * i, -4.1]); }
    }
    key = N * 1000 + noise * 50 + sa * 7 + sb;
  }
  float best = 0; repeat (7) { if (avg[i] > avg[best]) { best = i; } }
  info = "**Дилемма заключённого:** каждому из двух игроков выгоднее предать, что бы ни сделал другой (5 > 3 и 1 > 0), но если предадут оба, каждый получит 1 — меньше, чем 3 при взаимном сотрудничестве. Индивидуально разумный выбор ведёт к коллективно худшему исходу: равновесие Нэша (предать, предать) не оптимально по Парето.\n\nВ повторяющейся игре всё меняется: сегодняшнее предательство наказывается завтра. Турнир на " + format(N, 0) + " раундов";
  if (noise > 0) { info = info + " с шумом " + format(noise, 0) + "% (ход случайно заменяется на противоположный)"; }
  info = info + ": лучше всех — «" + fname(best) + "» (" + format(avg[best], 2) + " очка за раунд).";
  if (N == 1) { info = info + " В однократной игре выигрывают предатели."; }
  info = info + "\n\nМатч A против B: " + format(scA / N, 2) + " против " + format(scB / N, 2) + " очка за раунд.";
}
]
