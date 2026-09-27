[
description = "{info}"
field width = 16; field height = 12;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (-1, 4) }
new Point { name = "B"; pos = (-6, -4) }
new Point { name = "C"; pos = (6, -4) }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "t"; elements = (ab, bc, ca) }
new Angle { name = "angA"; lines = (ab, ca) }
new Angle { name = "angB"; lines = (ab, bc) }
new Angle { name = "angC"; lines = (bc, ca) }
draw Angle { angle = "angA"; count = 1 }
draw Angle { angle = "angB"; count = 1 }
draw Angle { angle = "angC"; count = 1 }
Update {
  float pi = 3.14159265;
  float ra = pi * angA.measure / 180; float rb = pi * angB.measure / 180; float rc = pi * angC.measure / 180;
  float sinR = bc.length / sin(ra);
  float cosCheck = bc.length * bc.length + ca.length * ca.length - 2 * bc.length * ca.length * cos(rc);
  info = "**Теорема синусов**: сторона делённая на синус противолежащего угла одинакова для всех трёх сторон — BC/sin A = CA/sin B = AB/sin C = " + format(sinR, 2) + ". **Теорема косинусов**: сторона выражается через две другие и угол между ними — AB² = CA² + CB² − 2·CA·CB·cos C = " + format(cosCheck, 2) + " (факт AB² = " + format(ab.length * ab.length, 2) + "). Вместе они позволяют найти все стороны и углы треугольника по любым трём из них.";
}
]
