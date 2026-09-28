[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Вкладка 1: общая theorem — сумма углов любого треугольника равна 180°. ----
new Point { name = "A"; pos = (-6, -3.5); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5, -3.5); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (-1, 3.8); text = true("C"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }
new Angle { name = "angA"; lines = (ab, ca) }
new Angle { name = "angB"; lines = (ab, bc) }
new Angle { name = "angC"; lines = (bc, ca) }
draw Angle { name = "arcA"; angle = "angA" }
draw Angle { name = "arcB"; angle = "angB" }
draw Angle { name = "arcC"; angle = "angC" }
new Claster { name = "tabGen"; elements = (A, B, C, ab, bc, ca, tri, arcA, arcB, arcC); active = true }

// ---- Вкладка 2: следствие — если угол при вершине прямой (90°, зафиксировано),
// то два оставшихся угла в сумме дают 90° — без нового доказательства, только
// подстановка 90° в 180° = ∠A + ∠B + ∠C. ----
new Point { name = "D"; pos = (-6, -3.5); text = true("D"); pauseOnDrag = false }
new Point { name = "E"; pos = (5, -3.5); text = true("E"); pauseOnDrag = false }
new Point { name = "F"; pos = (-6, 3.8); text = true("F"); pauseOnDrag = false }
new Line { name = "de"; pos = (D, E) }
new Line { name = "ef"; pos = (E, F) }
new Line { name = "fd"; pos = (F, D) }
new Figure { name = "def"; elements = (de, ef, fd) }
new Angle { name = "angD"; lines = (de, fd); lock = true }
new Angle { name = "angE"; lines = (de, ef) }
new Angle { name = "angF"; lines = (ef, fd) }
draw Angle { name = "arcD"; angle = "angD" }
draw Angle { name = "arcE"; angle = "angE" }
draw Angle { name = "arcF"; angle = "angF" }
new Claster { name = "tabCor"; elements = (D, E, F, de, ef, fd, def, arcD, arcE, arcF); active = false }

new UI { name = "btnGen"; type = button; label = "Общая theorem"; action = "tab = 1; tabGen.active = true; tabCor.active = false" }
new UI { name = "btnCor"; type = button; label = "Следствие"; action = "tab = 2; tabGen.active = false; tabCor.active = true" }

float tab = 1;
string info = "";

Update {
  if (tab == 1) {
    info = "**Теорема:** в любом треугольнике сумма углов равна 180°. ∠A = " + format(angA.measure, 0) + "°, ∠B = " + format(angB.measure, 0) + "°, ∠C = " + format(angC.measure, 0) + "°, сумма — " + format(angA.measure + angB.measure + angC.measure, 0) + "°.";
  } else {
    info = "**Следствие** (частный случай теоремы, без нового доказательства): если угол при D — прямой (∠D = 90°), то подстановка в равенство ∠D + ∠E + ∠F = 180° сразу даёт ∠E + ∠F = 90°. Сейчас ∠E = " + format(angE.measure, 0) + "°, ∠F = " + format(angF.measure, 0) + "°, сумма — " + format(angE.measure + angF.measure, 0) + "°.";
  }
}
]
