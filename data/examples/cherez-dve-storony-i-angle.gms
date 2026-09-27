[
description = "{info}"
field width = 16; field height = 12;
camera type = fixed;
new Point { name = "A"; pos = (-6, -4); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (6, -4); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (1, 5); text = true("C"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }
new Angle { name = "angC"; lines = (ca, bc) }
draw Angle { name = "arcC"; angle = "angC" }
string info = "";
Update {
  float a = bc.length; float b = ca.length; float g = angC.measure * 3.14159265 / 180;
  float S = 0.5 * a * b * sin(g);
  info = "**S = ½·a·b·sin γ**, где a = CB = " + format(a, 2) + ", b = CA = " + format(b, 2) + " — стороны, γ — угол между ними (у вершины C) = " + format(angC.measure, 1) + "°.\n\nS = ½ · " + format(a, 2) + " · " + format(b, 2) + " · sin " + format(angC.measure, 1) + "° = " + format(S, 2) + ".";
}
]
