[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Четыре квадрата со сторонами x₁ ≤ x₂ ≤ x₃ ≤ x₄ (целые, возможно 0): сумма их площадей равна n.
// Тонкая сетка внутри — единичные клетки, их всего n. ----
draw Graph { name = "gG"; graph = "gg"; edgeColor = #3b82f666; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 2 }
draw Graph { name = "gA"; graph = "g1"; edgeColor = #3b82f6; edgeWidth = 4; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gB"; graph = "g2"; edgeColor = #f59e0b; edgeWidth = 4; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gC"; graph = "g3"; edgeColor = #22c55e; edgeWidth = 4; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gD"; graph = "g4"; edgeWidth = 4; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Text { name = "l1"; pos = (lx1, ly1); text = tx1; size = 1.0 }
draw Text { name = "l2"; pos = (lx2, ly2); text = tx2; size = 1.0 }
draw Text { name = "l3"; pos = (lx3, ly3); text = tx3; size = 1.0 }
draw Text { name = "l4"; pos = (lx4, ly4); text = tx4; size = 1.0 }

new UI { name = "sN"; type = slider; label = "n"; variable = n; min = 1; max = 80; step = 1; default = 30 }
new UI { name = "sV"; type = slider; label = "запись №"; variable = k; min = 1; max = cnt; step = 1; default = 1 }

// ---- Логика ----
float n = 30; float k = 1; float cnt = 1; float ln = 1; float key = -1; float zero = 0;
list RA = [0]; list RB = [0]; list RC = [0]; list RD = [0];
float lx1 = 0; float ly1 = 0; float lx2 = 0; float ly2 = 0; float lx3 = 0; float ly3 = 0; float lx4 = 0; float ly4 = 0;
string tx1 = ""; string tx2 = ""; string tx3 = ""; string tx4 = ""; string info = "";

Function put(a, b, c, d) {
  if (cnt <= ln) { RA[cnt - 1] = a; RB[cnt - 1] = b; RC[cnt - 1] = c; RD[cnt - 1] = d; }
  if (cnt > ln) { push(RA, a); push(RB, b); push(RC, c); push(RD, d); ln = ln + 1; }
  return 0;
}
Function sq(g, x0, y0, s) {
  if (s > 0) {
    addNode(g, "a" + format(x0, 3), [x0, y0]); addNode(g, "b" + format(x0, 3), [x0 + s, y0]);
    addNode(g, "c" + format(x0, 3), [x0 + s, y0 + s]); addNode(g, "d" + format(x0, 3), [x0, y0 + s]);
    addEdge(g, "a" + format(x0, 3), "b" + format(x0, 3)); addEdge(g, "b" + format(x0, 3), "c" + format(x0, 3));
    addEdge(g, "c" + format(x0, 3), "d" + format(x0, 3)); addEdge(g, "d" + format(x0, 3), "a" + format(x0, 3));
  }
  return 0;
}
Function grid(x0, y0, s, u) {
  repeat (s - 1) {
    string q = format(x0, 3) + "_" + format(i, 0);
    addNode(gg, "v1" + q, [x0 + (i + 1) * u, y0]); addNode(gg, "v2" + q, [x0 + (i + 1) * u, y0 + s * u]); addEdge(gg, "v1" + q, "v2" + q);
    addNode(gg, "h1" + q, [x0, y0 + (i + 1) * u]); addNode(gg, "h2" + q, [x0 + s * u, y0 + (i + 1) * u]); addEdge(gg, "h1" + q, "h2" + q);
  }
  return 0;
}

Update {
  if (key != n) {
    key = n; cnt = 0; zero = 0;
    repeat (7) {
      float ra = i;
      repeat (10) {
        float rb = i;
        repeat (10) {
          float rc = i;
          float r = n - ra * ra - rb * rb - rc * rc;
          if (rb >= ra && rc >= rb && r >= rc * rc) {
            float rd = round(sqrt(r));
            if (rd * rd == r) { cnt = cnt + 1; put(ra, rb, rc, rd); if (ra == 0) { zero = 1; } }
          }
        }
      }
    }
    k = 1;
  }
  float ix = k - 1; if (ix > cnt - 1) { ix = cnt - 1; } if (ix < 0) { ix = 0; }
  float s1 = RA[ix]; float s2 = RB[ix]; float s3 = RC[ix]; float s4 = RD[ix];
  float sc = min(1, 14.4 / (s1 + s2 + s3 + s4 + 1.5));
  float gap = 0.5; float u = sc;
  float x0 = -(u * (s1 + s2 + s3 + s4) + 3 * gap) / 2; float y0 = -4.2;
  g1 = newGraph(); g2 = newGraph(); g3 = newGraph(); g4 = newGraph(); gg = newGraph();
  sq(g1, x0, y0, s1 * u); grid(x0, y0, s1, u);
  float xb = x0 + u * s1 + gap; sq(g2, xb, y0, s2 * u); grid(xb, y0, s2, u);
  float xc = xb + u * s2 + gap; sq(g3, xc, y0, s3 * u); grid(xc, y0, s3, u);
  float xd = xc + u * s3 + gap; sq(g4, xd, y0, s4 * u); grid(xd, y0, s4, u);
  lx1 = x0 + u * s1 / 2; ly1 = y0 + u * s1 + 0.45; tx1 = "x₁ = " + format(s1, 0);
  lx2 = xb + u * s2 / 2; ly2 = y0 + u * s2 + 0.45; tx2 = "x₂ = " + format(s2, 0);
  lx3 = xc + u * s3 / 2; ly3 = y0 + u * s3 + 0.45; tx3 = "x₃ = " + format(s3, 0);
  lx4 = xd + u * s4 / 2; ly4 = y0 + u * s4 + 0.45; tx4 = "x₄ = " + format(s4, 0);
  float m = n; repeat (4) { if (m - 4 * floor(m / 4) == 0) { m = m / 4; } }
  float bad = 0; if (m - 8 * floor(m / 8) == 7) { bad = 1; }
  info = "**Теорема Лагранжа:** каждое натуральное n записывается как n = x₁² + x₂² + x₃² + x₄² с целыми xᵢ (нули разрешены).\n\n";
  info = info + "**n = " + format(n, 0) + ":** " + format(s1, 0) + "² + " + format(s2, 0) + "² + " + format(s3, 0) + "² + " + format(s4, 0) + "² = " + format(s1 * s1, 0) + " + " + format(s2 * s2, 0) + " + " + format(s3 * s3, 0) + " + " + format(s4 * s4, 0) + " = " + format(s1 * s1 + s2 * s2 + s3 * s3 + s4 * s4, 0) + ". Записей с 0 ≤ x₁ ≤ x₂ ≤ x₃ ≤ x₄ всего " + format(cnt, 0) + ".\n\n";
  if (bad > 0.5) { info = info + "Число n имеет вид 4ᵃ(8b + 7), поэтому тремя квадратами не записывается: четыре необходимы."; }
  if (bad < 0.5) { info = info + "Здесь хватает и трёх квадратов (есть запись с x₁ = 0); четыре нужны для чисел вида 4ᵃ(8b + 7), например n = 7, 15, 23, 28."; }
}
]
