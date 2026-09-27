[
description = "{info}"
field width = 14; field height = 8;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (-6, -2) }
new Point { name = "B"; pos = (-1, -2) }
new Point { name = "C"; pos = (1, 2) }
new Point { name = "D"; pos = (6, 2) }
new Line { name = "ab"; pos = (A, B); color = #3b82f6; thickness = 3 }
new Line { name = "cd"; pos = (C, D); color = #f59e0b; thickness = 3 }
Update {
  string cmp = "AB и CD равны";
  if (ab.length > cd.length) { cmp = "AB больше CD"; }
  if (ab.length < cd.length) { cmp = "AB меньше CD"; }
  info = "Длина AB = " + format(ab.length, 2) + ", длина CD = " + format(cd.length, 2) + ". Отрезок " + cmp + ".";
}
]
