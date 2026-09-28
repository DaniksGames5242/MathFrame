[
description = "{info}"

field width = 18; field height = 12;
camera type = fixed;

// ---- Прямоугольный треугольник: угол при A заблокирован в 90°. Косинус угла B —
// отношение прилежащего катета AB к гипотенузе BC; меняется от 0 до 1. ----
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
  float adj = ab.length; float hyp = bc.length;
  float c = adj / hyp;
  info = "**cos B = AB / BC = " + format(adj, 2) + " / " + format(hyp, 2) + " = " + format(c, 3) + "**, при угле B = " + format(angB.measure, 0) + "°.\n\nЗначение всегда между 0 и 1: при угле, близком к 0°, прилежащий катет AB почти совпадает с гипотенузой (cos → 1), а при угле, близком к 90°, катет AB почти исчезает (cos → 0).\n\nУгол C дополняет B до 90 − " + format(angB.measure, 0) + " = " + format(90 - angB.measure, 0) + "°, и его синус равен cos B, поскольку катет AB для угла C — противолежащий.";
}
]
