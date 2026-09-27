[
description = "Перетаскивайте вершины **A**, **B** и **D** — вершина **C** строится сама, поэтому фигура всегда остаётся параллелограммом. Переключайте вкладки, чтобы увидеть разные свойства."

// ---- Вершины: A, B, D свободные, C = B + (D − A) — параллелограмм при любом положении ----
new Point { name = "A"; pos = (-5, -3); text = true("A") }
new Point { name = "B"; pos = (3, -3); text = true("B") }
new Point { name = "D"; pos = (-2, 2.5); text = true("D") }
new Point { name = "C"; translate = B; dx = D.pos.x - A.pos.x; dy = D.pos.y - A.pos.y; text = true("C") }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }

// ---- Вкладка 1: стороны и углы ----
draw EquallySing { name = "eqAbCd"; edges = (ab, cd); type = 1 }
draw EquallySing { name = "eqBcDa"; edges = (bc, da); type = 2 }

new Angle { name = "angA"; lines = (ab, da) }
new Angle { name = "angB"; lines = (ab, bc) }
new Angle { name = "angC"; lines = (bc, cd) }
new Angle { name = "angD"; lines = (cd, da) }
draw Angle { name = "arcA"; angle = "angA"; radius = 1.4 }
draw Angle { name = "arcB"; angle = "angB"; radius = 1.4; count = 2 }
draw Angle { name = "arcC"; angle = "angC"; radius = 1.4 }
draw Angle { name = "arcD"; angle = "angD"; radius = 1.4; count = 2 }

draw Text { name = "txtAngles"; pos = (0, -5.5); text = "∠A + ∠B = " + format(angA.measure + angB.measure, 0) + "°" }

new Claster { name = "tabSides"; elements = (eqAbCd, eqBcDa, arcA, arcB, arcC, arcD, txtAngles); active = true }

// ---- Вкладка 2: диагонали делятся точкой пересечения пополам ----
new Point { name = "O"; construct = median; vertex = B; base = "diagAC"; dynamic = false; text = true("O") }
new Line { name = "diagAC"; pos = (A, C); active = false; interact = false }
new Line { name = "ao"; pos = (A, O); interact = false }
new Line { name = "oc"; pos = (O, C); interact = false }
new Line { name = "bo"; pos = (B, O); interact = false }
new Line { name = "od"; pos = (O, D); interact = false }
draw EquallySing { name = "eqAoOc"; edges = (ao, oc); type = 1 }
draw EquallySing { name = "eqBoOd"; edges = (bo, od); type = 2 }

draw Text { name = "txtDiag"; pos = (0, -5.5); text = "AO = OC = " + format(ao.length, 2) + "     BO = OD = " + format(bo.length, 2) }

new Claster { name = "tabDiag"; elements = (O, ao, oc, bo, od, eqAoOc, eqBoOd, txtDiag); active = false }

// ---- Вкладка 3: площадь = основание × высота ----
new Point { name = "H"; construct = altitude; vertex = D; base = "ab"; dynamic = false; text = true("H") }
new Line { name = "dh"; pos = (D, H); interact = false }
// Прямой угол при H отмечается между DH и невидимой (transparent) вспомогательной HA.
// Пунктир продолжения стороны AB рисуется по отдельной скрытой линии haExt — у неё цвет
// не задан, поэтому пунктир следует теме. Слой 1 — под стороной AB: пунктир заметен,
// только когда основание высоты H выходит за отрезок AB.
new Line { name = "ha"; pos = (H, A); color = "transparent"; interact = false; layer = 1 }
new Line { name = "haExt"; pos = (H, A); active = false; interact = false }
draw Punctir { name = "extAB"; edge = "haExt"; layer = 1 }
new Angle { name = "angH"; lines = (dh, ha) }
draw Angle { name = "arcH"; angle = "angH"; measure = false }

float s = 0;
Update {
  s = abs((B.pos.x - A.pos.x) * (D.pos.y - A.pos.y) - (B.pos.y - A.pos.y) * (D.pos.x - A.pos.x));
}
draw Text { name = "txtArea"; pos = (0, -5.5); text = "S = AB · DH = " + format(ab.length, 2) + " · " + format(dh.length, 2) + " = " + format(s, 2) }

new Claster { name = "tabArea"; elements = (H, dh, ha, arcH, extAB, txtArea); active = false }

// ---- Кнопки вкладок ----
new UI { name = "btnSides"; type = button; label = "Стороны и углы"; action = "tabSides.active = true; tabDiag.active = false; tabArea.active = false" }
new UI { name = "btnDiag"; type = button; label = "Диагонали"; action = "tabSides.active = false; tabDiag.active = true; tabArea.active = false" }
new UI { name = "btnArea"; type = button; label = "Площадь"; action = "tabSides.active = false; tabDiag.active = false; tabArea.active = true" }

show grid = true;
]
