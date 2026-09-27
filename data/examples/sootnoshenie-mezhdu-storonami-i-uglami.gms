[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (-5, -3) }
new Point { name = "B"; pos = (4, -3) }
new Point { name = "C"; pos = (2, 3) }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }
new Angle { name = "angA"; lines = (ab, ca) }
new Angle { name = "angB"; lines = (ab, bc) }
new Angle { name = "angC"; lines = (bc, ca) }
draw Angle { name = "arcA"; angle = "angA" }
draw Angle { name = "arcB"; angle = "angB" }
draw Angle { name = "arcC"; angle = "angC" }
Update {
  string bigSide = "BC (против A)"; float bigA = bc.length; if (ca.length > bigA) { bigSide = "CA (против B)"; bigA = ca.length; } if (ab.length > bigA) { bigSide = "AB (против C)"; bigA = ab.length; }
  string bigAng = "A"; float bigM = angA.measure; if (angB.measure > bigM) { bigAng = "B"; bigM = angB.measure; } if (angC.measure > bigM) { bigAng = "C"; bigM = angC.measure; }
  info = "**Соотношение сторон и углов**: BC = " + format(bc.length, 1) + " против A = " + format(angA.measure, 0) + "°, CA = " + format(ca.length, 1) + " против B = " + format(angB.measure, 0) + "°, AB = " + format(ab.length, 1) + " против C = " + format(angC.measure, 0) + "°.\n\nБольшая сторона — " + bigSide + ", и против неё лежит наибольший угол " + bigAng + ".";
}
]
