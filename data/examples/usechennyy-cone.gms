[
description = "{info}"

field width = 12; field height = 10; field depth = 12;
show grid = false; show axes = false;
camera start rot = (30, 62);
camera start zoom = 1.5;

float hh = 6; float rr = 3; float tt = 0.6; float xx = 3.6; float r2 = 1.25; string info = "";

new Point3D { name = "S"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("S") }
new Point3D { name = "A"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("A") }
new Point3D { name = "B"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("B") }
new Point3D { name = "C"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("C") }
new Point3D { name = "D"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("D") }
new Point3D { name = "O1"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("O₁") }
new Point3D { name = "O2"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("O₂") }
new Curve3D { name = "rim1"; type = parametric; x = "rr * cos(2 * pi * t)"; y = "-hh / 2"; z = "rr * sin(2 * pi * t)"; segments = 96; thickness = 1 }
new Curve3D { name = "rim2"; type = parametric; x = "r2 * cos(2 * pi * t)"; y = "-hh / 2 + xx"; z = "r2 * sin(2 * pi * t)"; segments = 96; thickness = 1 }
new Curve3D { name = "fan"; type = parametric; x = "fp(t, 0)"; y = "fp(t, 1)"; z = "fp(t, 2)"; segments = 128; thickness = 1 }
new Line3D { name = "ax"; pos = (O1, O2); interact = false; thickness = 4; color = #22c55e }
new Line3D { name = "ab"; pos = (A, B); interact = false; thickness = 4; color = #f59e0b }
new Line3D { name = "bc"; pos = (B, C); interact = false; thickness = 4; color = #f59e0b }
new Line3D { name = "cd"; pos = (C, D); interact = false; thickness = 4; color = #f59e0b }
new Line3D { name = "da"; pos = (D, A); interact = false; thickness = 4; color = #f59e0b }

new UI { name = "s_r"; type = slider; label = "радиус R"; variable = rr; min = 1.5; max = 4.5; step = 0.1; default = 3 }
new UI { name = "s_h"; type = slider; label = "высота конуса H"; variable = hh; min = 3; max = 7; step = 0.1; default = 6 }
new UI { name = "s_x"; type = slider; label = "уровень сечения h / H"; variable = tt; min = 0.1; max = 0.9; step = 0.05; default = 0.6 }

Function fp(t, c) {
  float u = t * 32; float j = floor(u + 0.000001); float f = u - j;
  if (f < 0) { f = 0; }
  float k = floor(j / 2); float a = 6.283185 * k / 16;
  float w = f; if (j - 2 * k > 0.5) { w = 1 - f; }
  if (c < 0.5) { return w * rr * cos(a); }
  if (c < 1.5) { return hh / 2 - w * hh; }
  return w * rr * sin(a);
}

Update {
  xx = tt * hh;
  r2 = rr * (hh - xx) / hh;
  float y0 = -hh / 2; float y1 = -hh / 2 + xx;
  S.pos.x = 0; S.pos.y = hh / 2; S.pos.z = 0;
  A.pos.x = -rr; A.pos.y = y0; A.pos.z = 0;
  B.pos.x = rr; B.pos.y = y0; B.pos.z = 0;
  C.pos.x = r2; C.pos.y = y1; C.pos.z = 0;
  D.pos.x = -r2; D.pos.y = y1; D.pos.z = 0;
  O1.pos.x = 0; O1.pos.y = y0; O1.pos.z = 0;
  O2.pos.x = 0; O2.pos.y = y1; O2.pos.z = 0;
  float l = sqrt(xx * xx + (rr - r2) * (rr - r2));
  info = "**Усечённый конус** получен из конуса высоты H = " + format(hh, 1) + " плоскостью, параллельной основанию, на высоте h = " + format(xx, 1) + " от него (S — вершина исходного конуса, отсечённая часть). Основания — два параллельных круга с общей осью O₁O₂: нижний радиуса R = " + format(rr, 1) + " и верхний радиуса r = " + format(r2, 2) + ". Высота усечённого конуса равна отрезку оси O₁O₂ = " + format(xx, 1) + ".\n\n";
  info = info + "Верхний круг подобен нижнему: r / R = (H − h) / H = " + format(hh - xx, 1) + " / " + format(hh, 1) + " = " + format(r2 / rr, 3) + ".\n\n";
  info = info + "Осевое сечение ABCD — равнобедренная трапеция с основаниями AB = 2R = " + format(2 * rr, 1) + " и CD = 2r = " + format(2 * r2, 2) + ". Её боковые стороны — образующие, все они равны: l = √(h² + (R − r)²) = √(" + format(xx * xx, 2) + " + " + format((rr - r2) * (rr - r2), 2) + ") = **" + format(l, 2) + "**.";
}
]
