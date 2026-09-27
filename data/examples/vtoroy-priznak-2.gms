[
description = "{info}"
field width = 16; field height = 12;
camera type = fixed;
float k = 1.5; string info = "";
new Point { name = "A"; pos = (-4, -2) }
new Point { name = "B"; pos = (1, -2) }
new Point { name = "C"; pos = (-2, 2) }
new Point { name = "B2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "C2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Line { name = "ab"; pos = (A, B); color = #3b82f6 }
new Line { name = "bc"; pos = (B, C); color = #3b82f6 }
new Line { name = "ca"; pos = (C, A); color = #3b82f6 }
new Line { name = "ab2"; pos = (A, B2); color = #f59e0b }
new Line { name = "b2c2"; pos = (B2, C2); color = #f59e0b }
new Line { name = "c2a"; pos = (C2, A); color = #f59e0b }
new Figure { name = "t1"; elements = (ab, bc, ca) }
new Figure { name = "t2"; elements = (ab2, b2c2, c2a); interact = false }
new UI { type = slider; label = "коэффициент k"; variable = k; min = 0.5; max = 1.8; step = 0.1; default = 1.4 }
Update {
  B2.pos.x = A.pos.x + k * (B.pos.x - A.pos.x); B2.pos.y = A.pos.y + k * (B.pos.y - A.pos.y);
  C2.pos.x = A.pos.x + k * (C.pos.x - A.pos.x); C2.pos.y = A.pos.y + k * (C.pos.y - A.pos.y);
  info = "Синий треугольник ABC и оранжевый AB₂C₂ имеют общий угол A, а стороны AB₂ = k·AB и AC₂ = k·AC — две пары сторон пропорциональны одному и тому же k = " + format(k, 2) + ", угол между ними общий. По второму признаку подобия треугольники подобны, поэтому и третья сторона пропорциональна: B₂C₂ = " + format(b2c2.length, 2) + " ≈ k·BC = " + format(k * bc.length, 2) + ".";
}
]
