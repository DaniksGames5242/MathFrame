[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Вычеты 0…n−1 по кругу. Цвет — значение символа Якоби (a/n): зелёный +1, жёлтый −1,
// без цвета 0 (число не взаимно просто с n). Синее кольцо — настоящие квадраты по модулю n:
// у составного n есть зелёные числа без кольца (символ +1, но x² ≡ a неразрешимо). ----
draw Graph { name = "gQ"; graph = "gq"; nodeColor = #3b82f6; nodeRadius = 17; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gS"; graph = "gs"; nodeRadius = 24; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gP"; graph = "gp"; nodeColor = #22c55e; nodeRadius = 13; labels = true; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gM"; graph = "gm"; nodeColor = #f59e0b; nodeRadius = 13; labels = true; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gZ"; graph = "gz"; nodeColor = #3b82f677; nodeRadius = 13; labels = true; interactive = false; showWeights = false; layer = 10 }

new UI { type = slider; label = "нечётное n"; variable = n; min = 3; max = 41; step = 2; default = 15 }
new UI { type = slider; label = "a"; variable = a; min = 1; max = n - 1; step = 1; default = 2 }
new UI { type = slider; label = "b"; variable = b; min = 1; max = n - 1; step = 1; default = 7 }

float n = 15; float a = 2; float b = 7; float key = -1; string info = "";

Function md(x, q) { return x - q * floor(x / q); }
Function sg(v) { if (v < 0) { return "−1"; } return format(v, 0); }
// символ Лежандра (x/d) для простого d по критерию Эйлера
Function jl(x, d) {
  float xr = md(x, d); if (xr == 0) { return 0; }
  float r = 1; repeat ((d - 1) / 2) { r = md(r * xr, d); }
  if (r == 1) { return 1; } return -1;
}
// символ Якоби: произведение символов Лежандра по простым делителям n с учётом кратности
Function jac(x) {
  float m = n; float r = 1;
  repeat (n) { float d = i + 3; repeat (4) { if (m > 1 && md(m, d) == 0) { m = m / d; r = r * jl(x, d); } } }
  return r;
}
// mode 0: «(x/3)·(x/5)», mode 1: «(−1)·(1)», mode 2: «3·5»
Function fac(x, mode) {
  float m = n; string s = "";
  repeat (n) {
    float d = i + 3;
    repeat (4) {
      if (m > 1 && md(m, d) == 0) {
        m = m / d; if (s != "") { s = s + "·"; }
        if (mode == 0) { s = s + "(" + format(x, 0) + "/" + format(d, 0) + ")"; }
        if (mode == 1) { s = s + "(" + sg(jl(x, d)) + ")"; }
        if (mode == 2) { s = s + format(d, 0); }
      }
    }
  }
  return s;
}
Function isSq(x) { float f = 0; repeat (n) { if (md(i * i, n) == md(x, n)) { f = 1; } } return f; }
Function px(x) { return 4 * sin(6.2831853 * x / n); }
Function py(x) { return 4 * cos(6.2831853 * x / n); }

Update {
  if (key != n) {
    gp = newGraph(); gm = newGraph(); gz = newGraph(); gq = newGraph();
    repeat (n) {
      string kn = "n" + format(i, 0); float jj = jac(i);
      if (jj == 0) { addNode(gz, kn, [px(i), py(i)], format(i, 0)); }
      if (jj == 1) { addNode(gp, kn, [px(i), py(i)], format(i, 0)); }
      if (jj == -1) { addNode(gm, kn, [px(i), py(i)], format(i, 0)); }
      if (jj != 0 && isSq(i) == 1) { addNode(gq, kn, [px(i), py(i)]); }
    }
    key = n;
  }
  gs = newGraph(); addNode(gs, "s", [px(a), py(a)]);
  float ja = jac(a); float jb = jac(b); float jab = jac(a * b);
  info = "**Символ Якоби (a/n)** при n = **" + format(n, 0) + "**";
  if (n > 3 && fac(a, 2) != format(n, 0)) { info = info + " = " + fac(a, 2); }
  info = info + ": (" + format(a, 0) + "/" + format(n, 0) + ")";
  if (fac(a, 2) != format(n, 0)) { info = info + " = " + fac(a, 0) + " = " + fac(a, 1); }
  info = info + " = **" + sg(ja) + "**. ";
  if (ja == 0) { info = info + "a и n имеют общий делитель, символ равен нулю."; }
  if (ja == -1) { info = info + "Символ −1, значит a — не квадрат по модулю n."; }
  if (ja == 1 && isSq(a) == 1) { info = info + "Символ +1, и a действительно квадрат: x² ≡ " + format(a, 0) + " (mod " + format(n, 0) + ") разрешимо."; }
  if (ja == 1 && isSq(a) == 0) { info = info + "Символ +1, но x² ≡ " + format(a, 0) + " (mod " + format(n, 0) + ") неразрешимо: у составного n символ +1 ещё не значит квадрат."; }
  info = info + "\n\nМультипликативность по числителю: (" + format(a, 0) + "/" + format(n, 0) + ")·(" + format(b, 0) + "/" + format(n, 0) + ") = " + sg(ja) + "·" + sg(jb) + " = " + sg(ja * jb) + " = (" + format(a * b, 0) + "/" + format(n, 0) + ") = " + sg(jab) + ".";
  info = info + "\n\nЗначение (−1/n) = " + sg(jac(n - 1)) + ": n ≡ " + format(md(n, 4), 0) + " (mod 4). Значение (2/n) = " + sg(jac(2)) + ": n ≡ " + format(md(n, 8), 0) + " (mod 8).";
}
]
