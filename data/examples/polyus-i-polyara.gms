[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float k = 1; float ha = 4; float hb = 3;
float A = 0.0625; float C = 0.1111; float D = 0; float F = -1;
float nt = 0; float pOk = 1; float qOk = 1; string info = "";
func q(x, y) = A * x * x + C * y * y + D * x + F;
draw Region { name = "rq"; f = "q"; op = "<"; level = 0; color = #3b82f6; opacity = 0.12; quality = 3 }
draw Graph { name = "gP"; graph = "gp"; edgeColor = #f59e0b; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6; active = pOk > 0.5 }
draw Graph { name = "gQ"; graph = "gq"; edgeColor = #22c55e; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6; active = qOk > 0.5 }
new Point { name = "P"; pos = (6.5, 3); color = #f59e0b; text = true("P"); collideWithPoints = false; layer = 60 }
new Point { name = "Q"; pos = (-6, -2); color = #22c55e; text = true("Q"); collideWithPoints = false; layer = 60 }
new Point { name = "T1"; pos = (0, 0); dynamic = false; collision = false; text = true("T1"); active = nt > 0.5 }
new Point { name = "T2"; pos = (0, 0); dynamic = false; collision = false; text = true("T2"); active = nt > 1.5 }
new Line { name = "pt1"; pos = (P, T1); color = #f59e0b; thickness = 1.5; interact = false; active = nt > 0.5 }
new Line { name = "pt2"; pos = (P, T2); color = #f59e0b; thickness = 1.5; interact = false; active = nt > 1.5 }
new UI { type = button; label = "Эллипс"; action = "k = 1" }
new UI { type = button; label = "Гипербола"; action = "k = 2" }
new UI { type = button; label = "Парабола"; action = "k = 3" }
new UI { type = slider; label = "a"; variable = ha; min = 2; max = 6; step = 0.1; default = 4 }
new UI { type = slider; label = "b"; variable = hb; min = 1.5; max = 4.5; step = 0.1; default = 3 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function dist(la, lb, lc, x, y) { return abs(la * x + lb * y + lc) / sqrt(la * la + lb * lb); }
Update {
  if (k < 1.5) { A = 1 / (ha * ha); C = 1 / (hb * hb); D = 0; F = -1; }
  if (k > 1.5 && k < 2.5) { A = 1 / (ha * ha); C = -1 / (hb * hb); D = 0; F = -1; }
  if (k > 2.5) { A = 0; C = 1; D = -ha; F = 0; }
  float x0 = P.pos.x; float y0 = P.pos.y; float x1 = Q.pos.x; float y1 = Q.pos.y;
  float la = A * x0 + D / 2; float lb = C * y0; float lc = D * x0 / 2 + F;
  float ma = A * x1 + D / 2; float mb = C * y1; float mc = D * x1 / 2 + F;
  float n2 = la * la + lb * lb; float m2 = ma * ma + mb * mb;
  gp = newGraph(); gq = newGraph();
  pOk = 0; qOk = 0; nt = 0;
  if (n2 > 0.000001) {
    pOk = 1;
    float fx = -lc * la / n2; float fy = -lc * lb / n2; float dx = -lb / sqrt(n2); float dy = la / sqrt(n2);
    addNode(gp, "p1", [fx - 40 * dx, fy - 40 * dy]); addNode(gp, "p2", [fx + 40 * dx, fy + 40 * dy]); addEdge(gp, "p1", "p2");
    float q2 = A * dx * dx + C * dy * dy;
    float q1 = 2 * A * fx * dx + 2 * C * fy * dy + D * dx;
    float q0 = A * fx * fx + C * fy * fy + D * fx + F;
    if (abs(q2) > 0.000001) {
      float disc = q1 * q1 - 4 * q2 * q0;
      if (disc > 0.000001) {
        float s1 = (-q1 - sqrt(disc)) / (2 * q2); float s2 = (-q1 + sqrt(disc)) / (2 * q2);
        nt = 2;
        T1.pos.x = fx + s1 * dx; T1.pos.y = fy + s1 * dy; T2.pos.x = fx + s2 * dx; T2.pos.y = fy + s2 * dy;
      }
    } else {
      if (abs(q1) > 0.000001) { float s0 = -q0 / q1; nt = 1; T1.pos.x = fx + s0 * dx; T1.pos.y = fy + s0 * dy; }
    }
  }
  if (m2 > 0.000001) {
    qOk = 1;
    float gx = -mc * ma / m2; float gy = -mc * mb / m2; float ex = -mb / sqrt(m2); float ey = ma / sqrt(m2);
    addNode(gq, "q1", [gx - 40 * ex, gy - 40 * ey]); addNode(gq, "q2", [gx + 40 * ex, gy + 40 * ey]); addEdge(gq, "q1", "q2");
  }
  float bpq = A * x0 * x1 + C * y0 * y1 + D * (x0 + x1) / 2 + F;
  float f0 = A * x0 * x0 + C * y0 * y0 + D * x0 + F;
  string kurve = "";
  string rule = "";
  if (k < 1.5) { kurve = "эллипс x²/a² + y²/b² = 1 (a = " + format(ha, 1) + ", b = " + format(hb, 1) + ")"; rule = "x·x₀/a² + y·y₀/b² = 1"; }
  if (k > 1.5 && k < 2.5) { kurve = "гипербола x²/a² − y²/b² = 1 (a = " + format(ha, 1) + ", b = " + format(hb, 1) + ")"; rule = "x·x₀/a² − y·y₀/b² = 1"; }
  if (k > 2.5) { kurve = "парабола y² = 2px (p = " + format(ha / 2, 2) + ")"; rule = "y·y₀ = p(x + x₀)"; }
  string pst = "";
  if (pOk < 0.5) { pst = "У полюса в центре кривой поляры нет (она уходит в бесконечность)."; }
  else {
    if (abs(f0) < 0.02) { pst = "P лежит на кривой — поляра совпадает с касательной в этой точке."; }
    else {
      if (nt > 1.5) { pst = "P вне кривой: поляра пересекает её в точках касания T1 и T2 касательных, проведённых из P."; }
      else { pst = "Поляра не пересекает кривую в двух точках (P внутри кривой или касательных из P нет)."; }
    }
  }
  string on1 = "не лежит"; string on2 = "не лежит";
  if (pOk > 0.5 && dist(la, lb, lc, x1, y1) < 0.1) { on1 = "лежит"; }
  if (qOk > 0.5 && dist(ma, mb, mc, x0, y0) < 0.1) { on2 = "лежит"; }
  info = "**Полюс и поляра.** Кривая — " + kurve + ". Подстановка x² → x·x₀, y² → y·y₀, x → (x + x₀)/2 даёт поляру точки P(" + num(x0, 2) + "; " + num(y0, 2) + ") — оранжевую прямую: " + rule + ". " + pst + "\n\nТочка Q(" + num(x1, 2) + "; " + num(y1, 2) + ") " + on1 + " на поляре P, а P " + on2 + " на поляре Q (зелёная прямая): оба условия равносильны равенству B(P, Q) = 0, где B(P, Q) — левая часть уравнения кривой с подстановкой (сейчас " + num(bpq, 3) + ").";
}
]
