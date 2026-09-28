[
description = "{info}"

field width = 20;
field height = 11;
camera type = fixed;

// ---- Исходный треугольник ABC (вершины свободны) слева и его образ A'B'C' справа —
// параллельный перенос, поворот или отражение, которые задаёт ползунок сдвига t и
// кнопка «отражение». Показывает, что плоская фигура сохраняет площадь при движении,
// а ориентация меняется на противоположную только при отражении. ----
new Point { name = "A"; pos = (-9, -3.5); text = true("A") }
new Point { name = "B"; pos = (-3.5, -4); text = true("B") }
new Point { name = "C"; pos = (-6, 3.5); text = true("C") }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "fig"; elements = (ab, bc, ca) }

new Point { name = "A2"; pos = (2, 0); dynamic = false; text = true("A′"); color = #3b82f6 }
new Point { name = "B2"; pos = (2, 0); dynamic = false; text = true("B′"); color = #3b82f6 }
new Point { name = "C2"; pos = (2, 0); dynamic = false; text = true("C′"); color = #3b82f6 }
new Line { name = "a2b2"; pos = (A2, B2); color = #3b82f6; interact = false }
new Line { name = "b2c2"; pos = (B2, C2); color = #3b82f6; interact = false }
new Line { name = "c2a2"; pos = (C2, A2); color = #3b82f6; interact = false }
new Figure { name = "fig2"; elements = (a2b2, b2c2, c2a2); interact = false }

new UI { name = "sT"; type = slider; label = "угол поворота"; variable = ang; min = 0; max = 360; step = 1; default = 0 }
new UI { name = "bR"; type = button; label = "отражение вкл/выкл"; action = "refl = 1 - refl" }

// ---- Логика ----
float ang = 0;
float refl = 0;
float shiftX = 11;
string info = "";
float s1 = 0; float s2 = 0;

Function rot(cx, cy, px, py, a, m) {
  float r = radians(a);
  float dx = (px - cx) * m;
  float rx = cx + dx * cos(r) - (py - cy) * sin(r) + shiftX;
  return rx;
}
Function roty(cx, cy, px, py, a, m) {
  float r = radians(a);
  float dx = (px - cx) * m;
  return cy + dx * sin(r) + (py - cy) * cos(r);
}

Update {
  // Центр исходного треугольника — центр поворота; сдвиг на shiftX переносит образ
  // в правую половину поля. m = -1 при включённом отражении зеркалит по x до поворота.
  float gx = (A.pos.x + B.pos.x + C.pos.x) / 3;
  float gy = (A.pos.y + B.pos.y + C.pos.y) / 3;
  float m = 1; if (refl > 0.5) { m = -1; }
  A2.pos.x = rot(gx, gy, A.pos.x, A.pos.y, ang, m); A2.pos.y = roty(gx, gy, A.pos.x, A.pos.y, ang, m);
  B2.pos.x = rot(gx, gy, B.pos.x, B.pos.y, ang, m); B2.pos.y = roty(gx, gy, B.pos.x, B.pos.y, ang, m);
  C2.pos.x = rot(gx, gy, C.pos.x, C.pos.y, ang, m); C2.pos.y = roty(gx, gy, C.pos.x, C.pos.y, ang, m);

  // Знаковая площадь (шнурок) — знак задаёт ориентацию обхода ABC.
  s1 = (B.pos.x - A.pos.x) * (C.pos.y - A.pos.y) - (C.pos.x - A.pos.x) * (B.pos.y - A.pos.y);
  s2 = (B2.pos.x - A2.pos.x) * (C2.pos.y - A2.pos.y) - (C2.pos.x - A2.pos.x) * (B2.pos.y - A2.pos.y);

  info = "**Плоская фигура** ABC целиком лежит в плоскости; её образ A′B′C′ получен движением — параллельным переносом с поворотом" + iif(refl > 0.5, " и отражением", "") + ". **Площадь сохраняется:** S(ABC) = " + format(abs(s1) / 2, 2) + " = S(A′B′C′) = " + format(abs(s2) / 2, 2) + ".\n\n**Ориентация** обхода ABC — " + iif(s1 > 0, "против часовой", "по часовой") + ", у образа — " + iif(s2 > 0, "против часовой", "по часовой") + iif((s1 > 0) == (s2 > 0), " (та же — движение прямое)", " (противоположная — движение зеркальное)") + ".";
}

Function iif(c, s1v, s2v) { if (c) { return s1v; } return s2v; }
]
