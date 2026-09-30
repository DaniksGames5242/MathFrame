[
description = "{info}"

field width = 18;
field height = 16;
camera type = fixed;

// ---- Эпюр Монжа: плоский треугольник ABC лежит в плоскости, наклон которой к H задаёт φ,
// а направление её горизонталей (линий, параллельных H) — азимут ω. Показаны его
// проекции: на V — над осью x, на H — под ней. ----
draw Graph { name = "gAx"; graph = "gx"; edgeColor = #3b82f6; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Text { name = "tX"; pos = (8.3, 0.5); text = "x"; size = 1 }
draw Text { name = "tV"; pos = (-8, 7); text = "V"; size = 1 }
draw Text { name = "tH"; pos = (-8, -7); text = "H"; size = 1 }

new Point { name = "Af"; pos = (0, 4); text = true("A″"); color = #3b82f6; dynamic = false; collision = false }
new Point { name = "Bf"; pos = (0, 4); text = true("B″"); color = #3b82f6; dynamic = false; collision = false }
new Point { name = "Cf"; pos = (0, 4); text = true("C″"); color = #3b82f6; dynamic = false; collision = false }
new Point { name = "Ah"; pos = (0, -4); text = true("A′"); color = #f59e0b; dynamic = false; collision = false }
new Point { name = "Bh"; pos = (0, -4); text = true("B′"); color = #f59e0b; dynamic = false; collision = false }
new Point { name = "Ch"; pos = (0, -4); text = true("C′"); color = #f59e0b; dynamic = false; collision = false }
new Line { name = "f1"; pos = (Af, Bf); color = #3b82f6 }
new Line { name = "f2"; pos = (Bf, Cf); color = #3b82f6 }
new Line { name = "f3"; pos = (Cf, Af); color = #3b82f6 }
new Line { name = "h1"; pos = (Ah, Bh); color = #f59e0b }
new Line { name = "h2"; pos = (Bh, Ch); color = #f59e0b }
new Line { name = "h3"; pos = (Ch, Ah); color = #f59e0b }
new Figure { name = "triF"; elements = (f1, f2, f3) }
new Figure { name = "triH"; elements = (h1, h2, h3) }
new Line { name = "kA"; pos = (Af, Ah); active = false; interact = false }
new Line { name = "kB"; pos = (Bf, Bh); active = false; interact = false }
new Line { name = "kC"; pos = (Cf, Ch); active = false; interact = false }
draw Punctir { name = "pA"; edge = "kA"; layer = 1 }
draw Punctir { name = "pB"; edge = "kB"; layer = 1 }
draw Punctir { name = "pC"; edge = "kC"; layer = 1 }

new UI { name = "sPh"; type = slider; label = "наклон плоскости к H, φ°"; variable = ph; min = 0; max = 90; step = 1; default = 50 }
new UI { name = "sOm"; type = slider; label = "направление горизонталей ω°"; variable = om; min = 0; max = 180; step = 5; default = 30 }

float ph = 50; float om = 30; float key = -1; float built = 0;
string info = "";
float sA = -2.5; float tA = -1.75; float sB = 2.5; float tB = -1.75; float sC = 0; float tC = 2.5;

Function px(s, t) { return s * cos(radians(om)) - t * sin(radians(om)) * cos(radians(ph)); }
Function py(s, t) { return 4.2 + s * sin(radians(om)) + t * cos(radians(om)) * cos(radians(ph)); }
Function pz(t) { return 4.2 + t * sin(radians(ph)); }

Update {
  if (built < 1) {
    gx = newGraph(); addNode(gx, "p", [-8.6, 0]); addNode(gx, "q", [8.6, 0]); addEdge(gx, "p", "q");
    built = 1;
  }
  if (key != ph * 1000 + om) {
    Af.pos.x = px(sA, tA); Af.pos.y = pz(tA); Ah.pos.x = px(sA, tA); Ah.pos.y = -py(sA, tA);
    Bf.pos.x = px(sB, tB); Bf.pos.y = pz(tB); Bh.pos.x = px(sB, tB); Bh.pos.y = -py(sB, tB);
    Cf.pos.x = px(sC, tC); Cf.pos.y = pz(tC); Ch.pos.x = px(sC, tC); Ch.pos.y = -py(sC, tC);
    key = ph * 1000 + om;
  }
  float S = 10.625;
  float kH = abs(cos(radians(ph))); float kV = abs(cos(radians(om)) * sin(radians(ph)));
  info = "**Проекция плоскости** — образ, состоящий из оснований перпендикуляров, опущенных из её точек на плоскость проекций. Здесь плоскость задана треугольником ABC площади S = " + format(S, 1) + ", наклонённым к H под углом φ = " + format(ph, 0) + "°.\n\n";
  info = info + "Площадь проекции на H: S · |cos φ| = " + format(S * kH, 2) + ", на V: " + format(S * kV, 2) + ".\n\n";
  if (kH < 0.000001 && kV < 0.000001) { info = info + "**Плоскость перпендикулярна и H, и V:** обе проекции — прямые."; }
  else if (ph > 89.5 && om < 0.5) { info = info + "**Плоскость параллельна V:** её проекция на V конгруэнтна оригиналу, а проекция на H — прямая, параллельная оси x."; }
  else if (ph < 0.5) { info = info + "**Плоскость параллельна H:** её проекция на H конгруэнтна оригиналу (ABC = A′B′C′, углы и длины сохраняются), а проекция на V — прямая, параллельная оси x."; }
  else if (kH < 0.000001) { info = info + "**Плоскость перпендикулярна H (проецирующая):** её проекция на H — прямая (след плоскости), метрика искажена."; }
  else if (kV < 0.000001) { info = info + "**Плоскость перпендикулярна V:** её проекция на V — прямая."; }
  else { info = info + "**Плоскость общего положения:** обе проекции — области (проекция всей плоскости заполняет плоскость проекций), а фигура искажается: площади умножаются на " + format(kH, 3) + " и " + format(kV, 3) + "."; }
}
]
