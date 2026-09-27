[
description = "{info}"
field width = 12; field height = 10;
camera type = fixed;
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; size = 0.4 }
new Circle { name = "w"; center = O; radius = 4 }
new Point { name = "A"; circle = "w"; t = 0.05; text = true("A"); pauseOnDrag = false }
new Point { name = "B"; circle = "w"; t = 0.35; text = true("B"); pauseOnDrag = false }
new Line { name = "oa"; pos = (O, A); color = #3b82f6; thickness = 3 }
new Line { name = "ob"; pos = (O, B); color = #3b82f6; thickness = 3 }
float angA = 0; float angB = 0; float sweep = 0; string info = "";
new Curve { name = "arc"; type = parametric; x = "4 * cos(angA + t * sweep)"; y = "4 * sin(angA + t * sweep)"; segments = 200; color = #3b82f6; thickness = 3 }
Update {
  angA = atan2(A.pos.y, A.pos.x); angB = atan2(B.pos.y, B.pos.x);
  sweep = angB - angA; if (sweep < 0) { sweep = sweep + 2 * pi; }
  float deg = sweep * 180 / pi; float S = sweep * 16 / 2; float l = 4 * sweep;
  info = "**Сектор** OAB — часть круга радиуса r = 4, выделенная двумя радиусами OA, OB и дугой AB между ними. Центральный угол ∠AOB = " + format(deg, 1) + "°.\n\nДлина дуги l = rα = " + format(l, 2) + ". Площадь сектора S = ½r²α = ½ × 16 × " + format(sweep, 2) + " ≈ " + format(S, 2) + " — доля " + format(deg / 360, 2) + " от площади всего круга.";
}
]
