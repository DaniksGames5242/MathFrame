[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Все остатки 0…n−1 по кругу; серые стрелки — шифрование m ↦ mᵉ mod n. Каждый остаток
// получает ровно одну стрелку и ровно одну выпускает: шифрование — перестановка, поэтому его
// можно обратить. Оранжевая — сообщение m, зелёная — шифротекст c, стрелки m → c → m. ----
draw Graph { name = "gAll"; graph = "ga"; nodeColor = #6b7280; edgeColor = #4b5563; nodeRadius = 10; directed = true; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gEnc"; graph = "ge"; nodeColor = #f59e0b; edgeColor = #f59e0b; edgeWidth = 3.5; nodeRadius = 12; directed = true; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gC"; graph = "gcc"; nodeColor = #22c55e; nodeRadius = 12; labels = true; interactive = false; showWeights = false; layer = 11 }
draw Graph { name = "gDec"; graph = "gd"; edgeColor = #22c55e; edgeWidth = 3.5; nodeRadius = 0; labels = false; directed = true; interactive = false; showWeights = false; layer = 9 }

new UI { name = "sPQ"; type = select; label = "p, q"; variable = pq; options = (35, 37, 57, 311, 511, 711); labels = ("p = 3, q = 5", "p = 3, q = 7", "p = 5, q = 7", "p = 3, q = 11", "p = 5, q = 11", "p = 7, q = 11"); default = 511 }
new UI { name = "sM"; type = slider; label = "сообщение m"; variable = m; min = 0; max = n - 1; step = 1; default = 12 }

// ---- Логика ----
float pq = 511; float lastPQ = 0;
float p = 5; float q = 7; float n = 35; float phi = 24; float e = 5; float d = 5;
float m = 12;  float c = 0; float lastM = -1;
string info = "";

Function md(a, b) { return a - floor(a / b) * b; }
Function gcd(a, b) { repeat (30) { if (b > 0) { float r = md(a, b); a = b; b = r; } } return a; }
// a^k mod n — по одному умножению (числа маленькие)
Function pw(a, k, mm) { float r = 1; repeat (k) { r = md(r * a, mm); } return r; }
Function ang(k) { return pi / 2 - 2 * pi * k / n; }
Function R() { if (n > 40) { return 4.3; } return 4; }

Update {
  if (pq != lastPQ) {
    p = floor(pq / 10); q = md(pq, 10);
    if (pq > 100) { p = floor(pq / 100); q = md(pq, 100); }
    n = p * q; phi = (p - 1) * (q - 1);
    // e — наименьшее > 1, взаимно простое с φ(n); d — обратное к e по модулю φ(n)
    e = 0; repeat (phi) { if (e == 0 && i > 1 && gcd(i, phi) == 1) { e = i; } }
    d = 0; repeat (phi) { if (d == 0 && md(e * i, phi) == 1) { d = i; } }
    ga = newGraph();
    repeat (n) { addNode(ga, format(i, 0), [R() * cos(ang(i)), R() * sin(ang(i))]); }
    repeat (n) { float t = pw(i, e, n); if (t != i) { addEdge(ga, format(i, 0), format(t, 0)); } }
    lastPQ = pq; lastM = -1;
  }
  m = min(m, n - 1);
  if (m != lastM) {
    c = pw(m, e, n);
    ge = newGraph(); gd = newGraph(); gcc = newGraph();
    addNode(ge, format(m, 0), [R() * cos(ang(m)), R() * sin(ang(m))]);
    addNode(gcc, format(c, 0), [R() * cos(ang(c)), R() * sin(ang(c))]);
    if (c != m) {
      // шифрование — по кругу узлов, расшифрование — по внутреннему кругу (чтобы стрелки не слились)
      addNode(ge, "c", [R() * cos(ang(c)), R() * sin(ang(c))], ""); addEdge(ge, format(m, 0), "c");
      float r2 = R() - 0.75;
      addNode(gd, "c", [r2 * cos(ang(c)), r2 * sin(ang(c))]); addNode(gd, "m", [r2 * cos(ang(m)), r2 * sin(ang(m))]); addEdge(gd, "c", "m");
    }
    lastM = m;
  }
  float back = pw(c, d, n);
  info = "**RSA** — шифрование с открытым ключом. Выбирают два простых числа p и q, n = pq, φ(n) = (p − 1)(q − 1), открытую экспоненту e, взаимно простую с φ(n), и секретную d с e·d ≡ 1 (mod φ(n)). Открытый ключ (n, e) знают все: шифрование c = mᵉ mod n. Расшифровать может только знающий d: m = c^d mod n — это следует из теоремы Эйлера. Найти d, зная лишь n и e, так же трудно, как разложить n на множители.\n\np = " + format(p, 0) + ", q = " + format(q, 0) + ", n = " + format(n, 0) + ", φ(n) = " + format(phi, 0) + ", e = " + format(e, 0) + ", d = " + format(d, 0) + " (e·d = " + format(e * d, 0) + " ≡ 1).\n\nm = " + format(m, 0) + "  →  c = " + format(m, 0) + "^" + format(e, 0) + " mod " + format(n, 0) + " = **" + format(c, 0) + "**  →  c^" + format(d, 0) + " mod " + format(n, 0) + " = **" + format(back, 0) + "**.";
  if (c == m) { info = info + " Это неподвижная точка шифрования: mᵉ ≡ m — такие сообщения RSA «не прячет» (например, 0 и 1)."; }
}
]
