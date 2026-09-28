[
description = "{info}"

field width = 18;
field height = 11;
camera type = fixed;

// ---- Гипотеза «n² + n + 41 всегда простое»: подтверждается для n = 0…39, но при n = 40
// значение равно 41² — составное. Столбики — значение выражения (высота), цвет — простое
// оно или нет; ползунок n подсвечивает проверяемый столбик и его статус. ----
draw Graph { name = "gB"; graph = "gb"; edgeWidth = 6; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gCur"; graph = "gc"; nodeColor = #f59e0b; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Text { name = "tv"; pos = (0, 4.7); text = "n = " + format(n, 0) + "; n² + n + 41 = " + format(val, 0); size = 1.15 }
draw Text { name = "tc"; pos = (0, 3.7); text = checkText; size = 1.05; color = checkCol }

new UI { name = "sN"; type = slider; label = "n"; variable = n; min = 0; max = 45; step = 1; default = 39 }

float n = 39; float val = 0;
string checkText = ""; string checkCol = "#6b7280";
string info = "";

Function md(a, b) { return a - floor(a / b) * b; }
Function isPrimeF(v) {
  if (v < 2) { return 0; }
  float ok = 1; float d = 2;
  repeat (80) { if (d * d <= v && ok == 1) { if (md(v, d) == 0) { ok = 0; } } d = d + 1; }
  return ok;
}
Function px(k) { return -8.6 + 17.2 * (k + 0.5) / 46; }
Function factorHint(k) { if (k == 40) { return "41 · 41"; } if (k == 41) { return "41 · 43"; } return format(k * k + k + 41, 0); }

Update {
  val = n * n + n + 41;
  gb = newGraph(); gc = newGraph();
  repeat (46) {
    float v = i * i + i + 41;
    float h = 3.3 * sqrt(v) / sqrt(1721);
    string col = "#22c55e"; if (isPrimeF(v) < 0.5) { col = "#f59e0b"; }
    addNode(gb, "p" + format(i, 0), [px(i), -2.5]); addNode(gb, "q" + format(i, 0), [px(i), -2.5 + h]); addEdge(gb, "p" + format(i, 0), "q" + format(i, 0), 1, col);
  }
  addNode(gc, "cur", [px(n), -2.5 + 3.3 * sqrt(val) / sqrt(1721) + 0.35]);

  if (isPrimeF(val) > 0.5) { checkText = format(val, 0) + " — простое: пока гипотеза не опровергнута"; checkCol = "#22c55e"; }
  else { checkText = format(val, 0) + " = " + factorHint(n) + " — составное: контрпример найден"; checkCol = "#f59e0b"; }

  info = "**Гипотеза** — недоказанное предположение, проверяемое на частных случаях: одного контрпримера достаточно для опровержения. Формула n² + n + 41 (Эйлер) даёт простое число для n = 0, 1, 2, …, 39 подряд — соблазнительно счесть её всегда верной, но это лишь гипотеза, пока не проверены все n.\n\nПри n = 40 значение равно 40² + 40 + 41 = 41² — составное, и гипотеза «формула всегда даёт простое число» опровергнута.";
}
]
