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
draw Angle { angle = "angA"; count = 1 }
draw Angle { angle = "angB"; count = 1 }
Update {
  float pi = 3.14159265; float rA = pi * angA.measure / 180;
  float b = ca.length; float c = ab.length;
  float a1 = sqrt(b * b + c * c - 2 * b * c * cos(rA));
  float sinB = b * sin(rA) / a1; if (sinB > 1) { sinB = 1; }
  float b1 = asin(sinB) * 180 / pi;
  info = "**По двум сторонам и углу между ними** — стороне c = AB = " + format(c, 2) + ", стороне b = CA = " + format(b, 2) + " и углу A = " + format(angA.measure, 0) + "° — теорема косинусов сразу даёт третью сторону: a = BC = " + format(a1, 2) + " (по факту " + format(bc.length, 2) + "). Затем теорема синусов даёт угол B: " + format(b1, 0) + "° (по факту " + format(angB.measure, 0) + "°), а угол C — дополнением суммы до 180°.";
}
]
