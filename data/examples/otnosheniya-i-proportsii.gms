[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 2; float b = 3; float c = 4; string info = "";
draw Text { name = "t1"; pos = (0, 1.5); text = fs; size = 1.1 }
string fs = "";
new UI { type = slider; label = "a"; variable = a; min = 1; max = 12; step = 1; default = 2 }
new UI { type = slider; label = "b"; variable = b; min = 1; max = 12; step = 1; default = 3 }
new UI { type = slider; label = "c"; variable = c; min = 1; max = 12; step = 1; default = 4 }
Update {
  float d = c * b / a;
  fs = "a : b = c : x, где x = " + format(d, 2);
  info = "**Пропорция " + format(a,0) + " : " + format(b,0) + " = " + format(c,0) + " : " + format(d, 2) + "** — отношения равны. По основному свойству пропорции произведение крайних равно произведению средних: " + format(a,0) + " × " + format(d,2) + " = " + format(a*d,2) + " и " + format(b,0) + " × " + format(c,0) + " = " + format(b*c,2) + ".";
}
]
