[
description = "{info}"

field width = 18; field height = 12;
camera type = fixed;

// ---- Прямоугольный треугольник: угол при A заблокирован в 90°. Для угла B синус и косинус —
// отношения катетов к гипотенузе; сумма их квадратов равна 1 при любом положении вершин
// (теорема Пифагора, делённая на квадрат гипотенузы). ----
new Point { name = "A"; pos = (-6, -4); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5, -4); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (-6, 4); text = true("C"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }

new Angle { name = "angA"; lines = (ab, ca); lock = true }
draw Angle { name = "arcA"; angle = "angA"; measure = false }
new Angle { name = "angB"; lines = (ab, bc) }
draw Angle { name = "arcB"; angle = "angB" }

// ---- Логика ----
string info = "";

Update {
  float s = ca.length / bc.length;
  float c = ab.length / bc.length;
  info = "**При угле B = " + format(angB.measure, 0) + "°:** sin B = " + format(s, 3) + ", cos B = " + format(c, 3) + ".\n\nsin²B + cos²B = " + format(s * s, 3) + " + " + format(c * c, 3) + " = " + format(s * s + c * c, 3) + " — сумма всегда равна 1 при любом угле, потому что CA² + AB² = BC² по теореме Пифагора, а sin²B + cos²B получается делением этого равенства на BC².";
}
]
