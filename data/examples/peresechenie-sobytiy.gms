[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Пространство исходов Ω — 135 равновозможных исходов (точки решётки 15 × 9).
// События A и B — исходы внутри кругов; центры кругов перетаскиваются, радиусы — ползунки. ----

float rA = 2.6; float rB = 2.3;
float na = 0; float nb = 0; float nab = 0; float nr = 0; float nx = 0;
string key = ""; string info = "";
draw Graph { name = "gF"; graph = "gf"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; layer = 1 }
draw Graph { name = "g0"; graph = "g0"; nodeRadius = 3; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "dG"; graph = "gG"; nodeColor = #22c55e; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Text { name = "tOm"; pos = (-7.5, 4.8); text = "Ω"; size = 0.9; align = left }
new Point { name = "A"; pos = (-1.7, 0.4); text = true("A"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "B"; pos = (1.5, -0.4); text = true("B"); pauseOnDrag = false; collideWithPoints = false }
new Circle { name = "cA"; center = A; radius = rA; color = #3b82f6 }
new Circle { name = "cB"; center = B; radius = rB; color = #f59e0b }
new UI { name = "sA"; type = slider; label = "радиус A"; variable = rA; min = 1; max = 4; step = 0.1; default = 2.6 }
new UI { name = "sB"; type = slider; label = "радиус B"; variable = rB; min = 1; max = 4; step = 0.1; default = 2.3 }


Function num(x) { return format(x, 3); }
Function frac(k) { return format(k, 0) + "/135"; }

Update {
  // круги остаются внутри Ω
  if (A.pos.x < -7.5 + rA) { A.pos.x = -7.5 + rA; } if (A.pos.x > 7.5 - rA) { A.pos.x = 7.5 - rA; }
  if (A.pos.y < -4.5 + rA) { A.pos.y = -4.5 + rA; } if (A.pos.y > 4.5 - rA) { A.pos.y = 4.5 - rA; }
  if (B.pos.x < -7.5 + rB) { B.pos.x = -7.5 + rB; } if (B.pos.x > 7.5 - rB) { B.pos.x = 7.5 - rB; }
  if (B.pos.y < -4.5 + rB) { B.pos.y = -4.5 + rB; } if (B.pos.y > 4.5 - rB) { B.pos.y = 4.5 - rB; }
  string kk = format(A.pos.x, 3) + format(A.pos.y, 3) + format(B.pos.x, 3) + format(B.pos.y, 3) + format(rA, 2) + format(rB, 2) + "";
  if (kk != key) {
    key = kk;
    gf = newGraph(); addNode(gf, "1", [-7.5, -4.5]); addNode(gf, "2", [7.5, -4.5]); addNode(gf, "3", [7.5, 4.5]); addNode(gf, "4", [-7.5, 4.5]); addEdge(gf, "1", "2"); addEdge(gf, "2", "3"); addEdge(gf, "3", "4"); addEdge(gf, "4", "1");
    g0 = newGraph(); gG = newGraph();
    na = 0; nb = 0; nab = 0; nr = 0; nx = 0;
    repeat (15) { float ix = i;
      repeat (9) { float x = ix - 7; float y = i - 4; string id = format(ix, 0) + "_" + format(i, 0);
        float a = 0; float b = 0;
        if ((x - A.pos.x) * (x - A.pos.x) + (y - A.pos.y) * (y - A.pos.y) <= rA * rA) { a = 1; }
        if ((x - B.pos.x) * (x - B.pos.x) + (y - B.pos.y) * (y - B.pos.y) <= rB * rB) { b = 1; }
        na = na + a; nb = nb + b; nab = nab + a * b;
        nr = nr + a * b;
        if (a == 1 && b == 1) { addNode(gG, id, [x, y]); } else { addNode(g0, id, [x, y]); }
      }
    }
  }
  float pa = na / 135; float pb = nb / 135; float pab = nab / 135;
  string s = "**Пересечение A ∩ B** — событие «произошли и A, и B одновременно»: исход принадлежит обоим событиям. Таких исходов " + format(nab, 0) + " из 135 (зелёные), P(A ∩ B) = " + num(pab) + ".\n\n";
  if (nab == 0) { s = s + "A ∩ B = ∅: события **несовместны** — одновременно наступить не могут."; }
  else {
    s = s + "P(A ∩ B) = P(A) · P(B | A) = " + num(pa) + " · " + num(nab / na) + " = " + num(pab) + ", и так же P(B) · P(A | B) = " + num(pb) + " · " + num(nab / nb) + " = " + num(pab) + ".\n\n";
    if (nab * 135 == na * nb) { s = s + "P(A ∩ B) = P(A) · P(B) = " + num(pa * pb) + ": события **независимы**."; }
    else { s = s + "P(A) · P(B) = " + num(pa * pb) + " ≠ P(A ∩ B): события зависимы, простое произведение не годится — нужна условная вероятность."; }
  }
  info = s;
}
]
