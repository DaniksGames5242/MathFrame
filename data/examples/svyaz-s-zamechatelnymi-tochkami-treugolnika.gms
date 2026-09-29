[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float ax0 = -5; float ay0 = -3; float bx0 = 5; float by0 = -3; float cx0 = -1.5; float cy0 = 3.5;
float gx = 0; float gy = 0; float ix = 0; float iy = 0; float ox = 0; float oy = 0; float hx = 0; float hy = 0;
float wa = 0; float wb = 0; float wc = 0; float ua = 0; float ub = 0; float uc = 0; float ha = 0; float hb = 0; float hc = 0; float la = 0; float lb = 0; float lc = 0;
string info = "";
new Point { name = "A"; pos = (-5, -3); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5, -3); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (-1.5, 3.5); text = true("C"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }
new Point { name = "G"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e; text = true("G") }
new Point { name = "I"; pos = (0, 0); dynamic = false; collision = false; color = #3b82f6; text = true("I") }
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; text = true("O") }
new Point { name = "H"; pos = (0, 0); dynamic = false; collision = false; text = true("H") }
new Line { name = "euler"; pos = (O, H); color = #f59e0b; thickness = 1.5 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function calc() {
  float a2 = (B.pos.x - C.pos.x) * (B.pos.x - C.pos.x) + (B.pos.y - C.pos.y) * (B.pos.y - C.pos.y);
  float b2 = (C.pos.x - A.pos.x) * (C.pos.x - A.pos.x) + (C.pos.y - A.pos.y) * (C.pos.y - A.pos.y);
  float c2 = (A.pos.x - B.pos.x) * (A.pos.x - B.pos.x) + (A.pos.y - B.pos.y) * (A.pos.y - B.pos.y);
  la = sqrt(a2); lb = sqrt(b2); lc = sqrt(c2);
  gx = (A.pos.x + B.pos.x + C.pos.x) / 3; gy = (A.pos.y + B.pos.y + C.pos.y) / 3;
  float s = la + lb + lc;
  ix = (la * A.pos.x + lb * B.pos.x + lc * C.pos.x) / s; iy = (la * A.pos.y + lb * B.pos.y + lc * C.pos.y) / s;
  wa = a2 * (b2 + c2 - a2); wb = b2 * (c2 + a2 - b2); wc = c2 * (a2 + b2 - c2);
  float sw = wa + wb + wc;
  ox = (wa * A.pos.x + wb * B.pos.x + wc * C.pos.x) / sw; oy = (wa * A.pos.y + wb * B.pos.y + wc * C.pos.y) / sw;
  ua = (a2 + b2 - c2) * (a2 - b2 + c2); ub = (a2 + b2 - c2) * (b2 + c2 - a2); uc = (a2 - b2 + c2) * (b2 + c2 - a2);
  float su = ua + ub + uc;
  hx = (ua * A.pos.x + ub * B.pos.x + uc * C.pos.x) / su; hy = (ua * A.pos.y + ub * B.pos.y + uc * C.pos.y) / su;
  ha = ua / su; hb = ub / su; hc = uc / su;
}
Function okT() {
  float s2 = (B.pos.x - A.pos.x) * (C.pos.y - A.pos.y) - (B.pos.y - A.pos.y) * (C.pos.x - A.pos.x);
  if (abs(s2) < 6) { return 0; }
  calc();
  float mx = fieldMaxX - 0.6; float my = fieldMaxY - 0.6;
  if (abs(ox) > mx || abs(oy) > my || abs(hx) > mx || abs(hy) > my) { return 0; }
  return 1;
}
Update {
  if (okT() == 0) {
    A.pos.x = ax0; A.pos.y = ay0; B.pos.x = bx0; B.pos.y = by0; C.pos.x = cx0; C.pos.y = cy0;
    calc();
  }
  ax0 = A.pos.x; ay0 = A.pos.y; bx0 = B.pos.x; by0 = B.pos.y; cx0 = C.pos.x; cy0 = C.pos.y;
  if (abs(G.pos.x - gx) + abs(G.pos.y - gy) > 0.00001) { G.pos.x = gx; G.pos.y = gy; }
  if (abs(I.pos.x - ix) + abs(I.pos.y - iy) > 0.00001) { I.pos.x = ix; I.pos.y = iy; }
  if (abs(O.pos.x - ox) + abs(O.pos.y - oy) > 0.00001) { O.pos.x = ox; O.pos.y = oy; }
  if (abs(H.pos.x - hx) + abs(H.pos.y - hy) > 0.00001) { H.pos.x = hx; H.pos.y = hy; }
  float s = la + lb + lc;
  float sw = wa + wb + wc;
  float og = sqrt((gx - ox) * (gx - ox) + (gy - oy) * (gy - oy));
  float gh = sqrt((hx - gx) * (hx - gx) + (hy - gy) * (hy - gy));
  info = "**Замечательные точки через барицентрические координаты** (a, b, c — длины сторон BC, CA, AB; a = " + format(la, 2) + ", b = " + format(lb, 2) + ", c = " + format(lc, 2) + "). Точка с координатами (x : y : z) — центр масс масс x, y, z в вершинах A, B, C.\n\n**Центроид G** (1 : 1 : 1) = (⅓ : ⅓ : ⅓).\n**Инцентр I** (a : b : c) = (" + format(la / s, 3) + " : " + format(lb / s, 3) + " : " + format(lc / s, 3) + ").\n**Центр описанной окружности O** (sin 2α : sin 2β : sin 2γ) = (" + num(wa / sw, 3) + " : " + num(wb / sw, 3) + " : " + num(wc / sw, 3) + ").\n**Ортоцентр H** (tg α : tg β : tg γ) = (" + num(ha, 3) + " : " + num(hb, 3) + " : " + num(hc, 3) + ").\n\n**Прямая Эйлера:** O, G, H лежат на одной прямой, OG = " + format(og, 3) + ", GH = " + format(gh, 3) + ", то есть GH = 2·OG (G делит OH в отношении 1 : 2).";
}
]
