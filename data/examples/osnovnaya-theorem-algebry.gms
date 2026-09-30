[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Слева — коэффициенты c₀ … cₙ₋₁ многочлена zⁿ + cₙ₋₁zⁿ⁻¹ + … + c₀ (точки комплексной плоскости, тяните их).
// Справа — его корни (оранжевые), найденные итерациями; их ровно n с учётом кратности. ----
draw Graph { name = "gF"; graph = "gf"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gR"; graph = "gr"; nodeColor = #f59e0b; nodeRadius = 11; labels = true; interactive = false; showWeights = false; layer = 10 }
draw Text { name = "tl"; pos = (-4.2, 4.6); text = "коэффициенты cₖ"; size = 1.0 }
draw Text { name = "tr"; pos = (4.2, 4.6); text = "корни z₁ … zₙ"; size = 1.0 }

new Point { name = "c0"; pos = (-5.2, -1.5); text = true("c₀"); pauseOnDrag = false }
new Point { name = "c1"; pos = (-3.0, 1.5); text = true("c₁"); pauseOnDrag = false; active = n > 1 }
new Point { name = "c2"; pos = (-4.5, 2.0); text = true("c₂"); pauseOnDrag = false; active = n > 2 }
new Point { name = "c3"; pos = (-2.5, -2.0); text = true("c₃"); pauseOnDrag = false; active = n > 3 }
new Point { name = "c4"; pos = (-4.2, 0.5); text = true("c₄"); pauseOnDrag = false; active = n > 4 }
new UI { name = "sN"; type = slider; label = "степень n"; variable = n; min = 1; max = 5; step = 1; default = 3 }

// ---- Логика ----
float n = 3; float key = -1; float res = 0; float ox = -4.2; float rx = 4.2; float rs = 0.7;
list CR = [0, 0, 0, 0, 0]; list CI = [0, 0, 0, 0, 0]; list ZR = [0, 0, 0, 0, 0]; list ZI = [0, 0, 0, 0, 0];
string info = "";
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function cx(a, b) {
  if (abs(b) < 0.005) { return num(a, 2); }
  if (b < 0) { return num(a, 2) + " − " + format(-b, 2) + "i"; }
  return num(a, 2) + " + " + format(b, 2) + "i";
}
Function frame(g, x0) {
  addNode(g, "a" + format(x0, 1), [x0 - 3.5, -3.5]); addNode(g, "b" + format(x0, 1), [x0 + 3.5, -3.5]);
  addNode(g, "c" + format(x0, 1), [x0 + 3.5, 3.5]); addNode(g, "d" + format(x0, 1), [x0 - 3.5, 3.5]);
  addEdge(g, "a" + format(x0, 1), "b" + format(x0, 1)); addEdge(g, "b" + format(x0, 1), "c" + format(x0, 1));
  addEdge(g, "c" + format(x0, 1), "d" + format(x0, 1)); addEdge(g, "d" + format(x0, 1), "a" + format(x0, 1));
  addNode(g, "h1" + format(x0, 1), [x0 - 3.5, 0]); addNode(g, "h2" + format(x0, 1), [x0 + 3.5, 0]); addEdge(g, "h1" + format(x0, 1), "h2" + format(x0, 1));
  addNode(g, "v1" + format(x0, 1), [x0, -3.5]); addNode(g, "v2" + format(x0, 1), [x0, 3.5]); addEdge(g, "v1" + format(x0, 1), "v2" + format(x0, 1));
  return 0;
}

Update {
  // точки коэффициентов держим в левой рамке (правим только при выходе)
  if (c0.pos.x < ox - 3.5) { c0.pos.x = ox - 3.5; } if (c0.pos.x > ox + 3.5) { c0.pos.x = ox + 3.5; } if (c0.pos.y < -3.5) { c0.pos.y = -3.5; } if (c0.pos.y > 3.5) { c0.pos.y = 3.5; }
  if (c1.pos.x < ox - 3.5) { c1.pos.x = ox - 3.5; } if (c1.pos.x > ox + 3.5) { c1.pos.x = ox + 3.5; } if (c1.pos.y < -3.5) { c1.pos.y = -3.5; } if (c1.pos.y > 3.5) { c1.pos.y = 3.5; }
  if (c2.pos.x < ox - 3.5) { c2.pos.x = ox - 3.5; } if (c2.pos.x > ox + 3.5) { c2.pos.x = ox + 3.5; } if (c2.pos.y < -3.5) { c2.pos.y = -3.5; } if (c2.pos.y > 3.5) { c2.pos.y = 3.5; }
  if (c3.pos.x < ox - 3.5) { c3.pos.x = ox - 3.5; } if (c3.pos.x > ox + 3.5) { c3.pos.x = ox + 3.5; } if (c3.pos.y < -3.5) { c3.pos.y = -3.5; } if (c3.pos.y > 3.5) { c3.pos.y = 3.5; }
  if (c4.pos.x < ox - 3.5) { c4.pos.x = ox - 3.5; } if (c4.pos.x > ox + 3.5) { c4.pos.x = ox + 3.5; } if (c4.pos.y < -3.5) { c4.pos.y = -3.5; } if (c4.pos.y > 3.5) { c4.pos.y = 3.5; }
  CR[0] = c0.pos.x - ox; CI[0] = c0.pos.y; CR[1] = c1.pos.x - ox; CI[1] = c1.pos.y; CR[2] = c2.pos.x - ox; CI[2] = c2.pos.y;
  CR[3] = c3.pos.x - ox; CI[3] = c3.pos.y; CR[4] = c4.pos.x - ox; CI[4] = c4.pos.y;
  float kk = n * 1000 + CR[0] * 7 + CI[0] * 11 + CR[1] * 13 + CI[1] * 17 + CR[2] * 19 + CI[2] * 23 + CR[3] * 29 + CI[3] * 31 + CR[4] * 37 + CI[4] * 41;
  if (key != kk) {
    key = kk;
    float rad = 1; repeat (n) { float cm = sqrt(CR[i] * CR[i] + CI[i] * CI[i]); if (cm + 1 > rad) { rad = cm + 1; } }
    repeat (n) { float a0 = 6.2831853 * i / n + 0.4; ZR[i] = rad * 0.6 * cos(a0); ZI[i] = rad * 0.6 * sin(a0); }
    repeat (150) {
      repeat (n) {
        float j = i; float zr = ZR[j]; float zi = ZI[j];
        float pr = 1; float pi = 0;
        repeat (n) {
          float kx = n - 1 - i;
          float t = pr * zr - pi * zi + CR[kx]; pi = pr * zi + pi * zr + CI[kx]; pr = t;
        }
        float dr = 1; float di = 0;
        repeat (n) {
          if (i != j) { float er = zr - ZR[i]; float ei = zi - ZI[i]; float t2 = dr * er - di * ei; di = dr * ei + di * er; dr = t2; }
        }
        float q = dr * dr + di * di; if (q < 0.0000000001) { q = 0.0000000001; }
        ZR[j] = zr - (pr * dr + pi * di) / q; ZI[j] = zi - (pi * dr - pr * di) / q;
      }
    }
    gf = newGraph(); gr = newGraph();
    frame(gf, ox); frame(gf, rx);
    res = 0;
    repeat (n) {
      float j2 = i; float zr2 = ZR[j2]; float zi2 = ZI[j2];
      float pr2 = 1; float pi2 = 0;
      repeat (n) { float k2 = n - 1 - i; float t3 = pr2 * zr2 - pi2 * zi2 + CR[k2]; pi2 = pr2 * zi2 + pi2 * zr2 + CI[k2]; pr2 = t3; }
      float rm = sqrt(pr2 * pr2 + pi2 * pi2); if (rm > res) { res = rm; }
      float sx = zr2 * rs; float sy = zi2 * rs;
      if (sx > 3.4) { sx = 3.4; } if (sx < -3.4) { sx = -3.4; } if (sy > 3.4) { sy = 3.4; } if (sy < -3.4) { sy = -3.4; }
      addNode(gr, "z" + format(j2, 0), [rx + sx, sy], format(j2 + 1, 0));
    }
  }
  info = "**Основная теорема алгебры:** всякий многочлен степени n ≥ 1 с комплексными коэффициентами имеет корень в ℂ, а значит раскладывается на n линейных множителей: p(z) = (z − z₁)(z − z₂)…(z − zₙ).\n\n";
  info = info + "**Многочлен степени " + format(n, 0) + ":** коэффициенты c₀ = " + cx(CR[0], CI[0]);
  if (n > 1) { info = info + ", c₁ = " + cx(CR[1], CI[1]); }
  if (n > 2) { info = info + ", c₂ = " + cx(CR[2], CI[2]); }
  if (n > 3) { info = info + ", c₃ = " + cx(CR[3], CI[3]); }
  if (n > 4) { info = info + ", c₄ = " + cx(CR[4], CI[4]); }
  info = info + ". Корней с учётом кратности ровно " + format(n, 0) + ":\n\n";
  repeat (n) { info = info + "z" + format(i + 1, 0) + " ≈ " + cx(ZR[i], ZI[i]) + "; "; }
  info = info + "\n\nНаибольшее |p(zₖ)| = " + format(res, 6) + " — подстановка корней даёт нуль.";
}
]
