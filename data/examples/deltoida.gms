[
description = "{info}"
field width = 16; field height = 16;
camera type = fixed;
float R = 6; float r = 2; float ph = 0.6; float lastPh = 9; string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; size = 0.2 }
new Circle { name = "fix"; center = O; radius = R; color = #f59e0b; thickness = 1.5 }
new Circle { name = "path"; center = O; radius = 4; active = false }
new Curve { name = "ast"; type = parametric; x = "4 * cos(6.2832 * t) + 2 * cos(2 * 6.2832 * t)"; y = "4 * sin(6.2832 * t) - 2 * sin(2 * 6.2832 * t)"; color = #3b82f6; thickness = 3; segments = 400 }
new Point { name = "C"; circle = "path"; t = 0.1; pauseOnDrag = false; collideWithPoints = false; text = true("C") }
new Circle { name = "roll"; center = C; radius = r; thickness = 1.5 }
new Point { name = "T"; pos = (R, 0); dynamic = false; collision = false; size = 0.2; text = true("T") }
new Point { name = "P"; pos = (R, 0); dynamic = false; collision = false; color = #3b82f6; text = true("P") }
new Line { name = "cp"; pos = (C, P); thickness = 1 }
new Line { name = "tp"; pos = (T, P); color = #22c55e; thickness = 2 }
draw Graph { name = "gt"; graph = "tg"; nodeRadius = 0; labels = false; interactive = false; edgeColor = #f59e0b; edgeWidth = 2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  ph = atan2(C.pos.y, C.pos.x);
  if (abs(ph - lastPh) > 0.00001) {
    lastPh = ph;
    float k = 2;
    T.pos.x = R * cos(ph); T.pos.y = R * sin(ph);
    P.pos.x = 2 * r * cos(ph) + r * cos(k * ph); P.pos.y = 2 * r * sin(ph) - r * sin(k * ph);
    float nx = P.pos.x - T.pos.x; float ny = P.pos.y - T.pos.y; float nl = sqrt(nx * nx + ny * ny);
    float ux = cos(ph); float uy = sin(ph);
    if (nl > 0.001) { ux = -ny / nl; uy = nx / nl; }
    tg = newGraph();
    addNode(tg, "a", [P.pos.x - 3 * ux, P.pos.y - 3 * uy]);
    addNode(tg, "b", [P.pos.x + 3 * ux, P.pos.y + 3 * uy]);
    addEdge(tg, "a", "b");
    float deg = ph * 180 / pi; if (deg < 0) { deg = deg + 360; }
    info = "**Дельтоида** — гипоциклоида при R/r = 3: окружность радиуса r = " + format(r, 2) + " катится без проскальзывания внутри неподвижной окружности радиуса R = " + format(R, 2) + " (оранжевая), точка P на ней описывает кривую с тремя точками возврата и трёхлучевой симметрией.\n\n**φ = " + format(deg, 1) + "°**, x = 2r·cosφ + r·cos2φ = " + num(P.pos.x, 2) + ", y = 2r·sinφ − r·sin2φ = " + num(P.pos.y, 2) + ". Расстояние от центра до P: " + format(sqrt(P.pos.x * P.pos.x + P.pos.y * P.pos.y), 2) + " (наибольшее 3r = " + format(R, 2) + ", в точках касания с неподвижной окружностью).\n\n";
    if (nl < 0.05) { info = info + "**P — в точке возврата:** касательная совпадает с радиусом неподвижной окружности, скорость точки равна нулю."; }
    else { info = info + "**Нормаль** (зелёная) проходит через точку касания T окружностей, касательная (оранжевая) ей перпендикулярна. Длина PT = " + format(nl, 2) + "."; }
  }
}
]
