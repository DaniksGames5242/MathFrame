[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Кольцо ℤ[√d]. Вещественное поле: логарифмическое вложение u ↦ (ln|σ₁u|, ln|σ₂u|) переводит единицы ±εᵏ
// в точки прямой x + y = 0 (по две единицы ±u на точку — ядро вложения {±1}). Мнимое поле: единицы — только корни из единицы. ----
draw Graph { name = "gAx"; graph = "gx"; edgeColor = #3b82f6; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gLn"; graph = "gl"; edgeColor = #3b82f6; edgeWidth = 2.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gU"; graph = "gu"; nodeColor = #3b82f6; nodeRadius = 9; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gSel"; graph = "gsel"; nodeColor = #f59e0b; nodeRadius = 13; labels = false; interactive = false; showWeights = false; layer = 12 }
draw Text { name = "tx"; pos = (7.8, -0.5); text = real ? "ln|σ₁u|" : "Re u"; size = 0.9; align = right; color = #3b82f6 }
draw Text { name = "ty"; pos = (0.2, 4.7); text = real ? "ln|σ₂u|" : "Im u"; size = 0.9; align = left; color = #3b82f6 }
draw Text { name = "tl"; pos = (bx(1) + 0.3, by(1) + 0.4); text = real ? "ε" : "i"; size = 1; active = real }

new UI { name = "sD"; type = select; label = "поле"; variable = d; options = (2, 3, 6, 7, 10, 11, 14, 15, -1, -3); labels = ("ℚ(√2)", "ℚ(√3)", "ℚ(√6)", "ℚ(√7)", "ℚ(√10)", "ℚ(√11)", "ℚ(√14)", "ℚ(√15)", "ℚ(i)", "ℚ(√−3)"); default = 2 }
new UI { name = "sK"; type = slider; label = "k"; variable = k; min = -3; max = 3; step = 1; default = 2 }

// ---- Логика ----
float d = 2; float k = 2;
float ex = 1; float ey = 1; float nn = -1;
float ua = 1; float ub = 0;
float real = 1; float L = 1; float sc = 1;
string info = "";

Function num(x) { if (x < 0) { return "−" + format(-x, 0); } return format(x, 0); }
Function term(x, s) { if (x == 0) { return "0"; } if (x == 1) { return s; } if (x == -1) { return "−" + s; } return num(x) + s; }
Function bx(j) { return sc * j * L; }
Function by(j) { return -sc * j * L; }
Function unit(a, b) { string s = num(a); if (b > 0) { return s + " + " + term(b, "√" + format(d, 0)); } if (b < 0) { return s + " − " + term(-b, "√" + format(d, 0)); } return s; }

Update {
  real = d > 0;
  gx = newGraph(); gl = newGraph(); gu = newGraph(); gsel = newGraph();
  if (real) {
    // fundamental unit ε = ex + ey√d: наименьшее решение ex² − d·ey² = ±1
    float fnd = 0;
    repeat (40) { float y = i + 1;
      float xm = round(sqrt(d * y * y - 1)); float xp = round(sqrt(d * y * y + 1));
      if (fnd == 0 && xm * xm - d * y * y == -1) { ex = xm; ey = y; nn = -1; fnd = 1; }
      if (fnd == 0 && xp * xp - d * y * y == 1) { ex = xp; ey = y; nn = 1; fnd = 1; }
    }
    L = log(ex + ey * sqrt(d));
    sc = 1.5 / L;
    // ε^|k| = ua + ub√d
    ua = 1; ub = 0;
    repeat (abs(k)) { float t = ua * ex + d * ub * ey; ub = ua * ey + ub * ex; ua = t; }
    if (k < 0) { ub = -ub * pow(nn, -k); ua = ua * pow(nn, -k); }
    addNode(gx, "x1", [-7.6, 0]); addNode(gx, "x2", [7.6, 0]); addEdge(gx, "x1", "x2");
    addNode(gx, "y1", [0, -4.6]); addNode(gx, "y2", [0, 4.6]); addEdge(gx, "y1", "y2");
    addNode(gl, "m1", [-4.5, 4.5]); addNode(gl, "m2", [4.5, -4.5]); addEdge(gl, "m1", "m2");
    repeat (7) { float j = i - 3; addNode(gu, "u" + format(i, 0), [bx(j), by(j)]); }
    addNode(gsel, "s", [bx(k), by(k)]);
    info = "**Теорема Дирихле о единицах:** группа единиц кольца целых поля степени n с r₁ вещественными и r₂ парами комплексных вложений изоморфна μ × ℤʳ, где μ — корни из единицы в поле, r = r₁ + r₂ − 1.\n\n";
    info = info + "Поле ℚ(√" + format(d, 0) + "): n = 2, r₁ = 2, r₂ = 0, ранг r = 1, μ = {±1}. Основная единица ε = " + unit(ex, ey) + ", N(ε) = " + num(nn) + ", ln ε = " + format(L, 3) + ". Все единицы — ±εᵏ, k ∈ ℤ; в логарифмическом вложении εᵏ ↦ (k·ln ε, −k·ln ε) — точки одной прямой x + y = 0 (условие |N| = 1).\n\n";
    info = info + "Выбрана εᵏ, k = " + num(k) + ": ";
    info = info + "ε^" + num(k) + " = " + unit(ua, ub) + ", норма " + num(ua * ua - d * ub * ub) + " = ±1.";
  }
  if (!real) {
    L = 1; sc = 3;
    addNode(gx, "x1", [-7.6, 0]); addNode(gx, "x2", [7.6, 0]); addEdge(gx, "x1", "x2");
    addNode(gx, "y1", [0, -4.6]); addNode(gx, "y2", [0, 4.6]); addEdge(gx, "y1", "y2");
    if (d == -1) { repeat (4) { addNode(gu, "u" + format(i, 0), [3 * cos(i * 1.5708), 3 * sin(i * 1.5708)]); } }
    if (d == -3) { repeat (6) { addNode(gu, "u" + format(i, 0), [3 * cos(i * 1.0472), 3 * sin(i * 1.0472)]); } }
    info = "**Теорема Дирихле о единицах:** группа единиц кольца целых поля степени n с r₁ вещественными и r₂ парами комплексных вложений изоморфна μ × ℤʳ, где μ — корни из единицы в поле, r = r₁ + r₂ − 1.\n\n";
    if (d == -1) { info = info + "Поле ℚ(i): r₁ = 0, r₂ = 1, ранг r = 0 — единицы только корни из единицы: {1, i, −1, −i} (4 штуки, все нормы равны 1)."; }
    if (d == -3) { info = info + "Поле ℚ(√−3): r₁ = 0, r₂ = 1, ранг r = 0 — единицы только корни из единицы: шесть корней шестой степени из 1, ±1, (±1 ± √−3)/2 (нормы равны 1)."; }
  }
}
]
