[
description = "{info}"

field width = 18; field height = 12;
camera type = fixed;

// ---- Прямоугольный треугольник: угол при A заблокирован в 90°. Котангенс угла B —
// отношение прилежащего катета AB к противолежащему CA; растёт неограниченно при
// приближении угла к 0°. ----
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
  float ct = adj / opp;
  info = "**cot B = AB / CA = " + format(adj, 2) + " / " + format(opp, 2) + " = " + format(ct, 3) + "**, при угле B = " + format(angB.measure, 0) + "°.\n\nЗначение положительно и убывает с ростом угла: при малом угле B катет AB велик по сравнению с CA (cot → ∞), а при угле, приближающемся к 90°, катет CA превосходит AB (cot → 0).\n\ncot B · tan B = 1: тангенс — отношение тех же катетов в обратном порядке, CA / AB = " + format(opp / adj, 3) + ".";
}
]
