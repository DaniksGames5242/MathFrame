[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string vid = "perenos"; float vx = 4; float vy = 1; float ang = 60; string info = "";
new Point { name = "A"; pos = (-2, -1.5) } new Point { name = "B"; pos = (-0.5, -1.5) } new Point { name = "C"; pos = (-2, 1.5) }
new Point { name = "A2"; pos = (0, 0); dynamic = false; collision = false } new Point { name = "B2"; pos = (0, 0); dynamic = false; collision = false } new Point { name = "C2"; pos = (0, 0); dynamic = false; collision = false }
new Line { name = "ab"; pos = (A, B) } new Line { name = "bc"; pos = (B, C) } new Line { name = "ca"; pos = (C, A) }
new Line { name = "a2b2"; pos = (A2, B2); color = #3b82f6 } new Line { name = "b2c2"; pos = (B2, C2); color = #3b82f6 } new Line { name = "c2a2"; pos = (C2, A2); color = #3b82f6 }
new Figure { name = "t1"; elements = (ab, bc, ca) } new Figure { name = "t2"; elements = (a2b2, b2c2, c2a2) }
new UI { type = select; label = "вид движения"; variable = vid; options = ("perenos", "povorot", "simmetriya"); labels = ("параллельный перенос", "поворот", "осевая симметрия"); default = "perenos" }
new UI { type = slider; label = "параметр (вектор x / угол ° / сдвиг оси)"; variable = vx; min = -6; max = 6; step = 0.5; default = 4 }
Function trX(px, py) { float r = ang * 0.017453; if (vid == "perenos") { return px + vx * 0.8; } if (vid == "povorot") { return px * cos(r) - py * sin(r); } return vx - px; }
Function trY(px, py) { float r = ang * 0.017453; if (vid == "perenos") { return py + 1; } if (vid == "povorot") { return px * sin(r) + py * cos(r); } return py; }
Update {
  ang = vx * 15;
  A2.pos.x = trX(A.pos.x, A.pos.y); A2.pos.y = trY(A.pos.x, A.pos.y);
  B2.pos.x = trX(B.pos.x, B.pos.y); B2.pos.y = trY(B.pos.x, B.pos.y);
  C2.pos.x = trX(C.pos.x, C.pos.y); C2.pos.y = trY(C.pos.x, C.pos.y);
  string nm = "параллельный перенос"; if (vid == "povorot") { nm = "поворот на " + format(ang, 0) + "°"; } if (vid == "simmetriya") { nm = "осевая симметрия"; }
  info = "**Движение: " + nm + ".** Синий треугольник — образ белого. Стороны и углы сохраняются: AB = A'B' = " + format(ab.length, 2) + ", BC = B'C' = " + format(bc.length, 2) + " — движение не меняет расстояний между точками.";
}
]
