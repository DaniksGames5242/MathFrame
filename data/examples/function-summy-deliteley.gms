[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Мозаика: ширина столбца — делитель d числа a, высота строки — делитель e числа b, клетка (d, e) подписана произведением d·e,
// её площадь пропорциональна d·e. Зелёные клетки — новые делители произведения ab, жёлтые — повторы уже встречавшегося
// значения (у взаимно простых a и b повторов нет). Сумма всех клеток — σ(a)·σ(b), сумма зелёных — σ(ab). ----
draw Graph { name = "gGe"; graph = "gge"; edgeColor = #22c55e; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; edgeCap = butt; layer = 5 }
draw Graph { name = "gYe"; graph = "gye"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; edgeCap = butt; layer = 6 }
draw Graph { name = "gLb"; graph = "glb"; nodeColor = #3b82f633; nodeRadius = 15; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gAx"; graph = "gax"; nodeColor = #3b82f6; nodeRadius = 13; interactive = false; showWeights = false; layer = 10 }
draw Text { name = "tA"; pos = (3.2, 3.9); text = "сверху — делители d числа a"; size = 0.95; align = left }
draw Text { name = "tB"; pos = (3.2, 3.2); text = "слева — делители e числа b"; size = 0.95; align = left }

new UI { name = "sA"; type = slider; label = "a"; variable = a; min = 1; max = 36; step = 1; default = 6 }
new UI { name = "sB"; type = slider; label = "b"; variable = b; min = 1; max = 36; step = 1; default = 10 }

// ---- Логика ----
float a = 6; float b = 10; float key = -1;
string info = "";

// k-й по порядку делитель числа n
Function dv(n, k) { float c = 0; float r = 0; repeat (n) { if (md(n, i + 1) == 0) { c = c + 1; if (c == k) { r = i + 1; } } } return r; }
// σ(p^k) для каждой простой степени в разложении n
Function sfac(n) {
  if (n == 1) { return "σ(1) = 1"; }
  string s = ""; float x = n;
  repeat (n) { float p = i + 2; if (p <= x && md(x, p) == 0) { float e = 0; repeat (12) { if (md(x, p) == 0) { x = x / p; e = e + 1; } }
    if (s != "") { s = s + "; "; }
    s = s + "σ(" + format(p, 0); if (e > 1) { s = s + sup(e); } s = s + ") = (" + format(p, 0) + sup(e + 1) + " − 1)/(" + format(p, 0) + " − 1) = " + format((pow(p, e + 1) - 1) / (p - 1), 0); } }
  return s;
}

Update {
  if (key != a * 100 + b) {
    key = a * 100 + b;
    float ta = tau(a); float tb = tau(b); float sa = sig(a); float sb = sig(b);
    float sx = 9.0 / sa; float sy = 7.0 / sb;
    float x0 = -7.0; float y0 = 3.9;
    gge = newGraph(); gye = newGraph(); glb = newGraph(); gax = newGraph();
    float sg = 0;
    list seen = [0];
    // seen хранит найденные значения d·e
    float ns = 0;
    float cx = x0;
    repeat (ta) { float ii = i + 1; float d = dv(a, ii);
      addNode(gax, "h" + format(ii, 0), [cx + d * sx / 2, y0 + 0.45], format(d, 0));
      float cy = y0;
      repeat (tb) { float jj = i + 1; float e = dv(b, jj); float pr = d * e;
        // повтор ли это значение
        float dup = 0;
        repeat (ns + 1) { if (seen[i] == pr) { dup = 1; } }
        if (dup == 0) { push(seen, pr); ns = ns + 1; sg = sg + pr; }
        string k0 = "c" + format(ii, 0) + "_" + format(jj, 0);
        float w = d * sx; float h = e * sy;
        string c1 = k0 + "a"; string c2 = k0 + "b"; string c3 = k0 + "c"; string c4 = k0 + "d";
        if (dup == 0) {
          addNode(gge, c1, [cx, cy]); addNode(gge, c2, [cx + w, cy]); addNode(gge, c3, [cx + w, cy - h]); addNode(gge, c4, [cx, cy - h]);
          addEdge(gge, c1, c2); addEdge(gge, c2, c3); addEdge(gge, c3, c4); addEdge(gge, c4, c1);
        } else {
          addNode(gye, c1, [cx, cy]); addNode(gye, c2, [cx + w, cy]); addNode(gye, c3, [cx + w, cy - h]); addNode(gye, c4, [cx, cy - h]);
          addEdge(gye, c1, c2); addEdge(gye, c2, c3); addEdge(gye, c3, c4); addEdge(gye, c4, c1);
        }
        if (w > 0.75 && h > 0.5) { addNode(glb, k0, [cx + w / 2, cy - h / 2], format(pr, 0)); }
        if (ii == 1) { addNode(gax, "v" + format(jj, 0), [x0 - 0.55, cy - h / 2], format(e, 0)); }
        cy = cy - h;
      }
      cx = cx + d * sx;
    }
    float sab = sig(a * b);
    info = "**Функция суммы делителей:** σ(n) — сумма всех положительных делителей n, включая 1 и n. Для простой степени это сумма геометрической прогрессии: σ(pᵏ) = 1 + p + … + pᵏ = (pᵏ⁺¹ − 1)/(p − 1). ";
    info = info + "Для a = " + fac(a) + ": " + sfac(a) + ", итого **σ(" + format(a, 0) + ") = " + format(sa, 0) + "**. Для b = " + fac(b) + ": " + sfac(b) + ", итого **σ(" + format(b, 0) + ") = " + format(sb, 0) + "**.\n\n";
    info = info + "**Мозаика:** все клетки в сумме дают σ(a)·σ(b) = " + format(sa, 0) + "·" + format(sb, 0) + " = " + format(sa * sb, 0) + ", а зелёные (разные значения d·e — то есть делители произведения ab) дают σ(ab) = σ(" + format(a * b, 0) + ") = " + format(sab, 0) + ". ";
    if (gd(a, b) == 1) { info = info + "Числа взаимно просты (НОД = 1): каждый делитель произведения получается из пары (d, e) единственным образом, повторов нет, и σ(ab) = σ(a)·σ(b) — мультипликативность."; }
    else { info = info + "НОД(a, b) = " + format(gd(a, b), 0) + " > 1: одни и те же значения d·e повторяются (жёлтые клетки), и σ(ab) < σ(a)·σ(b) — мультипликативность здесь не работает."; }
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
