[
description = "{info}"
field width = 14; field height = 10;
camera type = fixed;
float R = 3; float deg = 90; string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
new Circle { name = "c"; center = O; radius = R }
new Point { name = "A"; pos = (R, 0); dynamic = false; collision = false; text = true("A") }
new Point { name = "B"; pos = (R, 0); dynamic = false; collision = false; text = true("B") }
new Line { name = "oa"; pos = (O, A); color = #f59e0b }
new Line { name = "ob"; pos = (O, B); color = #f59e0b }
new Line { name = "ab"; pos = (A, B); color = #3b82f6 }
draw Arc { name = "arc1"; type = CenterRadius; center = O; radius = R; from = B; to = A; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "радиус R"; variable = R; min = 1; max = 4.5; step = 0.1; default = 3 }
new UI { type = slider; label = "угол, °"; variable = deg; min = 5; max = 355; step = 1; default = 90 }
Update {
  float rad = deg * 3.1416 / 180;
  B.pos.x = R * cos(rad); B.pos.y = R * sin(rad);
  float Ssec = 0.5 * R * R * rad; float Stri = 0.5 * R * R * sin(rad); float Sseg = Ssec - Stri;
  info = "**Сегмент** — часть круга между хордой AB (синяя) и дугой AB, при центральном угле θ = " + format(deg, 0) + "° (" + format(rad, 2) + " рад) и R = " + format(R, 1) + ".\n\nS = S(сектора OAB) − S(треугольника OAB) = ½R²θ − ½R²sin θ = " + format(Ssec, 2) + " − " + format(Stri, 2) + " ≈ " + format(Sseg, 2) + ".";
}
]
