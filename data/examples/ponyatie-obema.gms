[
description = "{info}"

field width = 12;
field height = 9.5;
camera type = fixed;

// ---- Прямоугольный параллелепипед a × b × c из единичных кубов (косая проекция).
// Плоскость x = k делит его на две части — оранжевую и синюю (аддитивность). ----
draw Graph { name = "gp2"; graph = "g2"; nodeRadius = 0; edgeWidth = 2; edgeColor = #3b82f6; labels = false; interactive = false }
draw Graph { name = "gp1"; graph = "g1"; nodeRadius = 0; edgeWidth = 2; edgeColor = #f59e0b; labels = false; interactive = false }

new UI { name = "sA"; type = slider; label = "a"; variable = a; min = 1; max = 6; step = 1; default = 4 }
new UI { name = "sB"; type = slider; label = "b"; variable = b; min = 1; max = 6; step = 1; default = 3 }
new UI { name = "sC"; type = slider; label = "c"; variable = c; min = 1; max = 6; step = 1; default = 2 }
new UI { name = "sK"; type = slider; label = "разрез k"; variable = k; min = 0; max = a; step = 1; default = 1 }

float a = 4; float b = 3; float c = 2; float k = 1;
float key = -1;
string info = "";

Function nk(x, y, z) { return "" + x + "_" + y + "_" + z; }

Update {
  if (k > a) { k = a; }
  float kk = a * 1000000 + b * 10000 + c * 100 + k;
  if (kk != key) {
    key = kk;
    g1 = newGraph(); g2 = newGraph();
    float ox = -(a + 0.5 * c) / 2; float oy = -(b + 0.35 * c) / 2;
    float nx = a + 1; float ny = b + 1;
    repeat (nx * ny * (c + 1)) {
      float q = floor(i / nx); float ix = i - q * nx;
      float iz = floor(q / ny); float iy = q - iz * ny;
      float px = ox + ix + 0.5 * iz; float py = oy + iy + 0.35 * iz;
      // рёбра из точки вдоль осей; ребро вдоль x лежит в левой части, если ix + 1 ≤ k
      if (ix < a) {
        if (ix + 1 <= k) { addNode(g1, nk(ix, iy, iz), [px, py]); addNode(g1, nk(ix + 1, iy, iz), [px + 1, py]); addEdge(g1, nk(ix, iy, iz), nk(ix + 1, iy, iz)); }
        if (ix >= k) { addNode(g2, nk(ix, iy, iz), [px, py]); addNode(g2, nk(ix + 1, iy, iz), [px + 1, py]); addEdge(g2, nk(ix, iy, iz), nk(ix + 1, iy, iz)); }
      }
      if (iy < b) {
        if (ix <= k) { addNode(g1, nk(ix, iy, iz), [px, py]); addNode(g1, nk(ix, iy + 1, iz), [px, py + 1]); addEdge(g1, nk(ix, iy, iz), nk(ix, iy + 1, iz)); }
        if (ix >= k) { addNode(g2, nk(ix, iy, iz), [px, py]); addNode(g2, nk(ix, iy + 1, iz), [px, py + 1]); addEdge(g2, nk(ix, iy, iz), nk(ix, iy + 1, iz)); }
      }
      if (iz < c) {
        if (ix <= k) { addNode(g1, nk(ix, iy, iz), [px, py]); addNode(g1, nk(ix, iy, iz + 1), [px + 0.5, py + 0.35]); addEdge(g1, nk(ix, iy, iz), nk(ix, iy, iz + 1)); }
        if (ix >= k) { addNode(g2, nk(ix, iy, iz), [px, py]); addNode(g2, nk(ix, iy, iz + 1), [px + 0.5, py + 0.35]); addEdge(g2, nk(ix, iy, iz), nk(ix, iy, iz + 1)); }
      }
    }
  }
  float V = a * b * c; float V1 = k * b * c; float V2 = (a - k) * b * c;
  info = "**Объём** — число единичных кубов, из которых составлено тело: единичному кубу приписан объём 1. Параллелепипед " + a + " × " + b + " × " + c + " состоит из " + a + " · " + b + " · " + c + " = " + V + " кубов, поэтому V = abc = " + V + ".\n\n**Аддитивность:** плоскость x = " + k + " делит тело на две части без общих внутренних точек, V₁ = " + k + " · " + b + " · " + c + " = " + V1 + " и V₂ = " + (a - k) + " · " + b + " · " + c + " = " + V2 + ", V₁ + V₂ = " + (V1 + V2) + " = V.";
}
]
