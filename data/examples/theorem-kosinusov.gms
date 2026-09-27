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
new Angle { name = "angC"; lines = (bc, ca) }
draw Angle { angle = "angC"; count = 1 }
Update {
  float rc = 3.14159265 * angC.measure / 180;
  float lhs = ab.length * ab.length;
  float rhs = bc.length * bc.length + ca.length * ca.length - 2 * bc.length * ca.length * cos(rc);
  info = "**Теорема косинусов** для угла C, заключённого между сторонами CA и CB: AB² = CA² + CB² − 2·CA·CB·cos C. Проверка: AB² = " + format(lhs, 2) + ", CA² + CB² − 2·CA·CB·cos(" + format(angC.measure, 0) + "°) = " + format(rhs, 2) + " — совпадают при любом треугольнике.";
}
]
