[
description = "{info}"

field width = 18;
field height = 12;
camera type = fixed;

// ---- Пятый постулат Евклида: если секущая t пересекает прямые m и n так, что сумма
// внутренних односторонних углов меньше 180°, то m и n пересекаются с этой стороны.
// M, N — фиксированные точки на t; Dm, Dn — перетаскиваемые точки, задающие направления
// прямых m и n. ----
new Point { name = "M"; pos = (-6, 0); dynamic = false; collision = false }
new Point { name = "N"; pos = (6, 0); dynamic = false; collision = false }
new Line { name = "t"; pos = (M, N); interact = false }
new Point { name = "Dm"; pos = (-2, 3); pauseOnDrag = false; text = true("Dm") }
new Point { name = "Dn"; pos = (2, 2.6); pauseOnDrag = false; text = true("Dn") }
new Point { name = "Em"; pos = (-10, 15); dynamic = false; collision = false }
new Point { name = "En"; pos = (10, 13); dynamic = false; collision = false }
new Line { name = "m"; pos = (M, Em) }
new Line { name = "n"; pos = (N, En) }
new Point { name = "X"; pos = (0, 6); dynamic = false; collision = false; active = hit > 0.5 }

string info = "";
float hit = 0;

Function clamp(v, lo, hi) { if (v < lo) { return lo; } if (v > hi) { return hi; } return v; }
Function deg(r) { float d = r * 180 / pi; if (d < 0) { d = d + 360; } return d; }

Update {
  Dm.pos.y = clamp(Dm.pos.y, 0.4, fieldMaxY); Dn.pos.y = clamp(Dn.pos.y, 0.4, fieldMaxY);
  Em.pos.x = M.pos.x + (Dm.pos.x - M.pos.x) * 5; Em.pos.y = M.pos.y + (Dm.pos.y - M.pos.y) * 5;
  En.pos.x = N.pos.x + (Dn.pos.x - N.pos.x) * 5; En.pos.y = N.pos.y + (Dn.pos.y - N.pos.y) * 5;

  float angM = deg(atan2(Dm.pos.y - M.pos.y, Dm.pos.x - M.pos.x));
  float angN = 180 - deg(atan2(Dn.pos.y - N.pos.y, Dn.pos.x - N.pos.x));
  float s = angM + angN;

  hit = 0;
  if (s > 2 && s < 358) {
    float k1 = (Dm.pos.y - M.pos.y) / (Dm.pos.x - M.pos.x);
    float k2 = (Dn.pos.y - N.pos.y) / (Dn.pos.x - N.pos.x);
    if (abs(k1 - k2) > 0.001) {
      float xi = (k1 * M.pos.x - k2 * N.pos.x + N.pos.y - M.pos.y) / (k1 - k2);
      float yi = M.pos.y + k1 * (xi - M.pos.x);
      if (xi > -fieldMaxX && xi < fieldMaxX && yi > -fieldMaxY && yi < fieldMaxY) {
        X.pos.x = xi; X.pos.y = yi; hit = 1;
      }
    }
  }

  info = "**Постулат** — утверждение о допустимых построениях с геометрическими объектами, принимаемое без доказательства. Пятый постулат Евклида: секущая t пересекает прямые m и n; если сумма внутренних односторонних углов (здесь ∠(t, m) при M и ∠(t, n) при N, со стороны точки X) меньше 180°, прямые m и n пересекаются с этой стороны.\n\nСумма углов = " + format(s, 1) + "°.\n\n";
  if (s < 178) {
    info = info + "Сумма меньше 180° — по постулату m и n **должны пересечься** с этой стороны от t.";
    if (hit == 1) { info = info + " Точка пересечения X найдена именно там."; }
    else { info = info + " Она есть, но лежит за пределами поля — сдвиньте Dm или Dn ближе к t, чтобы её увидеть."; }
  } else if (s > 182) { info = info + "Сумма больше 180° — по постулату прямые пересекутся **с другой стороны** от t, а не здесь."; }
  else { info = info + "Сумма ≈ 180° — постулат ничего не гарантирует: m и n **параллельны**, пересечения нет ни с одной стороны."; }
}
]
