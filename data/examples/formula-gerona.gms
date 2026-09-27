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
string info = "";
Update {
  float a = bc.length; float b = ca.length; float c = ab.length;
  float p = (a + b + c) / 2;
  float S = sqrt(p * (p - a) * (p - b) * (p - c));
  info = "Стороны a = CB = " + format(a, 2) + ", b = CA = " + format(b, 2) + ", c = AB = " + format(c, 2) + ". Полупериметр p = (a + b + c)/2 = " + format(p, 2) + ".\n\n**Формула Герона:** S = √(p(p − a)(p − b)(p − c)) = √(" + format(p, 2) + " · " + format(p - a, 2) + " · " + format(p - b, 2) + " · " + format(p - c, 2) + ") = " + format(S, 2) + ".";
}
]
