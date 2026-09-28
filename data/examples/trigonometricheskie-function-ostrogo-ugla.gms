[
description = "{info}"

field width = 18; field height = 12;
camera type = fixed;

// ---- Прямоугольный треугольник: угол при A заблокирован в 90° (движок держит его прямым
// при перетаскивании любой вершины). Острый угол B меняется свободно от почти 0° до почти 90° —
// вместе с ним меняются все четыре отношения сторон. ----
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
  float opp = ca.length; float adj = ab.length; float hyp = bc.length;
  info = "**Угол B = " + format(angB.measure, 0) + "°.** Противолежащий катет CA = " + format(opp, 2) + ", прилежащий катет AB = " + format(adj, 2) + ", гипотенуза BC = " + format(hyp, 2) + ".\n\nsin B = CA / BC = " + format(opp / hyp, 3) + ", cos B = AB / BC = " + format(adj / hyp, 3) + ", tan B = CA / AB = " + format(opp / adj, 3) + ", cot B = AB / CA = " + format(adj / opp, 3) + ".\n\nЭти отношения зависят только от величины угла B: при увеличении масштаба треугольника (перетащите любую вершину так, чтобы угол не менялся) значения останутся теми же.";
}
]
