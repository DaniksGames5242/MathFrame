[
description = "{info}"

field width = 18; field height = 12;
camera type = fixed;

// ---- Прямоугольный треугольник: угол при A заблокирован в 90°. Синус угла B —
// отношение противолежащего катета CA к гипотенузе BC; меняется от 0 до 1. ----
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
  float opp = ca.length; float hyp = bc.length;
  float s = opp / hyp;
  info = "**sin B = CA / BC = " + format(opp, 2) + " / " + format(hyp, 2) + " = " + format(s, 3) + "**, при угле B = " + format(angB.measure, 0) + "°.\n\nЗначение всегда между 0 и 1: при угле, близком к 0°, противолежащий катет почти исчезает (sin → 0), а при угле, близком к 90°, катет CA почти совпадает с гипотенузой (sin → 1).\n\nУгол C дополняет B до 90°: он равен 90 − " + format(angB.measure, 0) + " = " + format(90 - angB.measure, 0) + "°, и его косинус равен sin B, поскольку катет CA для угла C — прилежащий.";
}
]
