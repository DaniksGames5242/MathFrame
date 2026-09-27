[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
show axes = true; show grid = true;
new Point { name = "A"; pos = (-6, -3) }
new Point { name = "B"; pos = (5, 3) }
new Point { name = "C"; pos = (-1, -3) }
new Line { name = "ab"; pos = (A, B) }
string info = "";
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  float d = (B.pos.x - A.pos.x) * (C.pos.y - A.pos.y) - (B.pos.y - A.pos.y) * (C.pos.x - A.pos.x);
  string r = "точки не лежат на одной прямой (векторы AB и AC не коллинеарны)";
  if (abs(d) < 0.05) { r = "точки лежат на одной прямой (векторы AB и AC коллинеарны)"; }
  info = "**Условие коллинеарности:** три точки A, B, C лежат на одной прямой тогда и только тогда, когда определитель, составленный из координат векторов AB и AC, равен нулю.\n\nΔ = (Bₓ − Aₓ)·(Cᵤ − Aᵤ) − (Bᵤ − Aᵤ)·(Cₓ − Aₓ), где Cᵤ, Aᵤ, Bᵤ — координаты y. Δ = " + num(d, 2) + " — " + r + ".";
}
]
