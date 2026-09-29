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
draw Graph { name = "dA"; graph = "gA"; nodeColor = #3b82f6; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "dB"; graph = "gB"; nodeColor = #f59e0b; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "dC"; graph = "gC"; nodeColor = #22c55e; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 9 }
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
    g0 = newGraph(); gA = newGraph(); gB = newGraph(); gC = newGraph();
    na = 0; nb = 0; nab = 0; nr = 0; nx = 0;
    repeat (15) { float ix = i;
      repeat (9) { float x = ix - 7; float y = i - 4; string id = format(ix, 0) + "_" + format(i, 0);
        float a = 0; float b = 0;
        if ((x - A.pos.x) * (x - A.pos.x) + (y - A.pos.y) * (y - A.pos.y) <= rA * rA) { a = 1; }
        if ((x - B.pos.x) * (x - B.pos.x) + (y - B.pos.y) * (y - B.pos.y) <= rB * rB) { b = 1; }
        na = na + a; nb = nb + b; nab = nab + a * b;
        nr = nr + a + b - a * b;
        if (a == 1 && b == 1) { addNode(gC, id, [x, y]); } else { if (a == 1) { addNode(gA, id, [x, y]); } else { if (b == 1) { addNode(gB, id, [x, y]); } else { addNode(g0, id, [x, y]); } } }
      }
    }
  }
  float pa = na / 135; float pb = nb / 135; float pab = nab / 135;
  string s = "**Объединение A ∪ B** — событие «произошло хотя бы одно из A и B»: исход принадлежит A или B (или обоим). Синие, оранжевые и зелёные исходы вместе — их " + format(nr, 0) + " из 135, P(A ∪ B) = " + num(nr / 135) + ".\n\nP(A ∪ B) = P(A) + P(B) − P(A ∩ B) = " + num(pa) + " + " + num(pb) + " − " + num(pab) + " = " + num(pa + pb - pab) + ". Зелёные исходы (A ∩ B) при сложении P(A) + P(B) посчитаны дважды, поэтому их вычитают.\n\n";
  if (nab == 0) { s = s + "A ∩ B = ∅: события несовместны, и P(A ∪ B) = P(A) + P(B)."; }
  else { if (nab == na && nab == nb) { s = s + "A = B: объединение совпадает с каждым из событий."; } else { if (nab == na) { s = s + "A ⊂ B: объединение совпадает с B, P(A ∪ B) = P(B)."; } else { if (nab == nb) { s = s + "B ⊂ A: объединение совпадает с A, P(A ∪ B) = P(A)."; } else { s = s + "Всегда P(A ∪ B) ≤ P(A) + P(B); равенство только для несовместных событий."; } } } }
  info = s;
}
]
