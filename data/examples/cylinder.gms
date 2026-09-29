[
description = "{info}"

field width = 12; field height = 10; field depth = 12;
show grid = false; show axes = false;
camera start rot = (30, 62);
camera start zoom = 1.25;

// Прямоугольник ABCD вращается вокруг стороны AD; след стороны BC — боковая поверхность,
// следы сторон AB и DC — два основания.
draw Surface { name = "side"; type = parametric; x = "cr * cos(2 * pi * part * u)"; y = "ch * (v - 0.5)"; z = "cr * sin(2 * pi * part * u)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 40; color = #3b82f6; opacity = 0.3 }
draw Surface { name = "disk1"; type = parametric; x = "cr * v * cos(2 * pi * part * u)"; y = "-ch / 2"; z = "cr * v * sin(2 * pi * part * u)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 30; color = #f59e0b; opacity = 0.3 }
draw Surface { name = "disk2"; type = parametric; x = "cr * v * cos(2 * pi * part * u)"; y = "ch / 2"; z = "cr * v * sin(2 * pi * part * u)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 30; color = #f59e0b; opacity = 0.3 }
new Curve3D { name = "arc1"; type = parametric; x = "cr * cos(2 * pi * part * t)"; y = "-ch / 2"; z = "cr * sin(2 * pi * part * t)"; segments = 90; color = #f59e0b; thickness = 3 }
new Curve3D { name = "arc2"; type = parametric; x = "cr * cos(2 * pi * part * t)"; y = "ch / 2"; z = "cr * sin(2 * pi * part * t)"; segments = 90; color = #f59e0b; thickness = 3 }

new Point3D { name = "A"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("A") }
new Point3D { name = "D"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("D") }
new Point3D { name = "B"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("B") }
new Point3D { name = "C"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("C") }
new Line3D { name = "ad"; pos = (A, D); interact = false; thickness = 5; color = #22c55e }
new Line3D { name = "ab"; pos = (A, B); interact = false; thickness = 3 }
new Line3D { name = "dc"; pos = (D, C); interact = false; thickness = 3 }
new Line3D { name = "bc"; pos = (B, C); interact = false; thickness = 4; color = #3b82f6 }

new UI { name = "sP"; type = slider; label = "поворот прямоугольника, °"; variable = ang; min = 10; max = 360; step = 1; default = 200 }
new UI { name = "sR"; type = slider; label = "радиус r = AB"; variable = cr; min = 1; max = 3.5; step = 0.1; default = 2.4 }
new UI { name = "sH"; type = slider; label = "высота h = AD"; variable = ch; min = 2; max = 6; step = 0.1; default = 4.5 }

float ang = 200; float cr = 2.4; float ch = 4.5; float part = 0.5556; string info = "";

Update {
  part = ang / 360;
  float t = radians(ang);
  A.pos.x = 0; A.pos.y = -ch / 2; A.pos.z = 0;
  D.pos.x = 0; D.pos.y = ch / 2; D.pos.z = 0;
  B.pos.x = cr * cos(t); B.pos.y = -ch / 2; B.pos.z = cr * sin(t);
  C.pos.x = cr * cos(t); C.pos.y = ch / 2; C.pos.z = cr * sin(t);
  info = "**Цилиндр** — тело, образованное вращением прямоугольника ABCD вокруг стороны AD. Сейчас прямоугольник повёрнут на " + format(ang, 0) + "° из 360°.\n\n";
  info = info + "Сторона AD — **ось** (зелёная). Сторона BC, противоположная оси, описывает **боковую поверхность**. Стороны AB и DC, перпендикулярные оси, описывают два равных круга — **основания** радиуса r = AB = " + format(cr, 2) + ". Высота h = AD = BC = " + format(ch, 2) + ".\n\n";
  info = info + "Осевое сечение — прямоугольник 2r × h = " + format(2 * cr, 2) + " × " + format(ch, 2) + ". Боковая поверхность S = 2πrh = " + format(2 * pi * cr * ch, 2) + ", полная поверхность S = 2πr(r + h) = " + format(2 * pi * cr * (cr + ch), 2) + ", объём V = πr²h = " + format(pi * cr * cr * ch, 2) + ".";
}
]
