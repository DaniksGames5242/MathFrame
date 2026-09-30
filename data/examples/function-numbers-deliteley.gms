[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Делители n = p₁^k₁·p₂^k₂·p₃^k₃ — узлы «коробки» (k₁+1)×(k₂+1)×(k₃+1): узел (i, j, l) — делитель p₁ⁱ·p₂ʲ·p₃ˡ.
// Зелёные — 1 и n, жёлтые — простые делители, синие — остальные. Слои — значения показателя l. ----
draw Graph { name = "gE"; graph = "ge"; edgeColor = #3b82f688; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gB"; graph = "gb"; nodeColor = #3b82f6; nodeRadius = 17; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gP"; graph = "gp"; nodeColor = #f59e0b; nodeRadius = 17; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gT"; graph = "gt"; nodeColor = #22c55e; nodeRadius = 17; interactive = false; showWeights = false; layer = 10 }
draw Text { name = "tx1"; pos = (0, -4.0); text = t1; size = 1 }
draw Text { name = "tx2"; pos = (0, -4.6); text = t2; size = 1 }

new UI { name = "sN"; type = slider; label = "n"; variable = n; min = 1; max = 120; step = 1; default = 60 }
new UI { name = "sM"; type = slider; label = "m"; variable = m; min = 1; max = 60; step = 1; default = 14 }

// ---- Логика ----
float n = 60; float m = 14; float key = -1;
string info = ""; string t1 = ""; string t2 = "";

Update {
  if (key != n * 1000 + m) {
    key = n * 1000 + m;
    float x = n; float cnt = 0;
    float q1 = 1; float f1 = 0; float q2 = 1; float f2 = 0; float q3 = 1; float f3 = 0;
    repeat (n) { float p = i + 2; if (p <= x && md(x, p) == 0) { float e = 0; repeat (12) { if (md(x, p) == 0) { x = x / p; e = e + 1; } } cnt = cnt + 1;
      if (cnt == 1) { q1 = p; f1 = e; } if (cnt == 2) { q2 = p; f2 = e; } if (cnt == 3) { q3 = p; f3 = e; } } }
    // порядок осей: больший показатель — по горизонтали
    float a1 = q1; float b1 = f1; float a2 = q2; float b2 = f2; float a3 = q3; float b3 = f3; float sw = 0;
    if (b2 > b1) { sw = a1; a1 = a2; a2 = sw; sw = b1; b1 = b2; b2 = sw; }
    if (b3 > b1) { sw = a1; a1 = a3; a3 = sw; sw = b1; b1 = b3; b3 = sw; }
    if (b3 > b2) { sw = a2; a2 = a3; a3 = sw; sw = b2; b2 = b3; b3 = sw; }
    float un = b3 + 1; un = un * b1 + b3;
    if (un < 1) { un = 1; }
    float dx = min(1.7, 14.5 / un);
    float dy = min(1.6, 5.5 / max(b2, 1));
    float x0 = -un * dx / 2; float y0 = 0.4 + b2 * dy / 2;
    ge = newGraph(); gb = newGraph(); gp = newGraph(); gt = newGraph();
    repeat (b3 + 1) { float kk = i;
      repeat (b2 + 1) { float jj = i;
        repeat (b1 + 1) { float ii = i;
          float v = pow(a1, ii) * pow(a2, jj) * pow(a3, kk);
          string key3 = "d" + format(ii, 0) + "_" + format(jj, 0) + "_" + format(kk, 0);
          float px = x0 + (kk * (b1 + 1) + ii) * dx; float py = y0 - jj * dy;
          float sm = ii + jj + kk;
          if (sm == 0 || v == n) { addNode(gt, key3, [px, py], format(v, 0)); }
          else { if (sm == 1) { addNode(gp, key3, [px, py], format(v, 0)); } else { addNode(gb, key3, [px, py], format(v, 0)); } }
        }
      }
    }
    repeat (b3 + 1) { float kk = i;
      repeat (b2 + 1) { float jj = i;
        repeat (b1 + 1) { float ii = i;
          float px = x0 + (kk * (b1 + 1) + ii) * dx; float py = y0 - jj * dy;
          string key3 = "e" + format(ii, 0) + "_" + format(jj, 0) + "_" + format(kk, 0);
          addNode(ge, key3, [px, py]);
        }
      }
    }
    repeat (b3 + 1) { float kk = i;
      repeat (b2 + 1) { float jj = i;
        repeat (b1 + 1) { float ii = i;
          string k0 = "e" + format(ii, 0) + "_" + format(jj, 0) + "_" + format(kk, 0);
          if (ii < b1) { addEdge(ge, k0, "e" + format(ii + 1, 0) + "_" + format(jj, 0) + "_" + format(kk, 0)); }
          if (jj < b2) { addEdge(ge, k0, "e" + format(ii, 0) + "_" + format(jj + 1, 0) + "_" + format(kk, 0)); }
        }
      }
    }
    t1 = ""; t2 = "";
    if (cnt >= 1) { t1 = "→ показатель при " + format(a1, 0) + ": 0…" + format(b1, 0); }
    if (cnt >= 2) { t2 = "↓ показатель при " + format(a2, 0) + ": 0…" + format(b2, 0); if (cnt >= 3) { t2 = t2 + ";  слои — показатель при " + format(a3, 0) + ": 0…" + format(b3, 0); } }

    float tn = tau(n); float tm = tau(m); float tnm = tau(n * m); float g = gd(n, m);
    info = "**Функция числа делителей:** τ(n) — количество положительных делителей числа n. ";
    if (n == 1) { info = info + "У n = 1 единственный делитель — он сам, τ(1) = 1.\n\n"; }
    else {
      string fs = ""; string ps = "";
      if (cnt >= 1) { fs = format(q1, 0); if (f1 > 1) { fs = fs + sup(f1); } ps = "(" + format(f1, 0) + "+1)"; }
      if (cnt >= 2) { fs = fs + "·" + format(q2, 0); if (f2 > 1) { fs = fs + sup(f2); } ps = ps + "(" + format(f2, 0) + "+1)"; }
      if (cnt >= 3) { fs = fs + "·" + format(q3, 0); if (f3 > 1) { fs = fs + sup(f3); } ps = ps + "(" + format(f3, 0) + "+1)"; }
      info = info + "Для n = " + format(n, 0) + " = " + fs + " делитель однозначно задаётся набором показателей, не превосходящих показатели в разложении, поэтому **τ(" + format(n, 0) + ") = " + ps + " = " + format(tn, 0) + "**.\n\n";
    }
    string dl = ""; repeat (n) { if (md(n, i + 1) == 0) { if (dl != "") { dl = dl + ", "; } dl = dl + format(i + 1, 0); } }
    info = info + "Делители: " + dl + ". ";
    float rt = floor(sqrt(n));
    if (rt * rt == n) { info = info + "Число n — точный квадрат, все показатели чётны, все сомножители (k+1) нечётны, поэтому τ(n) нечётно."; }
    else { info = info + "Число n не квадрат, поэтому τ(n) чётно: делители разбиваются на пары d и n/d."; }
    info = info + "\n\n**Мультипликативность.** Для m = " + format(m, 0) + ": τ(m) = " + format(tm, 0) + ", τ(nm) = τ(" + format(n * m, 0) + ") = " + format(tnm, 0) + ", τ(n)·τ(m) = " + format(tn * tm, 0) + ", НОД(n, m) = " + format(g, 0) + ". ";
    if (tnm == tn * tm) { info = info + "Равенство τ(nm) = τ(n)·τ(m) выполнено"; if (g > 1) { info = info + " (случайно: числа не взаимно просты, а гарантии нет)."; } else { info = info + " — числа взаимно просты."; } }
    else { info = info + "Равенство нарушено: n и m имеют общий простой множитель, показатели складываются, а не объединяются."; }
  }
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
