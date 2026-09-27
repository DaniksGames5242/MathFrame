[
description = "{info}"
field width = 12; field height = 10;
camera type = fixed;
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; size = 0.4 }
new Circle { name = "w"; center = O; radius = 4 }
new Point { name = "A"; circle = "w"; t = 0.05; text = true("A"); pauseOnDrag = false }
new Point { name = "B"; circle = "w"; t = 0.4; text = true("B"); pauseOnDrag = false }
float angA = 0; float angB = 0; float sweep = 0; string info = "";
new Curve { name = "arc"; type = parametric; x = "4 * cos(angA + t * sweep)"; y = "4 * sin(angA + t * sweep)"; segments = 200; color = #3b82f6; thickness = 4 }
Update {
  angA = atan2(A.pos.y, A.pos.x); angB = atan2(B.pos.y, B.pos.x);
  sweep = angB - angA; if (sweep < 0) { sweep = sweep + 2 * pi; }
  float len = 4 * sweep; float deg = sweep * 180 / pi;
  string half = "меньше полуокружности"; if (deg > 180) { half = "больше полуокружности"; } if (abs(deg - 180) < 1) { half = "равна полуокружности"; }
  info = "**Дуга** AB — часть окружности радиуса r = 4 между точками A и B (выделена синим), содержащая все промежуточные точки окружности. Центральный угол ∠AOB = " + format(deg, 1) + "°, эта дуга " + half + ".\n\nДлина дуги l = r·α (α — угол в радианах) = 4 × " + format(sweep, 2) + " ≈ " + format(len, 2) + ".";
}
]
