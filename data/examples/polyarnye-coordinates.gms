[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Полюс O, полярная ось — луч вправо от O ----
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
new Point { name = "X"; pos = (7.2, 0); dynamic = false; collision = false; active = false }
new Line { name = "axis"; pos = (O, X); thickness = 2.5; interact = false }
draw Graph { name = "grid"; graph = "gg"; nodeRadius = 0; labels = false; interactive = false; showWeights = false; edgeColor = #3b82f655; edgeWidth = 1; layer = 0 }
int tab = 1; string info = ""; float phi = 0; float rr = 1; float ph = 60; float rv = 3;
float lmx = 3; float lmy = 2;

// ---- Вкладка 1: точка M и её полярные координаты (r; φ) ----
new Point { name = "M"; pos = (3, 2); text = true("M"); pauseOnDrag = false; color = #f59e0b }
new Line { name = "rm"; pos = (O, M); color = #f59e0b; thickness = 2; interact = false }
new Curve { name = "arc1"; type = parametric; x = "0.9 * cos(phi * t)"; y = "0.9 * sin(phi * t)"; segments = 60; thickness = 2; color = #3b82f6 }
new Claster { name = "t1"; elements = (M, rm, arc1); active = true }

// ---- Вкладка 2: произвольная пара (r; φ), в том числе с отрицательным r и большим φ ----
new Point { name = "P"; pos = (0, 0); dynamic = false; collision = false; text = true("P"); color = #f59e0b }
new Point { name = "E"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "rp"; pos = (O, E); thickness = 1.5; interact = false }
new Curve { name = "arc2"; type = parametric; x = "(0.6 + 0.3 * t) * cos(ph * 3.14159265 / 180 * t)"; y = "(0.6 + 0.3 * t) * sin(ph * 3.14159265 / 180 * t)"; segments = 200; thickness = 2; color = #3b82f6 }
new UI { name = "sr"; type = slider; label = "r"; variable = rv; min = -4.5; max = 4.5; step = 0.1; default = 3 }
new UI { name = "sp"; type = slider; label = "φ, °"; variable = ph; min = -540; max = 540; step = 5; default = 60 }
new Claster { name = "t2"; elements = (P, rp, arc2, sr, sp); active = false }

new UI { type = button; name = "bt1"; label = "Координаты точки"; action = "tab = 1; t1.active = true; t2.active = false" }
new UI { type = button; name = "bt2"; label = "Любая пара (r; φ)"; action = "tab = 2; t1.active = false; t2.active = true" }

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function deg(x) { return x * 180 / 3.14159265; }
// Нормализация угла в градусах в [0; 360)
Function norm(a) { float m = a - 360 * floor(a / 360); return m; }

Start {
  newGraph("gg");
  // Окружности r = 1…4 и лучи через 30°
  repeat (4) {
    float ring = i + 1;
    repeat (72) { addNode(gg, "c" + format(ring, 0) + "_" + format(i, 0), [ring * cos(i * 3.14159265 / 36), ring * sin(i * 3.14159265 / 36)]); }
    repeat (72) { addEdge(gg, "c" + format(ring, 0) + "_" + format(i, 0), "c" + format(ring, 0) + "_" + format((i + 1) % 72, 0)); }
  }
  addNode(gg, "o", [0, 0]);
  repeat (12) { addNode(gg, "e" + format(i, 0), [4.6 * cos(i * 3.14159265 / 6), 4.6 * sin(i * 3.14159265 / 6)]); addEdge(gg, "o", "e" + format(i, 0)); }
}

Update {
  if (tab == 1) {
    float mx = M.pos.x; float my = M.pos.y; float r = sqrt(mx * mx + my * my);
    if (r < 0.5) { if (r < 0.0001) { mx = 0.5; my = 0; } else { mx = mx * 0.5 / r; my = my * 0.5 / r; } M.pos.x = mx; M.pos.y = my; r = 0.5; }
    phi = atan2(my, mx); if (phi < 0) { phi = phi + 2 * 3.14159265; }
    float pd = deg(phi);
    info = "**Полярные координаты** точки M: полярный радиус r = OM = " + format(r, 2) + " и полярный угол φ от полярной оси до луча OM против часовой стрелки: φ = " + format(phi, 2) + " рад = " + format(pd, 1) + "°.\n\nСвязь с прямоугольными координатами: x = r cos φ = " + format(r, 2) + " · cos " + format(pd, 1) + "° = " + num(mx, 2) + ", y = r sin φ = " + num(my, 2) + ".\n\nУгол определён с точностью до 2π: пары (" + format(r, 2) + "; " + format(pd, 1) + "°), (" + format(r, 2) + "; " + format(pd + 360, 1) + "°) и (" + format(r, 2) + "; " + num(pd - 360, 1) + "°) задают одну точку.";
  }
  if (tab == 2) {
    float a = ph * 3.14159265 / 180;
    P.pos.x = rv * cos(a); P.pos.y = rv * sin(a);
    E.pos.x = 5 * cos(a); E.pos.y = 5 * sin(a);
    string same = "";
    float ra = abs(rv); float pa = ph;
    if (rv < 0) { pa = ph + 180; }
    float pn = norm(pa);
    if (ra < 0.05) { same = "Это полюс: r = 0, угол не определён."; }
    else {
      if (rv < 0) { same = "Отрицательный r — точка на продолжении луча φ за полюс, на расстоянии |r| = " + format(ra, 2) + ": это пара (" + format(ra, 2) + "; " + format(pn, 1) + "°) с r ≥ 0 и φ ∈ [0°; 360°)."; }
      else { same = "Это пара (" + format(ra, 2) + "; " + format(pn, 1) + "°) с r ≥ 0 и φ ∈ [0°; 360°) — ту же точку задают все углы вида " + format(pn, 1) + "° + 360°·n."; }
    }
    info = "**Пара (r; φ) = (" + num(rv, 1) + "; " + num(ph, 0) + "°)** задаёт точку P = (" + num(P.pos.x, 2) + "; " + num(P.pos.y, 2) + ") в прямоугольных координатах.\n\n" + same;
  }
}
]
