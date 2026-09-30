[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Целочисленная решётка и окружность x² + y² = p. Оранжевые точки — представления p = a² + b². ----
draw Graph { name = "gL"; graph = "gl"; nodeRadius = 2; labels = false; interactive = false; showWeights = false; layer = 2 }
draw Graph { name = "gM"; graph = "gm"; nodeColor = #f59e0b; nodeRadius = 7; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gX"; graph = "gx"; edgeColor = #3b82f6aa; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
new Curve { name = "circ"; type = parametric; x = "rr * cos(6.2831853 * t)"; y = "rr * sin(6.2831853 * t)"; segments = 120; thickness = 3; color = #3b82f6 }

new UI { name = "sP"; type = slider; label = "p"; variable = p; min = 2; max = 100; step = 1; default = 13 }

// ---- Логика ----
float p = 13; float rr = 1; float key = -1; float u = 0.45; float cnt = 0; float fa = 0; float fb = 0;
string info = "";
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function md(x, m) { return x - m * floor(x / m); }
Function isp(x) {
  if (x < 2) { return 0; }
  float r = 1;
  repeat (10) { float d = i + 2; if (d * d <= x && md(x, d) == 0) { r = 0; } }
  return r;
}

Update {
  rr = sqrt(p) * u;
  if (key != p) {
    key = p; cnt = 0; fa = 0; fb = 0;
    gl = newGraph(); gm = newGraph(); gx = newGraph();
    addNode(gx, "x1", [-10 * u, 0]); addNode(gx, "x2", [10 * u, 0]); addEdge(gx, "x1", "x2");
    addNode(gx, "y1", [0, -10 * u]); addNode(gx, "y2", [0, 10 * u]); addEdge(gx, "y1", "y2");
    repeat (21) {
      float a = i - 10;
      repeat (21) {
        float b = i - 10;
        string k = format(a + 10, 0) + "_" + format(b + 10, 0);
        if (a * a + b * b == p) {
          addNode(gm, k, [a * u, b * u]); cnt = cnt + 1;
          if (a >= b && b >= 0) { fa = a; fb = b; }
        }
        if (a * a + b * b != p) { addNode(gl, k, [a * u, b * u]); }
      }
    }
  }
  float pr = isp(p); float m4 = md(p, 4);
  info = "**Теорема Ферма:** простое p представимо в виде p = a² + b² с целыми a, b тогда и только тогда, когда p = 2 или p ≡ 1 (mod 4).\n\n";
  info = info + "**p = " + format(p, 0) + "**, p mod 4 = " + format(m4, 0) + ". На окружности x² + y² = p лежит целых точек: " + format(cnt, 0) + " (оранжевые).\n\n";
  if (cnt > 0) { info = info + "Например, " + format(p, 0) + " = " + format(fa, 0) + "² + " + format(fb, 0) + "² = " + format(fa * fa, 0) + " + " + format(fb * fb, 0) + "."; }
  if (cnt == 0 && pr > 0.5) { info = info + "Здесь p простое и p ≡ 3 (mod 4): точек на окружности нет, как и утверждает теорема."; }
  if (cnt == 0 && pr < 0.5) { info = info + "Число p составное, теорема о нём ничего не говорит; на окружности точек нет."; }
  if (cnt > 0 && pr < 0.5) { info = info + " Число p составное, для него теорема не утверждает ничего."; }
}
]
