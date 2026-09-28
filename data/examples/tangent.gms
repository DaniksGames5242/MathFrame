[
description = "{info}"

field width = 18; field height = 12;
camera type = fixed;

// ---- Прямоугольный треугольник: угол при A заблокирован в 90°. Тангенс угла B —
// отношение противолежащего катета CA к прилежащему AB; растёт неограниченно при
// приближении угла к 90°. ----
new Point { name = "A"; pos = (-6, -4); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5, -4); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (-6, 4); text = true("C"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }

new Angle { name = "angA"; lines = (ab, ca); lock = true }
draw Angle { name = "arcA"; angle = "angA"; measure = false }
new Angle { name = "angB"; lines = (ab, bc) }
draw Angle { name = "arcB"; angle = "angB" }

// ---- Логика ----
string info = "";

Update {
  float opp = ca.length; float adj = ab.length;
  float t = opp / adj;
  info = "**tan B = CA / AB = " + format(opp, 2) + " / " + format(adj, 2) + " = " + format(t, 3) + "**, при угле B = " + format(angB.measure, 0) + "°.\n\nЗначение положительно и растёт вместе с углом: при малом угле B катет CA мал по сравнению с AB (tan → 0), а при угле, приближающемся к 90°, катет CA неограниченно растёт относительно AB (tan → ∞).\n\ntan B · cot B = 1: котангенс — отношение тех же катетов в обратном порядке, AB / CA = " + format(adj / opp, 3) + ".";
}
]
