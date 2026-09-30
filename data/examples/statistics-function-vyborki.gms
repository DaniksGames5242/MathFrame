[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Сверху — одна выборка x₁, …, xₙ и значение статистики на ней (оранжевая метка).
// Снизу — значения той же статистики на 40 разных выборках: статистика случайна. ----
draw Graph { name = "gAx"; graph = "gx"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gS"; graph = "gs"; nodeColor = #3b82f6; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gD"; graph = "gd"; nodeColor = #3b82f6; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gC"; graph = "gc"; nodeColor = #f59e0b; nodeRadius = 9; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Text { name = "t1"; pos = (-9.6, 4.6); text = "выборка"; size = 0.95; align = left }
draw Text { name = "t2"; pos = (-9.6, -0.6); text = "статистика по 40 выборкам"; size = 0.95; align = left }

new UI { name = "sK"; type = select; label = "статистика"; variable = kind; options = ("mean", "med", "max", "rng"); labels = ("среднее x̄", "медиана", "максимум", "размах"); default = "mean" }
new UI { name = "sN"; type = slider; label = "объём n"; variable = n; min = 2; max = 30; step = 1; default = 8 }
new UI { name = "sS"; type = slider; label = "выборка №"; variable = sd; min = 1; max = 40; step = 1; default = 1 }

string kind = "mean"; float n = 8; float sd = 1;
float key = -1; string info = "";
float val = 0;

Function rnd(k) { float s = sin(k * 12.9898 + 78.233) * 43758.5453; return s - floor(s); }
Function xv(s, i) { return 0.5 + 9 * (rnd(s * 977 + i) + rnd(s * 977 + i + 500)) / 2; }
Function px(v) { return -8 + 1.6 * v; }
Function rk(s, q) {
  float r = 0; float v = xv(s, q);
  repeat (n) { float w = xv(s, i); if (w < v) { r = r + 1; } if (w == v) { if (i < q) { r = r + 1; } } }
  return r;
}
Function stat(s) {
  float sum = 0; float mx = 0; float mn = 100;
  repeat (n) { float v = xv(s, i); sum = sum + v; mx = max(mx, v); mn = min(mn, v); }
  if (kind == "mean") { return sum / n; }
  if (kind == "max") { return mx; }
  if (kind == "rng") { return mx - mn; }
  float r1 = floor((n - 1) / 2); float r2 = floor(n / 2); float m = 0;
  repeat (n) { float r = rk(s, i); if (r == r1) { m = m + xv(s, i); } if (r == r2) { m = m + xv(s, i); } }
  return m / 2;
}
Function kc() { if (kind == "mean") { return 0; } if (kind == "med") { return 1; } if (kind == "max") { return 2; } return 3; }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  if (key != (n * 100 + kc()) * 100 + sd) {
    gx = newGraph(); gs = newGraph(); gd = newGraph(); gc = newGraph();
    addNode(gx, "a1", [-8, 3.6]); addNode(gx, "a2", [8, 3.6]); addEdge(gx, "a1", "a2");
    addNode(gx, "b1", [-8, -4.6]); addNode(gx, "b2", [8, -4.6]); addEdge(gx, "b1", "b2");
    float y0 = 3.6;
    repeat (n) { addNode(gs, "s" + format(i, 0), [px(xv(sd, i)), y0 + 0.5]); }
    val = stat(sd);
    addNode(gc, "c0", [px(val), y0 + 0.5]);
    // 40 значений статистики, кучками по корзинам шириной 0.25
    list cnt = [0]; repeat (60) { push(cnt, 0); }
    repeat (40) {
      float sv = stat(i + 1); float b = floor(sv / 0.25); if (b > 60) { b = 60; }
      float h = cnt[b]; cnt[b] = h + 1;
      if (i + 1 == sd) { addNode(gc, "d" + format(i, 0), [px(sv), -4.6 + 0.5 + 0.3 * h]); }
      if (i + 1 != sd) { addNode(gd, "d" + format(i, 0), [px(sv), -4.6 + 0.5 + 0.3 * h]); }
    }
    key = (n * 100 + kc()) * 100 + sd;
  }
  string nm = "среднее x̄";
  if (kind == "med") { nm = "медиана"; } if (kind == "max") { nm = "максимум"; } if (kind == "rng") { nm = "размах R = xmax − xmin"; }
  info = "**Статистика** — функция от выборки, в которую не входят неизвестные параметры: T = T(x₁, …, xₙ). Здесь n = " + format(n, 0) + " наблюдений выборки №" + format(sd, 0) + ", T = " + nm + ".\n\nНа этой выборке T = **" + num(val, 2) + "** (оранжевая метка). На другой выборке значение другое: статистика сама случайная величина, снизу показаны её значения на 40 выборках.";
}
]
