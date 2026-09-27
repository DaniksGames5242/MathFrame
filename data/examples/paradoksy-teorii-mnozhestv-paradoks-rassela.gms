[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Деревня: стрелка x → y — «x бреет y», петля — «бреет сам себя». Брадобрей (в центре) по
// правилу бреет тех и только тех, кто не бреет себя сам. Клик по жителю меняет, бреет ли он себя;
// кнопка решает, бреет ли себя брадобрей. Красным — где правило нарушено. ----
draw Graph { name = "gV"; graph = "gv"; nodeColor = #6b7280; edgeColor = #6b7280; nodeRadius = 22; directed = true; interactive = false; showWeights = false; layer = 13 }
draw Graph { name = "gB"; graph = "gbb"; nodeColor = #3b82f6; edgeColor = #3b82f6; nodeRadius = 22; directed = true; interactive = false; showWeights = false; layer = 12 }
draw Graph { name = "gX"; graph = "gxx"; nodeColor = #ef4444; edgeColor = #ef4444; edgeWidth = 3; nodeRadius = 25; directed = true; labels = false; interactive = false; showWeights = false; layer = 9 }
draw Text { name = "tb"; pos = (0, -1.4); text = "брадобрей"; size = 1; color = #3b82f6 }

new UI { name = "bS"; type = button; label = "Брадобрей бреет себя: да / нет"; action = "self = 1 - self" }

// ---- Логика ----
float self = 0;
float clicks = 0;
list sh = (1, 0, 1, 0, 0, 1);
string names = "";
string info = "";

Function nm(k) { if (k == 0) { return "Анна"; } if (k == 1) { return "Борис"; } if (k == 2) { return "Вера"; } if (k == 3) { return "Глеб"; } if (k == 4) { return "Дина"; } return "Ефим"; }
Function vx(k) { return 3.6 * cos(pi / 2 - 2 * pi * k / 6) * 1.35; }
Function vy(k) { return 3.6 * sin(pi / 2 - 2 * pi * k / 6) * 0.95 - 0.3; }

Update {
  if (mouseClickCount != clicks) {
    clicks = mouseClickCount;
    repeat (6) { if ((mouseClickX - vx(i)) ^ 2 + (mouseClickY - vy(i)) ^ 2 < 0.8) { sh[i] = 1 - sh[i]; } }
  }
  gv = newGraph(); gbb = newGraph(); gxx = newGraph();
  addNode(gbb, "Б", [0, -0.3]);
  repeat (6) {
    addNode(gv, nm(i), [vx(i), vy(i)]); addNode(gbb, nm(i), [vx(i), vy(i)]);
    if (sh[i] == 1) { addEdge(gv, nm(i), nm(i)); }
    else { addEdge(gbb, "Б", nm(i)); }
  }
  if (self == 1) { addEdge(gbb, "Б", "Б"); }
  // противоречие: брадобрей обязан брить себя ⇔ он себя не бреет
  addNode(gxx, "Б", [0, -0.3]);

  info = "**Парадокс Рассела** (1901). Назовём множество «нормальным», если оно не содержит само себя как элемент, и рассмотрим множество всех нормальных множеств R = {x : x ∉ x}. Содержит ли R само себя? Если R ∈ R, то по определению R ∉ R; если R ∉ R, то R нормально и потому R ∈ R. Противоречие показывает, что «множество всех множеств с данным свойством» не всегда существует — наивная теория множеств противоречива, и её заменили аксиоматическими (ZFC), где такое R построить нельзя.\n\nПопулярная версия — **брадобрей**, который бреет тех и только тех жителей, кто не бреет себя сам (он — это R, «брить» — это «содержать»). С жителями правило выполнить легко: синие стрелки идут ровно к тем, у кого нет петли.  ";
  if (self == 1) { info = info + "**Брадобрей бреет себя** — но тогда он бреет того, кто бреет себя сам: правило нарушено."; }
  else { info = info + "**Брадобрей себя не бреет** — значит, он из тех, кто себя не бреет, и по правилу обязан себя брить: правило нарушено."; }
  info = info + " Ни один вариант не проходит: такого брадобрея не может существовать.\n\nКлик по жителю меняет, бреет ли он себя сам.";
}
]
