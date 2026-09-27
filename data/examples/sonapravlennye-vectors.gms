[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float lam = 1.5; string info = "";
new Point { name = "A"; pos = (-4, -1); pauseOnDrag = false }
new Point { name = "B"; pos = (-1, 1); pauseOnDrag = false }
new Point { name = "C"; pos = (1, -2); pauseOnDrag = false }
new Point { name = "D"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e }
new Line { name = "ab"; pos = (A, B); color = #3b82f6 }
draw Vector { name = "vab"; edge = "ab" }
new Line { name = "cd"; pos = (C, D); color = #22c55e }
draw Vector { name = "vcd"; edge = "cd" }
new UI { type = slider; label = "коэффициент λ > 0"; variable = lam; min = 0.3; max = 3; step = 0.1; default = 1.5 }
Update {
  D.pos.x = C.pos.x + lam * (B.pos.x - A.pos.x); D.pos.y = C.pos.y + lam * (B.pos.y - A.pos.y);
  info = "**Векторы AB и CD сонаправлены**: CD = λ·AB при λ = " + format(lam,1) + " > 0, поэтому оба вектора параллельны и смотрят в одну сторону, хотя |CD| = " + format(lam,2) + "·|AB| может отличаться от |AB| по длине.\n\nЛюбое λ > 0 сохраняет сонаправленность — меняется лишь длина.";
}
]
