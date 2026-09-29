[
description = "{info}"

field width = 16;
field height = 12;
camera type = fixed;

// ---- Прямой угол AOB (заблокирован на 90°: движок сам держит эту величину, когда
// перетаскивают O, A или B). Лучи OC и OD — продолжения OA и OB за вершину O
// (вычисляются в Update как отражения A и B относительно O), поэтому AOC и BOD —
// развёрнутые углы, а BOC, AOD — смежные и вертикальные с AOB. ----
new Point { name = "O"; pos = (0, 0); text = true("O"); pauseOnDrag = false }
new Point { name = "A"; pos = (-5, 0); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (0, 5); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (5, 0); dynamic = false; collision = false; text = true("C") }
new Point { name = "D"; pos = (0, -5); dynamic = false; collision = false; text = true("D") }

new Line { name = "oa"; pos = (O, A) }
new Line { name = "ob"; pos = (O, B) }
new Line { name = "oc"; pos = (O, C); interact = false }
new Line { name = "od"; pos = (O, D); interact = false }

new Angle { name = "angAOB"; lines = (oa, ob); lock = true }
new Angle { name = "angBOC"; lines = (ob, oc) }
new Angle { name = "angAOD"; lines = (oa, od) }
new Angle { name = "angCOD"; lines = (oc, od) }
draw Angle { name = "arcAOB"; angle = "angAOB" }
draw Angle { name = "arcBOC"; angle = "angBOC" }
draw Angle { name = "arcAOD"; angle = "angAOD" }
draw Angle { name = "arcCOD"; angle = "angCOD" }

// ---- Логика ----
string info = "";
float pox = 0; float poy = 0; float pax = 0; float pay = 0; float pbx = 0; float pby = 0;

Function inField(x, y) { return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001; }

Start {
  pox = O.pos.x; poy = O.pos.y; pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y;
}

Update {
  // C и D — точки, диаметрально противоположные A и B относительно O (продолжения
  // лучей OA и OB). Пересчитываются каждый кадр — сами не перетаскиваются.
  C.pos.x = 2 * O.pos.x - A.pos.x; C.pos.y = 2 * O.pos.y - A.pos.y;
  D.pos.x = 2 * O.pos.x - B.pos.x; D.pos.y = 2 * O.pos.y - B.pos.y;
  if (!inField(C.pos.x, C.pos.y) || !inField(D.pos.x, D.pos.y)) {
    // Продолжение луча вышло за поле (например, O утащили к самому краю) — откатываем
    // весь кадр к последнему корректному положению.
    O.pos.x = pox; O.pos.y = poy; A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby;
    C.pos.x = 2 * O.pos.x - A.pos.x; C.pos.y = 2 * O.pos.y - A.pos.y;
    D.pos.x = 2 * O.pos.x - B.pos.x; D.pos.y = 2 * O.pos.y - B.pos.y;
  }
  pox = O.pos.x; poy = O.pos.y; pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y;

  info = "**Угол AOB прямой:** ∠AOB = " + format(angAOB.measure, 0) + "°.\n\n**Смежный с прямым — тоже прямой:** ∠BOC = " + format(angBOC.measure, 0) + "° (OC — продолжение OA), в сумме с ∠AOB даёт развёрнутый угол " + format(angAOB.measure + angBOC.measure, 0) + "°.\n\n**Вертикальный прямому — тоже прямой:** ∠AOD = " + format(angAOD.measure, 0) + "°, ∠COD = " + format(angCOD.measure, 0) + "° — все четыре угла при O прямые и в сумме дают полный угол " + format(angAOB.measure + angBOC.measure + angAOD.measure + angCOD.measure, 0) + "°.";
}
]
