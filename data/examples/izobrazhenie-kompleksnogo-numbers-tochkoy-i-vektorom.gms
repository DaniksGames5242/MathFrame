[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;
show axes = true; show grid = true;

float tab = 1; float kf = 1; float r1 = 2; float ux = 1; float uy = 0; string info = "";

new Point { name = "O0"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false }
new Point { name = "Z1"; pos = (2, 1.5); text = true("z₁"); pauseOnDrag = false; color = #3b82f6 }
new Point { name = "Z2"; pos = (-2.5, 2); text = true("z₂"); pauseOnDrag = false; color = #f59e0b }

// ---- Вкладка 1: числа как точки — важны положение и расстояние между точками ----
new Line { name = "dz"; pos = (Z1, Z2); interact = false }
draw Punctir { name = "pdz"; edge = "dz" }
new Claster { name = "tabPt"; elements = (dz, pdz); active = true }

// ---- Вкладки 2 и 3: те же числа как радиус-векторы из нуля ----
new Line { name = "o1"; pos = (O0, Z1); color = #3b82f6; thickness = 3; interact = false }
new Line { name = "o2"; pos = (O0, Z2); color = #f59e0b; thickness = 3; interact = false }
draw Vector { name = "v1"; edge = "o1"; pos = 1; color = #3b82f6; thickness = 3 }
draw Vector { name = "v2"; edge = "o2"; pos = 1; color = #f59e0b; thickness = 3 }
new Claster { name = "tabVec"; elements = (o1, o2, v1, v2); active = false }

// ---- Вкладка 2: вектор kz₁ — растяжение и разворот ----
new Point { name = "K"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; text = true("kz₁"); color = #22c55e }
new Line { name = "ok"; pos = (O0, K); color = #22c55e; thickness = 2; interact = false }
new Claster { name = "tabK"; elements = (K, ok); active = false }

// ---- Вкладка 3: коллинеарность — z₂ лежит на прямой через 0 и z₁ ----
new Curve { name = "ln"; type = parametric; x = "ux * (-12 + 24 * t)"; y = "uy * (-12 + 24 * t)"; segments = 2 }
new Claster { name = "tabCol"; elements = (ln); active = false }

new UI { name = "sK"; type = slider; label = "k"; variable = kf; min = -min(3, 4.4 / r1); max = min(3, 4.4 / r1); step = 0.1; default = 1; active = tab == 2 }
new UI { name = "b1"; type = button; label = "Точка"; action = "tab = 1; tabPt.active = true; tabVec.active = false; tabK.active = false; tabCol.active = false" }
new UI { name = "b2"; type = button; label = "Вектор"; action = "tab = 2; tabPt.active = false; tabVec.active = true; tabK.active = true; tabCol.active = false" }
new UI { name = "b3"; type = button; label = "Коллинеарность"; action = "tab = 3; tabPt.active = false; tabVec.active = true; tabK.active = false; tabCol.active = true" }

Function num(v, d) { if (v < -0.0000001) { return "−" + format(-v, d); } return format(abs(v), d); }
Function cx(a, b) { if (b < -0.0000001) { return num(a, 2) + " − " + format(-b, 2) + "i"; } return num(a, 2) + " + " + format(abs(b), 2) + "i"; }

Update {
  float x1 = Z1.pos.x; float y1 = Z1.pos.y; float x2 = Z2.pos.x; float y2 = Z2.pos.y;
  r1 = hypot(x1, y1);
  if (r1 > 0.05) { ux = x1 / r1; uy = y1 / r1; }
  K.pos.x = kf * x1; K.pos.y = kf * y1;
  if (tab == 1) {
    info = "**Число как точка.** Каждому z = a + bi отвечает точка плоскости с координатами (a; b); она лишь фиксирует положение.\n\nz₁ = " + cx(x1, y1) + " — точка (" + num(x1, 2) + "; " + num(y1, 2) + "), z₂ = " + cx(x2, y2) + " — точка (" + num(x2, 2) + "; " + num(y2, 2) + ").\n\nРасстояние между точками — модуль разности: |z₁ − z₂| = " + format(hypot(x1 - x2, y1 - y2), 3) + ".";
  }
  if (tab == 2) {
    string turn = "то же направление";
    if (kf < -0.0001) { turn = "противоположное направление"; }
    if (abs(kf) <= 0.0001) { turn = "нулевой вектор"; }
    float ph = atan2(y1, x1);
    info = "**Число как вектор.** То же число — радиус-вектор из нуля в точку (a; b); он несёт направление: длина |z| и угол φ с положительной действительной осью.\n\nz₁ = " + cx(x1, y1) + ": |z₁| = " + format(r1, 3) + ", φ = " + num(ph, 3) + ", a = |z| cos φ = " + num(r1 * cos(ph), 2) + ", b = |z| sin φ = " + num(r1 * sin(ph), 2) + ".\n\nУмножение на действительное k = " + num(kf, 1) + " растягивает вектор: kz₁ = " + cx(kf * x1, kf * y1) + ", |kz₁| = " + format(abs(kf) * r1, 3) + ", " + turn + ".";
  }
  if (tab == 3) {
    float cr = x1 * y2 - x2 * y1;
    float dist = abs(cr) / max(r1, 0.05);
    string res = "Векторы **не коллинеарны**: z₂ не лежит на прямой через 0 и z₁ (расстояние до неё " + format(dist, 2) + ").";
    if (dist < 0.08) { res = "Векторы **коллинеарны**: z₂ лежит на прямой через 0 и z₁, то есть z₂ получается из z₁ умножением на действительное число."; }
    string ratio = "";
    if (abs(x1) > 0.05 && abs(x2) > 0.05) { ratio = "y₁/x₁ = " + num(y1 / x1, 2) + ", y₂/x₂ = " + num(y2 / x2, 2) + ". "; }
    info = "**Коллинеарность.** Векторы z₁ и z₂ коллинеарны, когда y₁/x₁ = y₂/x₂, то есть x₁y₂ − x₂y₁ = 0.\n\nz₁ = " + cx(x1, y1) + ", z₂ = " + cx(x2, y2) + ". " + ratio + "x₁y₂ − x₂y₁ = " + num(cr, 3) + ".\n\n" + res;
  }
}
]
