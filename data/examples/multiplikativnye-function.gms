[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Клетка (a, b) сетки 12×12: зелёная — f(ab) = f(a)·f(b), жёлтая — нет. Крупные клетки — взаимно простые
// пары, мелкие — пары с общим делителем. Синее кольцо — выбранная пара. ----
draw Graph { name = "gG"; graph = "gg"; nodeColor = #22c55e; nodeRadius = 9; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gGs"; graph = "ggs"; nodeColor = #22c55e; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gY"; graph = "gy"; nodeColor = #f59e0b; nodeRadius = 9; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gYs"; graph = "gys"; nodeColor = #f59e0b; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gSel"; graph = "gsel"; nodeColor = #3b82f6; nodeRadius = 15; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gAx"; graph = "gax"; nodeRadius = 0; labels = true; interactive = false; showWeights = false; layer = 6 }
draw Text { name = "lA"; pos = (1.9, 4.75); text = "a"; size = 1.1 }
draw Text { name = "lB"; pos = (-7.75, 4.75); text = "b"; size = 1.1 }
draw Graph { name = "gLg"; graph = "glg"; nodeColor = #22c55e; nodeRadius = 9; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gLy"; graph = "gly"; nodeColor = #f59e0b; nodeRadius = 9; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Text { name = "tLg"; pos = (3.6, 3.0); text = "f(ab) = f(a)·f(b)"; size = 1; align = left }
draw Text { name = "tLy"; pos = (3.6, 2.2); text = "f(ab) ≠ f(a)·f(b)"; size = 1; align = left }
draw Text { name = "tL1"; pos = (3.6, 1.2); text = "крупные клетки: НОД(a, b) = 1"; size = 0.95; align = left }
draw Text { name = "tL2"; pos = (3.6, 0.5); text = "мелкие: НОД(a, b) > 1"; size = 0.95; align = left }

new UI { name = "sF"; type = select; label = "функция f"; variable = fn; options = ("tau", "sig", "phi", "mu", "id", "sq", "omg", "p1"); labels = ("τ(n) — число делителей", "σ(n) — сумма делителей", "φ(n) — функция Эйлера", "μ(n) — функция Мёбиуса", "n", "n²", "ω(n) — число простых делителей", "n + 1"); default = "tau" }
new UI { name = "sA"; type = slider; label = "a"; variable = a; min = 1; max = 36; step = 1; default = 4 }
new UI { name = "sB"; type = slider; label = "b"; variable = b; min = 1; max = 36; step = 1; default = 9 }

// ---- Логика ----
string fn = "tau"; float a = 4; float b = 9;
string info = "";
float gkey = -1;

Function f(n) {
  if (fn == "tau") { return tau(n); }
  if (fn == "sig") { return sig(n); }
  if (fn == "phi") { return phi(n); }
  if (fn == "mu") { return mu(n); }
  if (fn == "id") { return n; }
  if (fn == "sq") { return n * n; }
  if (fn == "omg") { return omg(n); }
  return n + 1;
}
Function fnm() {
  if (fn == "tau") { return "τ"; } if (fn == "sig") { return "σ"; } if (fn == "phi") { return "φ"; } if (fn == "mu") { return "μ"; }
  if (fn == "id") { return "f(n) = n"; } if (fn == "sq") { return "f(n) = n²"; } if (fn == "omg") { return "ω"; } return "f(n) = n + 1";
}
Function gx(j) { return -6.8 + 0.72 * (j - 1); }
Function gy(j) { return 3.9 - 0.72 * (j - 1); }
Function fs(n) { if (fn == "id" || fn == "sq" || fn == "p1") { return "f(" + ni(n) + ")"; } return fnm() + "(" + ni(n) + ")"; }

Update {
  float fk = 0; if (fn == "sig") { fk = 1; } if (fn == "phi") { fk = 2; } if (fn == "mu") { fk = 3; } if (fn == "id") { fk = 4; } if (fn == "sq") { fk = 5; } if (fn == "omg") { fk = 6; } if (fn == "p1") { fk = 7; }
  if (gkey != fk) {
    gkey = fk;
    gg = newGraph(); ggs = newGraph(); gy = newGraph(); gys = newGraph(); gax = newGraph();
    repeat (12) {
      float p = i + 1;
      addNode(gax, "x" + format(p, 0), [gx(p), 4.75], format(p, 0));
      addNode(gax, "y" + format(p, 0), [-7.75 + 0.0, gy(p)], format(p, 0));
    }
    repeat (12) {
      float p = i + 1;
      repeat (12) {
        float q = i + 1;
        string kk = "c" + format(p, 0) + "_" + format(q, 0);
        float good = 0; if (f(p * q) == f(p) * f(q)) { good = 1; }
        float co = 0; if (gd(p, q) == 1) { co = 1; }
        if (good == 1 && co == 1) { addNode(gg, kk, [gx(p), gy(q)]); }
        if (good == 1 && co == 0) { addNode(ggs, kk, [gx(p), gy(q)]); }
        if (good == 0 && co == 1) { addNode(gy, kk, [gx(p), gy(q)]); }
        if (good == 0 && co == 0) { addNode(gys, kk, [gx(p), gy(q)]); }
      }
    }
    glg = newGraph(); addNode(glg, "l", [3.0, 3.0]);
    gly = newGraph(); addNode(gly, "l", [3.0, 2.2]);
  }
  gsel = newGraph();
  if (a <= 12 && b <= 12) { addNode(gsel, "s", [gx(a), gy(b)]); }
  float fa = f(a); float fb = f(b); float fab = f(a * b); float g = gd(a, b);
  info = "**Мультипликативная функция:** f(ab) = f(a)·f(b) для всех взаимно простых a и b. Выбрано **" + fnm() + "**, пара a = " + ni(a) + " = " + fac(a) + ", b = " + ni(b) + " = " + fac(b) + ", НОД(a, b) = " + ni(g) + ".\n\n";
  info = info + "**" + fs(a) + " = " + ni(fa) + ", " + fs(b) + " = " + ni(fb) + ", " + fs(a * b) + " = " + ni(fab) + ", " + fs(a) + "·" + fs(b) + " = " + ni(fa * fb) + ".** ";
  if (fab == fa * fb) { info = info + "Равенство f(ab) = f(a)·f(b) здесь выполнено"; if (g > 1) { info = info + " — хотя a и b не взаимно просты, условие взаимной простоты для мультипликативности лишь достаточно."; } else { info = info + "."; } }
  else { info = info + "Равенство не выполнено"; if (g > 1) { info = info + ": пара не взаимно проста, а для не полностью мультипликативной функции это допустимо."; } else { info = info + " при взаимно простых a и b — такая f не мультипликативна."; } }
  info = info + "\n\nВ сетке 12×12 у мультипликативной функции все крупные клетки зелёные (жёлтые мелкие возможны, если f не полностью мультипликативна). Если среди крупных есть жёлтая — f не мультипликативна. Значение на единице: f(1) = " + ni(f(1)) + ".";
}
Function md(a, b) { return a - floor(a / b) * b; }
Function gd(a, b) { float x = abs(a); float y = abs(b); repeat (40) { if (y > 0) { float r = x - floor(x / y) * y; x = y; y = r; } } return x; }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function ni(x) { return num(x, 0); }
Function pn(x) { if (x < 0) { return "(−" + format(-x, 0) + ")"; } return format(x, 0); }
Function tau(n) { float c = 0; repeat (n) { if (md(n, i + 1) == 0) { c = c + 1; } } return c; }
Function sig(n) { float c = 0; repeat (n) { if (md(n, i + 1) == 0) { c = c + i + 1; } } return c; }
Function phi(n) { float c = 0; repeat (n) { if (gd(n, i + 1) == 1) { c = c + 1; } } return c; }
Function omg(n) { float x = n; float c = 0; repeat (n) { float p = i + 2; if (p <= x && md(x, p) == 0) { repeat (12) { if (md(x, p) == 0) { x = x / p; } } c = c + 1; } } return c; }
Function mu(n) {
  if (n == 1) { return 1; }
  float x = n; float c = 0; float sq = 1;
  repeat (n) { float p = i + 2; if (p <= x && md(x, p) == 0) { float e = 0; repeat (12) { if (md(x, p) == 0) { x = x / p; e = e + 1; } } c = c + 1; if (e > 1) { sq = 0; } } }
  if (sq == 0) { return 0; }
  if (md(c, 2) == 0) { return 1; }
  return -1;
}
Function sd(e) { if (e == 0) { return "⁰"; } if (e == 1) { return "¹"; } if (e == 2) { return "²"; } if (e == 3) { return "³"; } if (e == 4) { return "⁴"; } if (e == 5) { return "⁵"; } if (e == 6) { return "⁶"; } if (e == 7) { return "⁷"; } if (e == 8) { return "⁸"; } return "⁹"; }
Function sup(e) { if (e < 10) { return sd(e); } return sd(floor(e / 10)) + sd(md(e, 10)); }
Function fac(n) {
  if (n == 1) { return "1"; }
  string s = ""; float x = n;
  repeat (n) { float p = i + 2; if (p <= x && md(x, p) == 0) { float e = 0; repeat (12) { if (md(x, p) == 0) { x = x / p; e = e + 1; } } if (s != "") { s = s + "·"; } s = s + format(p, 0); if (e > 1) { s = s + sup(e); } } }
  return s;
}
]
