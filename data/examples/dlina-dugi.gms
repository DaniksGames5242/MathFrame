[
description = "{info}"
field width = 14; field height = 10;
camera type = fixed;
float R = 3; float deg = 90; string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
new Circle { name = "c"; center = O; radius = R }
new Point { name = "A"; pos = (R, 0); dynamic = false; collision = false; text = true("A") }
new Point { name = "B"; pos = (R, 0); dynamic = false; collision = false; text = true("B") }
draw Arc { name = "arc1"; type = CenterRadius; center = O; radius = R; from = B; to = A; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "радиус R"; variable = R; min = 1; max = 4.5; step = 0.1; default = 3 }
new UI { type = slider; label = "угол, °"; variable = deg; min = 5; max = 355; step = 1; default = 90 }
Update {
  float rad = deg * 3.1416 / 180;
  B.pos.x = R * cos(rad); B.pos.y = R * sin(rad);
  float len = R * rad;
  info = "**Длина дуги** AB окружности радиуса R = " + format(R, 1) + " при центральном угле θ = " + format(deg, 0) + "° (" + format(rad, 2) + " рад) равна l = Rθ = " + format(R, 1) + " × " + format(rad, 2) + " ≈ " + format(len, 2) + ".";
}
]
