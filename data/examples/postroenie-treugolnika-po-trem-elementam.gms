[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string info = ""; float a = 5; float b = 4; float g = 60;
new Point { name = "C"; pos = (-3, -2) }
new Point { name = "A"; pos = (2, -2); dynamic = false; collision = false }
new Point { name = "B"; pos = (-1, 2); dynamic = false; collision = false }
new Line { name = "ca"; pos = (C, A) }
new Line { name = "cb"; pos = (C, B) }
new Line { name = "ab"; pos = (A, B); color = #3b82f6 }
new Figure { name = "tri"; elements = (ca, ab, cb) }
new Angle { name = "angC"; lines = (ca, cb) }
draw Angle { name = "daC"; angle = "angC" }
new UI { type = slider; label = "сторона CA = b"; variable = b; min = 1; max = 7; step = 0.1; default = 4 }
new UI { type = slider; label = "сторона CB = a"; variable = a; min = 1; max = 7; step = 0.1; default = 5 }
new UI { type = slider; label = "угол C, γ"; variable = g; min = 5; max = 175; step = 1; default = 60 }
Update {
  A.pos.x = C.pos.x + b; A.pos.y = C.pos.y;
  float r = g * 0.017453;
  B.pos.x = C.pos.x + a * cos(r); B.pos.y = C.pos.y + a * sin(r);
  float c = ab.length;
  info = "**Треугольник построен по двум сторонам и углу между ними.** CA = b = " + format(b, 1) + ", CB = a = " + format(a, 1) + ", угол C = γ = " + format(g, 0) + "°. Такая тройка данных всегда определяет треугольник единственным образом; сторона AB находится по теореме косинусов: c = " + format(c, 2) + ".";
}
]
