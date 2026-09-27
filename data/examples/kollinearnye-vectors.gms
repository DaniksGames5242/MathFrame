[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float lam = -1.5; string info = "";
new Point { name = "A"; pos = (-4, -1); pauseOnDrag = false }
new Point { name = "B"; pos = (-1, 1); pauseOnDrag = false }
new Point { name = "C"; pos = (1, -2); pauseOnDrag = false }
new Point { name = "D"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e }
new Line { name = "ab"; pos = (A, B); color = #3b82f6 }
draw Vector { name = "vab"; edge = "ab" }
new Line { name = "cd"; pos = (C, D); color = #22c55e }
draw Vector { name = "vcd"; edge = "cd" }
new UI { type = slider; label = "коэффициент λ"; variable = lam; min = -3; max = 3; step = 0.1; default = -1.5 }
Update {
  if (abs(lam) < 0.1) { lam = 0.1; }
  D.pos.x = C.pos.x + lam * (B.pos.x - A.pos.x); D.pos.y = C.pos.y + lam * (B.pos.y - A.pos.y);
  string dir = "в ту же сторону"; if (lam < 0) { dir = "в противоположную сторону"; }
  info = "**Вектор CD = λ·AB** при λ = " + format(lam,1) + ": векторы AB и CD коллинеарны — лежат на параллельных прямых и направлены " + dir + ".\n\n|CD| = |λ|·|AB| = " + format(abs(lam),2) + "·|AB|.";
}
]
