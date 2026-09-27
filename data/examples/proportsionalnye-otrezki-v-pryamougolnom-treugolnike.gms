[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float theta = 1.0; string info = "";
new Point { name = "A"; pos = (-5, 0); dynamic = false; collision = false }
new Point { name = "B"; pos = (5, 0); dynamic = false; collision = false }
new Point { name = "C"; pos = (0, 5); dynamic = false; collision = false }
new Point { name = "H"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "ca"; pos = (C, A) }
new Line { name = "cb"; pos = (C, B) }
new Line { name = "ch"; pos = (C, H); color = #f59e0b }
new Angle { name = "rt"; lines = (ca, cb) }
draw Angle { angle = "rt"; count = 1 }
new Figure { name = "t1"; elements = (ab, cb, ca); interact = false }
new UI { type = slider; label = "положение C"; variable = theta; min = 0.35; max = 2.8; step = 0.02; default = 1.0 }
Update {
  C.pos.x = 5 * cos(theta); C.pos.y = 5 * sin(theta);
  H.pos.x = C.pos.x; H.pos.y = 0;
  float ac = abs(C.pos.x + 5); float bc = abs(5 - C.pos.x); float h = C.pos.y;
  info = "Высота CH делит гипотенузу AB на отрезки AH = " + format(ac, 2) + " и HB = " + format(bc, 2) + ". Катет CA = " + format(ca.length, 2) + " — среднее пропорциональное между гипотенузой и проекцией: CA² = " + format(ca.length * ca.length, 2) + " ≈ AB·AH = " + format(ab.length * ac, 2) + ". Высота CH = " + format(h, 2) + " — среднее пропорциональное между отрезками гипотенузы: CH² = " + format(h * h, 2) + " ≈ AH·HB = " + format(ac * bc, 2) + ".";
}
]
