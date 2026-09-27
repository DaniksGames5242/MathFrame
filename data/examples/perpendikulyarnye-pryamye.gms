[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float t = 90; string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "A"; pos = (-7, 0); dynamic = false; collision = false }
new Point { name = "C"; pos = (7, 0); dynamic = false; collision = false }
new Point { name = "B"; pos = (0, 5); dynamic = false; collision = false }
new Point { name = "D"; pos = (0, -5); dynamic = false; collision = false }
new Line { name = "l1A"; pos = (A, O) }
new Line { name = "l1C"; pos = (O, C) }
new Line { name = "l2A"; pos = (O, B); color = #3b82f6 }
new Line { name = "l2C"; pos = (O, D); color = #3b82f6 }
new Angle { name = "ang"; lines = (l2A, l1C) }
draw Angle { name = "da"; angle = "ang" }
new UI { type = slider; label = "угол наклона второй прямой t"; variable = t; min = 20; max = 160; step = 1; default = 90 }
Update {
  float r = t * 3.14159265 / 180;
  B.pos.x = 4.5 * cos(r); B.pos.y = 4.5 * sin(r);
  D.pos.x = -4.5 * cos(r); D.pos.y = -4.5 * sin(r);
  string m = "**не перпендикулярны**";
  if (abs(ang.measure - 90) < 0.5) { m = "**перпендикулярны**"; }
  info = "Синяя прямая проходит через точку O под углом " + format(t, 0) + "° к чёрной прямой. Угол между ними — " + format(ang.measure, 1) + "°: прямые " + m + ".\n\nПерпендикулярные прямые образуют в точке пересечения четыре равных прямых угла по 90°.";
}
]
