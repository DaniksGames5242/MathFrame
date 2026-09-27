[
description = "{info}"
field width = 12; field height = 10;
camera type = fixed;
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; size = 0.4 }
new Circle { name = "w"; center = O; radius = 4 }
new Point { name = "A"; circle = "w"; t = 0.02; text = true("A"); pauseOnDrag = false }
new Point { name = "B"; circle = "w"; t = 0.47; text = true("B"); pauseOnDrag = false }
new Point { name = "C"; circle = "w"; t = 0.27; text = true("C"); pauseOnDrag = false }
new Point { name = "D"; circle = "w"; t = 0.77; text = true("D"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B); color = #3b82f6; thickness = 3 }
new Line { name = "cd"; pos = (C, D); color = #f59e0b; thickness = 3 }
new Point { name = "M"; pos = (0, 0); dynamic = false; collision = false; text = true("M"); size = 0.7 }
string info = "";
Update {
  float x1=A.pos.x; float y1=A.pos.y; float x2=B.pos.x; float y2=B.pos.y; float x3=C.pos.x; float y3=C.pos.y; float x4=D.pos.x; float y4=D.pos.y;
  float den = (x1-x2)*(y3-y4)-(y1-y2)*(x3-x4);
  if (abs(den) > 0.0001) {
    float t = ((x1-x3)*(y3-y4)-(y1-y3)*(x3-x4))/den;
    M.pos.x = x1+t*(x2-x1); M.pos.y = y1+t*(y2-y1);
  }
  float ma = sqrt((M.pos.x-x1)^2+(M.pos.y-y1)^2); float mb = sqrt((M.pos.x-x2)^2+(M.pos.y-y2)^2);
  float mc = sqrt((M.pos.x-x3)^2+(M.pos.y-y3)^2); float md = sqrt((M.pos.x-x4)^2+(M.pos.y-y4)^2);
  info = "**Теорема о пересекающихся хордах:** хорды AB и CD пересекаются в точке M внутри окружности. Произведение отрезков одной хорды равно произведению отрезков другой: AM · MB = CM · MD.\n\nAM · MB = " + format(ma,2) + " × " + format(mb,2) + " = " + format(ma*mb,2) + ", CM · MD = " + format(mc,2) + " × " + format(md,2) + " = " + format(mc*md,2) + ".";
}
]
