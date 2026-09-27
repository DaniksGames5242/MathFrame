[
description = "{info}"

field width = 18;
field height = 12;
camera type = fixed;

// ---- Две данные точки A, B и точка P, задающая отношение k = PA : PB ----
new Point { name = "A"; pos = (-2.5, 0); text = true("A"); pauseOnDrag = false; color = #3b82f6 }
new Point { name = "B"; pos = (2, 0); text = true("B"); pauseOnDrag = false; color = #f59e0b }
new Point { name = "P"; pos = (1.2, 1.6); text = true("P"); pauseOnDrag = false }

// ---- ГМТ: окружность Аполлония (или серединный перпендикуляр при k = 1) ----
new Point { name = "Ctr"; pos = (0, 0); dynamic = false; collision = false; size = 0.5 }
new Circle { name = "apo"; center = Ctr; radius = P; color = #22c55e; thickness = 3 }
new Point { name = "L1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "L2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "bis"; pos = (L1, L2); color = #22c55e; thickness = 3; interact = false }
new Claster { name = "asCircle"; elements = (apo, Ctr); active = true }
new Claster { name = "asLine"; elements = (bis); active = false }

// Точка Q ходит по найденному ГМТ (угол вокруг центра / смещение вдоль прямой)
new Point { name = "Q"; pos = (0, 0); text = true("Q"); pauseOnDrag = false; collideWithPoints = false }
new Line { name = "pa"; pos = (P, A); color = #3b82f6; interact = false }
new Line { name = "pb"; pos = (P, B); color = #f59e0b; interact = false }
new Line { name = "qa"; pos = (Q, A); color = #3b82f6; interact = false }
new Line { name = "qb"; pos = (Q, B); color = #f59e0b; interact = false }
new Line { name = "ab"; pos = (A, B); interact = false; thickness = 1.5 }

// ---- Логика ----
string info = "";
float k = 1;
float qAng = -0.8;
float qPrevX = 0; float qPrevY = 0;
float onLine = 0;

Update {
  float pa2 = (P.pos.x - A.pos.x) ^ 2 + (P.pos.y - A.pos.y) ^ 2;
  float pb2 = (P.pos.x - B.pos.x) ^ 2 + (P.pos.y - B.pos.y) ^ 2;
  k = sqrt(pa2 / (pb2 + 0.000001));
  // Близко к k = 1 — «примагничиваем» P на серединный перпендикуляр: ГМТ — прямая
  onLine = 0;
  float mx = (A.pos.x + B.pos.x) / 2; float my = (A.pos.y + B.pos.y) / 2;
  float ux = B.pos.x - A.pos.x; float uy = B.pos.y - A.pos.y; float ul = sqrt(ux * ux + uy * uy) + 0.000001;
  ux = ux / ul; uy = uy / ul;
  float along = (P.pos.x - mx) * ux + (P.pos.y - my) * uy;
  if (abs(along) < 0.12) { P.pos.x = P.pos.x - along * ux; P.pos.y = P.pos.y - along * uy; k = 1; onLine = 1; }

  // Q тянут — запоминаем её «координату» на ГМТ
  if (abs(Q.pos.x - qPrevX) + abs(Q.pos.y - qPrevY) > 0.000001) {
    if (onLine == 1) { qAng = (Q.pos.x - mx) * -uy + (Q.pos.y - my) * ux; }
    else { qAng = atan2(Q.pos.y - Ctr.pos.y, Q.pos.x - Ctr.pos.x); }
  }

  if (onLine == 1) {
    asCircle.active = false; asLine.active = true;
    L1.pos.x = mx - uy * 30; L1.pos.y = my + ux * 30; L2.pos.x = mx + uy * 30; L2.pos.y = my - ux * 30;
    if (abs(qAng) > 4.5) { qAng = 4.5 * qAng / abs(qAng); }
    Q.pos.x = mx - uy * qAng; Q.pos.y = my + ux * qAng;
  } else {
    asCircle.active = true; asLine.active = false;
    // Центр окружности Аполлония: (A − k²B) / (1 − k²)
    float k2 = k * k;
    Ctr.pos.x = (A.pos.x - k2 * B.pos.x) / (1 - k2); Ctr.pos.y = (A.pos.y - k2 * B.pos.y) / (1 - k2);
    float rad = sqrt((P.pos.x - Ctr.pos.x) ^ 2 + (P.pos.y - Ctr.pos.y) ^ 2);
    // Q — на видимой части окружности: ближайший к желаемому угол, при котором Q в поле
    float best = qAng; float bestD = 100;
    repeat (73) {
      float an = qAng + (i - 36) * 0.0873;
      float qx = Ctr.pos.x + rad * cos(an); float qy = Ctr.pos.y + rad * sin(an);
      if (abs(qx) <= fieldMaxX && abs(qy) <= fieldMaxY && abs(i - 36) < bestD) { best = an; bestD = abs(i - 36); }
    }
    qAng = best;
    Q.pos.x = Ctr.pos.x + rad * cos(qAng); Q.pos.y = Ctr.pos.y + rad * sin(qAng);
  }
  qPrevX = Q.pos.x; qPrevY = Q.pos.y;

  if (onLine == 1) {
    info = "**При k = 1** точки, равноудалённые от A и B, образуют прямую — серединный перпендикуляр к AB.\n\nPA = PB = " + format(pa.length, 2) + ", QA = QB = " + format(qa.length, 2) + ".";
  } else {
    info = "**Окружность Аполлония:** множество точек, отношение расстояний от которых до двух данных точек A и B постоянно и равно k ≠ 1, — окружность. Её центр лежит на прямой AB.\n\nk = PA : PB = " + format(pa.length, 2) + " : " + format(pb.length, 2) + " = " + format(k, 3) + ";   для точки Q этой окружности QA : QB = " + format(qa.length / qb.length, 3) + ".";
  }
}
]
