[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// Сверху — плотность φ стандартного нормального закона, снизу — Φ(x) = ∫ от 0 до x от φ(t) dt.
// Ось x общая: 1 единица x = 2.5 единицы поля. Точка A на верхней оси задаёт x.
float sx = 2.5; float ya = 0.6; float ky = 9; float yb = -3; float kb = 4.4;
float key = -99; float xv = 1; float ph = 0; float ph0 = 0; float sl = 0;
string info = "";

func dens(x) = ya + ky * exp(-(x / sx) * (x / sx) / 2) / sqrt(2 * pi);
func lap(x) = yb + kb * 0.5 * erf(x / sx / sqrt(2));
draw Function { name = "gd"; f = "dens"; xmin = -10; xmax = 10; thickness = 3; layer = 30 }
draw Function { name = "gl"; f = "lap"; xmin = -10; xmax = 10; thickness = 3; layer = 30 }
draw Graph { name = "gB"; graph = "gb"; nodeRadius = 0; edgeWidth = 4.2; edgeCap = butt; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gA"; graph = "ga"; nodeRadius = 0; edgeWidth = 1; edgeColor = #3b82f677; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gT"; graph = "gt"; nodeRadius = 0; edgeWidth = 3; labels = false; interactive = false; showWeights = false; layer = 40 }
new Point { name = "A"; pos = (2.5, 0.6); pauseOnDrag = false; collideWithPoints = false; color = #3b82f6 }
new Point { name = "B"; pos = (2.5, -1.5); dynamic = false; collision = false; color = #3b82f6 }
draw Text { name = "tA"; pos = (A.pos.x, ya - 0.6); text = "x"; size = 0.9; color = #3b82f6 }
draw Text { name = "tM"; pos = (-A.pos.x, ya - 0.6); text = "−x"; size = 0.9; color = #f59e0b }
draw Text { name = "t1"; pos = (9.2, yb + kb * 0.5 - 0.4); text = "½"; size = 0.9 }
draw Text { name = "t2"; pos = (-9.2, yb - kb * 0.5 + 0.4); text = "−½"; size = 0.9 }
draw Text { name = "x0"; pos = (0, yb - 0.5); text = "0"; size = 0.7 }
draw Text { name = "x2"; pos = (5, yb - 0.5); text = "2"; size = 0.7 }
draw Text { name = "x4"; pos = (-5, yb - 0.5); text = "−2"; size = 0.7 }
draw Text { name = "x6"; pos = (7.5, yb - 0.5); text = "3"; size = 0.7 }
draw Text { name = "x7"; pos = (-7.5, yb - 0.5); text = "−3"; size = 0.7 }

Function num(x, d) { if (x < -0.00001) { return "−" + format(-x, d); } return format(abs(x), d); }
Update {
  if (abs(A.pos.y - ya) > 0.0001) { A.pos.y = ya; }
  if (A.pos.x < 0.25) { A.pos.x = 0.25; }
  if (A.pos.x > 9.2) { A.pos.x = 9.2; }
  xv = A.pos.x / sx;
  ph = 0.5 * erf(xv / sqrt(2)); ph0 = normalPdf(xv, 0, 1);
  B.pos.x = A.pos.x; B.pos.y = yb + kb * ph;
  if (key != A.pos.x) {
    gb = newGraph(); ga = newGraph(); gt = newGraph();
    addNode(ga, "l", [-10, ya]); addNode(ga, "r", [10, ya]); addEdge(ga, "l", "r");
    addNode(ga, "m", [-10, yb]); addNode(ga, "n", [10, yb]); addEdge(ga, "m", "n");
    addNode(ga, "h1", [-10, yb + kb * 0.5]); addNode(ga, "h2", [10, yb + kb * 0.5]); addEdge(ga, "h1", "h2");
    addNode(ga, "k1", [-10, yb - kb * 0.5]); addNode(ga, "k2", [10, yb - kb * 0.5]); addEdge(ga, "k1", "k2");
    addNode(ga, "v1", [0, ya]); addNode(ga, "v2", [0, yb - kb * 0.5]); addEdge(ga, "v1", "v2");
    repeat (100) {
      float x = 0.05 + 0.1 * i; string id = format(i, 0);
      if (x < A.pos.x) {
        addNode(gb, "a" + id, [x, ya]); addNode(gb, "b" + id, [x, ya + ky * normalPdf(x / sx, 0, 1)]); addEdge(gb, "a" + id, "b" + id, 1, "#3b82f6");
        addNode(gb, "c" + id, [-x, ya]); addNode(gb, "d" + id, [-x, ya + ky * normalPdf(x / sx, 0, 1)]); addEdge(gb, "c" + id, "d" + id, 1, "#f59e0b");
      }
    }
    // касательная к Φ в точке B: наклон равен φ(x)
    sl = kb * ph0 / sx;
    addNode(gt, "p", [A.pos.x - 1.6, yb + kb * ph - 1.6 * sl]); addNode(gt, "q", [A.pos.x + 1.6, yb + kb * ph + 1.6 * sl]); addEdge(gt, "p", "q", 1, "#f59e0b");
    key = A.pos.x;
  }
  info = "**Функция Лапласа** Φ(x) = ∫ от 0 до x от (1/√(2π))·e^(−t²/2) dt — накопленная от нуля вероятность стандартной нормальной величины. Синяя площадь сверху — это Φ(x) при x = **" + format(xv, 2) + "**: Φ(x) = **" + format(ph, 4) + "**.\n\n";
  info = info + "**Нечётность:** Φ(−x) = −Φ(x) = **" + num(-ph, 4) + "** — жёлтая площадь слева равна синей по величине, но берётся со знаком минус. Φ(0) = 0.\n\n";
  info = info + "**Предел:** Φ(x) → ½ при x → +∞ (Φ(" + format(xv, 2) + ") уже отличается от ½ на " + format(0.5 - ph, 4) + "). **Производная:** Φ′(x) = φ(x) = **" + format(ph0, 4) + "** — это наклон жёлтой касательной к графику снизу; Φ возрастает, всё медленнее по мере удаления от нуля.";
}
]
