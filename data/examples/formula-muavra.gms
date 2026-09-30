[
description = "{info}"
field width = 12; field height = 7.5;
camera type = fixed;
show axes = true; show grid = true;
string info = ""; float n = 3; float r = 1.2; float ph = 0.5; float px = 99; float py = 99; float pn = 0;
float rmax = 3;

new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "z"; pos = (1.05, 0.58); text = true("z"); pauseOnDrag = false; collideWithPoints = false; color = #3b82f6 }
new Point { name = "zn"; pos = (0, 0); text = true("zⁿ"); dynamic = false; collision = false; color = #22c55e }
draw Graph { name = "gsp"; graph = "gs"; nodeRadius = 4; edgeWidth = 1.5; labels = false; interactive = false; showWeights = false }
new Line { name = "oz"; pos = (O, z); interact = false; color = #3b82f6; thickness = 3 }
new Line { name = "ozn"; pos = (O, zn); interact = false; color = #22c55e; thickness = 3 }
new UI { name = "sn"; type = slider; label = "n"; variable = n; min = 1; max = 8; step = 1; default = 3 }

Function num(v) { if (v < 0) { return "−" + format(-v, 2); } return format(v, 2); }
Function term(v) { if (v < 0) { return " − " + format(-v, 2); } return " + " + format(v, 2); }
Function sup(k) { string t = ""; float m = k; if (m >= 10) { t = t + "¹"; m = m - 10; }
  if (m < 0.5) { return t + "⁰"; } if (m < 1.5) { return t + "¹"; } if (m < 2.5) { return t + "²"; } if (m < 3.5) { return t + "³"; }
  if (m < 4.5) { return t + "⁴"; } if (m < 5.5) { return t + "⁵"; } if (m < 6.5) { return t + "⁶"; } if (m < 7.5) { return t + "⁷"; }
  if (m < 8.5) { return t + "⁸"; } return t + "⁹"; }

Update {
  float R = min(fieldMaxX, fieldMaxY);
  rmax = pow(R, 1 / n);
  float q = hypot(z.pos.x, z.pos.y);
  // модуль zⁿ = rⁿ не выходит за поле: точка z сжимается к началу координат
  float lim = min(rmax, R);
  if (q > lim) { z.pos.x = z.pos.x * lim / q; z.pos.y = z.pos.y * lim / q; }
  if (q < 0.4) { if (q < 0.0001) { z.pos.x = 0.4; } else { z.pos.x = z.pos.x * 0.4 / q; z.pos.y = z.pos.y * 0.4 / q; } }
  if (abs(z.pos.x - px) > 0.00001 || abs(z.pos.y - py) > 0.00001 || n != pn) {
    px = z.pos.x; py = z.pos.y; pn = n;
    r = hypot(px, py); ph = atan2(py, px);
    gs = newGraph();
    addNode(gs, "k0", [0, 0]);
    float k = 1;
    repeat (8) {
      if (k <= n) {
        addNode(gs, "k" + format(k, 0), [pow(r, k) * cos(k * ph), pow(r, k) * sin(k * ph)]);
        addEdge(gs, "k" + format(k - 1, 0), "k" + format(k, 0), 1, "#3b82f6");
      }
      k = k + 1;
    }
    zn.pos.x = pow(r, n) * cos(n * ph); zn.pos.y = pow(r, n) * sin(n * ph);
  }
  float a = pow(r, n) * cos(n * ph); float b = pow(r, n) * sin(n * ph);
  info = "**Формула Муавра**: (r(cos φ + i sin φ))ⁿ = rⁿ(cos nφ + i sin nφ) для любого натурального n. Модуль возводится в степень n, аргумент умножается на n. Ломаная — точки z, z², …, zⁿ: каждое умножение на z поворачивает на φ и растягивает в r раз.\n\n";
  info = info + "z = " + format(r, 2) + "(cos " + num(ph * 57.29578) + "° + i sin " + num(ph * 57.29578) + "°), n = " + format(n, 0) + ".\n\n";
  info = info + "z" + sup(n) + " = " + format(r, 2) + sup(n) + "(cos " + num(n * ph * 57.29578) + "° + i sin " + num(n * ph * 57.29578) + "°) = " + num(pow(r, n)) + "·(cos nφ + i sin nφ) = " + num(a) + term(b) + "i.";
}
]
