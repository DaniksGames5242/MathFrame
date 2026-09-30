[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Дерево шаров: корень — все p-адические целые, дальше p ветвей по цифре e₀, затем по цифре e₁.
// Оранжевый путь — число x = a/b (его единичная часть u). Внизу — p-адическая запись x. ----
draw Graph { name = "gT"; graph = "gt"; edgeColor = #3b82f6; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gN"; graph = "gn"; nodeRadius = 13; labels = true; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gL"; graph = "gl"; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gP"; graph = "gp"; edgeWidth = 4; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gQ"; graph = "gq"; nodeColor = #f59e0b; nodeRadius = 13; labels = true; interactive = false; showWeights = false; layer = 12 }
draw Graph { name = "gM"; graph = "gm"; nodeColor = #f59e0b; nodeRadius = 8; labels = false; interactive = false; showWeights = false; layer = 12 }
draw Text { name = "t0"; pos = (-7.7, 2.2); text = "e₀"; size = 1.1; align = left }
draw Text { name = "t1"; pos = (-7.7, 0.2); text = "e₁"; size = 1.1; align = left }
draw Text { name = "tx"; pos = (0, -2.6); text = "x = " + ds; size = 1.5 }

new UI { name = "sP"; type = select; label = "простое p"; variable = sp; options = ("2", "3", "5", "7"); default = "3" }
new UI { name = "sA"; type = slider; label = "a"; variable = a; min = -60; max = 60; step = 1; default = -1 }
new UI { name = "sB"; type = slider; label = "b"; variable = b; min = 1; max = 30; step = 1; default = 1 }

// ---- Логика ----
string sp = "3"; float p = 3; float a = -1; float b = 1;
float v = 0; float uA = 1; float uB = 1; float iv = 1; float nd = 9;
float key = -1; string ds = ""; string info = "";

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function md(x, m) { return x - m * floor(x / m); }
// показатель, с которым p входит в x
Function vp(x) { float c = 0; repeat (12) { if (x != 0 && md(x, p) == 0) { x = x / p; c = c + 1; } } return c; }
// цифра eⱼ единичной части u = uA / uB
Function dig(j) {
  float n = uA; float d = 0;
  repeat (j + 1) { d = md(n * iv, p); n = (n - d * uB) / p; }
  return d;
}
Function dstr() {
  string s = ""; float k = min(v, 0) + nd - 1;
  repeat (nd) {
    float dj = 0; if (k >= v) { dj = dig(k - v); }
    s = s + format(dj, 0);
    if (k == 0 && v < 0) { s = s + ","; }
    k = k - 1;
  }
  return "…" + s + " (по степеням p)";
}

Update {
  p = 2; if (sp == "3") { p = 3; } if (sp == "5") { p = 5; } if (sp == "7") { p = 7; }
  float kk = ((a + 100) * 100 + b) * 10 + p;
  if (key != kk) {
    key = kk;
    float va = vp(a); float vb = vp(b);
    v = va - vb; uA = a / pow(p, va); uB = b / pow(p, vb);
    iv = 1; repeat (p) { if (md(i * md(uB, p), p) == 1) { iv = i; } }
    ds = dstr();
    gt = newGraph(); gn = newGraph(); gl = newGraph(); gp = newGraph(); gq = newGraph(); gm = newGraph();
    addNode(gt, "r", [0, 4.2]); addNode(gn, "r", [0, 4.2], "");
    float e0 = dig(0); float e1 = dig(1);
    repeat (p) {
      float c = i; float cx = -6.6 + 13.2 * (c + 0.5) / p;
      addNode(gt, "c" + format(c, 0), [cx, 2.2]); addNode(gn, "c" + format(c, 0), [cx, 2.2], format(c, 0));
      addEdge(gt, "r", "c" + format(c, 0));
      repeat (p) {
        float lx = -7 + 14 * (c * p + i + 0.5) / (p * p);
        addNode(gt, "l" + format(c, 0) + "_" + format(i, 0), [lx, 0.2]); addNode(gl, "l" + format(c, 0) + "_" + format(i, 0), [lx, 0.2]);
        addEdge(gt, "c" + format(c, 0), "l" + format(c, 0) + "_" + format(i, 0));
      }
    }
    if (a != 0) {
      float px = -6.6 + 13.2 * (e0 + 0.5) / p; float lx2 = -7 + 14 * (e0 * p + e1 + 0.5) / (p * p);
      addNode(gp, "r", [0, 4.2]); addNode(gp, "c", [px, 2.2]); addNode(gp, "l", [lx2, 0.2]);
      addEdge(gp, "r", "c", 1, "#f59e0b"); addEdge(gp, "c", "l", 1, "#f59e0b");
      addNode(gq, "c", [px, 2.2], format(e0, 0)); addNode(gm, "l", [lx2, 0.2]);
    }
  }
  string ps = format(p, 0);
  string sb = "₂"; if (p == 3) { sb = "₃"; } if (p == 5) { sb = "₅"; } if (p == 7) { sb = "₇"; }
  info = "**Поле ℚ" + sb + " p-адических чисел, p = " + ps + ".** Число x = a/b = " + num(a, 0) + "/" + format(b, 0) + " записывается «влево бесконечным» рядом x = ∑ eₖ pᵏ, цифры eₖ ∈ {0, …, " + format(p - 1, 0) + "}; близки те числа, у которых совпадают младшие цифры.\n\n";
  if (a == 0) { info = info + "x = 0: все цифры равны нулю, ‖x‖ = 0."; }
  if (a != 0) {
    float nrm = pow(p, -v);
    string ns = "1"; if (v > 0) { ns = "1/" + format(pow(p, v), 0); } if (v < 0) { ns = format(pow(p, -v), 0); }
    info = info + "**Запись:** x = " + ds + ".\n\n**Норма:** x = pᵛ·u, v = " + num(v, 0) + ", u — p-адическая единица (e₀ = " + format(dig(0), 0) + " ≠ 0); ‖x‖ = p⁻ᵛ = " + ns + ". Чем сильнее x делится на p, тем он «меньше».\n\n";
    info = info + "**Обратный элемент:** 1/x = b/a имеет v = " + num(-v, 0) + " и норму " + format(1 / nrm, 4) + " — ненулевые элементы образуют группу по умножению. Частичная сумма из m цифр отличается от x на число, делящееся на p" + "ᵐ⁺ᵛ.";
  }
}
]
