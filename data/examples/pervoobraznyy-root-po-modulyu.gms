[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Остатки 1…p−1 по кругу; путь g⁰ → g¹ → g² → … (mod p) ----
// Посещённые остатки — синие, непосещённые — серые. Если путь обходит все p − 1 остатков,
// g — первообразный корень по модулю p.
draw Graph { name = "gPath"; graph = "gp"; nodeColor = #3b82f6; edgeColor = #f59e0b; nodeRadius = 13; directed = true; interactive = false; showWeights = false }
draw Graph { name = "gRest"; graph = "gr"; nodeColor = #6b7280; nodeRadius = 13; interactive = false; showWeights = false }

new UI { name = "sP"; type = select; label = "p"; variable = p; options = (5, 7, 11, 13, 17, 19, 23); default = 11 }
new UI { name = "sG"; type = slider; label = "g"; variable = g; min = 2; max = p - 1; step = 1; default = 2 }

// ---- Логика ----
float p = 11;
float g = 2;
float lastKey = -1;
float ord = 0;
string powers = "";
string info = "";

Function md(a, m) { return a - floor(a / m) * m; }
Function pos(k, R) { return [R * cos(pi / 2 - 2 * pi * (k - 1) / (p - 1)), R * sin(pi / 2 - 2 * pi * (k - 1) / (p - 1))]; }

// Является ли k степенью g по модулю p (встречается ли на пути)
Function isPow(k) {
  float x = 1;
  repeat (ord) { if (x == k) { return true; } x = md(x * g, p); }
  return false;
}

Update {
  if (g > p - 1) { g = p - 1; }
  if (p * 100 + g != lastKey) {
    gp = newGraph(); gr = newGraph();
    // Порядок g: наименьшее k > 0 с g^k ≡ 1
    float x = 1; ord = 0; powers = "";
    repeat (p - 1) {
      if (ord == 0) {
        addNode(gp, format(x, 0), pos(x, 4.2));
        if (i < 8) { powers = powers + "g" + format(i, 0) + " ≡ " + format(x, 0) + ", "; }
        float nx = md(x * g, p);
        addEdge(gp, format(x, 0), format(nx, 0));
        x = nx;
        if (x == 1) { ord = i + 1; }
      }
    }
    repeat (p - 1) {
      float k = i + 1;
      if (!isPow(k)) { addNode(gr, format(k, 0), pos(k, 4.2)); }
    }
    lastKey = p * 100 + g;
  }
  info = "**Первообразный корень по модулю p** — число g, степени которого g¹, g², …, g^(p−1) дают все ненулевые остатки по модулю p (путь по стрелкам обходит весь круг).\n\np = " + format(p, 0) + ", g = " + format(g, 0) + ": порядок g равен " + format(ord, 0) + " (g^" + format(ord, 0) + " ≡ 1).";
  if (ord == p - 1) { info = info + " Это **первообразный корень**: путь обходит все " + format(p - 1, 0) + " остатков."; }
  else { info = info + " Не первообразный: путь замыкается раньше и посещает только " + format(ord, 0) + " из " + format(p - 1, 0) + " остатков. Порядок всегда делит p − 1."; }
}
]
