[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Двумерное нормальное распределение: эллипсы — линии уровня плотности при расстоянии Махаланобиса
// d = 1, 2. Точка M — вектор средних μ, отрезки — главные оси матрицы Σ, точка z — произвольная точка,
// в которой считается плотность. ----
draw Graph { name = "gEl"; graph = "gel"; edgeColor = #3b82f6; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gA1"; graph = "ga1"; edgeColor = #f59e0b; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gA2"; graph = "ga2"; edgeColor = #22c55e; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gAx"; graph = "gax"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Text { name = "l1"; pos = (-9.6, 5.6); text = "главная ось, λ₁ = " + format(la1, 2); size = 0.9; align = left; color = #f59e0b }
draw Text { name = "l2"; pos = (-9.6, 4.9); text = "главная ось, λ₂ = " + format(la2, 2); size = 0.9; align = left; color = #22c55e }
new Point { name = "M"; pos = (-1, 0); text = true("μ"); pauseOnDrag = false; collision = false; color = #3b82f6 }
new Point { name = "Z"; pos = (2.5, 2); text = true("z"); pauseOnDrag = false; collision = false }

new UI { name = "s1"; type = slider; label = "σ₁"; variable = s1; min = 0.8; max = 2.5; step = 0.1; default = 2 }
new UI { name = "s2"; type = slider; label = "σ₂"; variable = s2; min = 0.8; max = 2.2; step = 0.1; default = 1.2 }
new UI { name = "sR"; type = slider; label = "ρ"; variable = rho; min = -0.95; max = 0.95; step = 0.05; default = 0.6 }

// ---- Логика ----
float s1 = 2; float s2 = 1.2; float rho = 0.6; float key = -1; string info = "";
float la1 = 0; float la2 = 0;
Function num(x, d) { float v = x; if (abs(v) < 0.5 * pow(10, -d)) { v = 0; } if (v < 0) { return "−" + format(-v, d); } return format(v, d); }

Update {
  if (M.pos.x < -4) { M.pos.x = -4; } if (M.pos.x > 4) { M.pos.x = 4; }
  if (M.pos.y < -1) { M.pos.y = -1; } if (M.pos.y > 1) { M.pos.y = 1; }
  if (Z.pos.x < -9) { Z.pos.x = -9; } if (Z.pos.x > 9) { Z.pos.x = 9; }
  if (Z.pos.y < -5.3) { Z.pos.y = -5.3; } if (Z.pos.y > 5.3) { Z.pos.y = 5.3; }
  if (key != M.pos.x * 1000 + M.pos.y * 77 + Z.pos.x * 13 + Z.pos.y * 3 + s1 * 5000 + s2 * 700 + rho * 31) {
    gel = newGraph(); ga1 = newGraph(); ga2 = newGraph(); gax = newGraph();
    float m1 = M.pos.x; float m2 = M.pos.y; float q = sqrt(1 - rho * rho);
    float c12 = rho * s1 * s2; float dt = s1 * s1 * s2 * s2 * q * q;
    float tr = s1 * s1 + s2 * s2; float df = s1 * s1 - s2 * s2; float rt = sqrt(df * df + 4 * c12 * c12);
    la1 = (tr + rt) / 2; la2 = (tr - rt) / 2;
    float ph = 0.5 * atan2(2 * c12, df);
    addNode(gax, "a", [-9.4, m2]); addNode(gax, "b", [9.4, m2]); addEdge(gax, "a", "b");
    addNode(gax, "c", [m1, -5.4]); addNode(gax, "d", [m1, 5.4]); addEdge(gax, "c", "d");
    repeat (65) {
      float th = 6.2831853 * i / 64; string s = format(i, 0);
      addNode(gel, "a" + s, [m1 + s1 * cos(th), m2 + s2 * (rho * cos(th) + q * sin(th))]);
      addNode(gel, "b" + s, [m1 + 2 * s1 * cos(th), m2 + 2 * s2 * (rho * cos(th) + q * sin(th))]);
      if (i > 0) { addEdge(gel, "a" + format(i - 1, 0), "a" + s); addEdge(gel, "b" + format(i - 1, 0), "b" + s); }
    }
    addNode(ga1, "a", [m1 - 2 * sqrt(la1) * cos(ph), m2 - 2 * sqrt(la1) * sin(ph)]); addNode(ga1, "b", [m1 + 2 * sqrt(la1) * cos(ph), m2 + 2 * sqrt(la1) * sin(ph)]); addEdge(ga1, "a", "b");
    addNode(ga2, "a", [m1 + 2 * sqrt(max(la2, 0)) * sin(ph), m2 - 2 * sqrt(max(la2, 0)) * cos(ph)]); addNode(ga2, "b", [m1 - 2 * sqrt(max(la2, 0)) * sin(ph), m2 + 2 * sqrt(max(la2, 0)) * cos(ph)]); addEdge(ga2, "a", "b");
    float zx = Z.pos.x - m1; float zy = Z.pos.y - m2;
    float d2 = (zx * zx / (s1 * s1) - 2 * rho * zx * zy / (s1 * s2) + zy * zy / (s2 * s2)) / (q * q);
    float fz = exp(-d2 / 2) / (6.2831853 * s1 * s2 * q);
    info = "**Многомерное нормальное распределение** задаётся вектором средних μ = (" + num(m1, 2) + "; " + num(m2, 2) + ") и ковариационной матрицей Σ = ((" + format(s1 * s1, 2) + ", " + num(c12, 2) + "), (" + num(c12, 2) + ", " + format(s2 * s2, 2) + ")), det Σ = " + format(dt, 2) + " > 0. Плотность f(x) = exp(−(x − μ)ᵀ Σ⁻¹ (x − μ) / 2) / (2π·√det Σ) постоянна на эллипсах, а их форма целиком определена вторыми моментами.\n\n";
    info = info + "**Главные оси эллипсов** — собственные направления Σ, полуоси пропорциональны √λ: λ₁ = " + format(la1, 2) + ", λ₂ = " + format(la2, 2) + ". Каждая компонента нормальна: X₁ ~ N(" + num(m1, 2) + "; " + format(s1 * s1, 2) + "), X₂ ~ N(" + num(m2, 2) + "; " + format(s2 * s2, 2) + ").\n\n";
    info = info + "**В точке z = (" + num(Z.pos.x, 2) + "; " + num(Z.pos.y, 2) + "):** (z − μ)ᵀ Σ⁻¹ (z − μ) = " + format(d2, 2) + ", плотность f(z) = " + format(fz, 4) + ".";
    if (abs(rho) < 0.025) { info = info + " При ρ = 0 оси эллипсов параллельны осям координат: некоррелированные компоненты независимы."; }
    key = M.pos.x * 1000 + M.pos.y * 77 + Z.pos.x * 13 + Z.pos.y * 3 + s1 * 5000 + s2 * 700 + rho * 31;
  }
}
]
