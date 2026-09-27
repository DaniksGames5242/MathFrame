[
description = "{info}"
field width = 12; field height = 10;
camera type = fixed;
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; size = 0.4 }
new Circle { name = "w"; center = O; radius = 4 }
new Point { name = "A"; circle = "w"; t = 0.05; text = true("A"); pauseOnDrag = false }
new Point { name = "B"; circle = "w"; t = 0.35; text = true("B"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B); color = #3b82f6; thickness = 3 }
float angA = 0; float angB = 0; float sweep = 0; string info = "";
new Curve { name = "arc"; type = parametric; x = "4 * cos(angA + t * sweep)"; y = "4 * sin(angA + t * sweep)"; segments = 200; color = #3b82f6; thickness = 3 }
Update {
  angA = atan2(A.pos.y, A.pos.x); angB = atan2(B.pos.y, B.pos.x);
  sweep = angB - angA; if (sweep < 0) { sweep = sweep + 2 * pi; }
  float deg = sweep * 180 / pi; float Ssec = sweep * 16 / 2; float Stri = 16 * sin(sweep) / 2; float S = Ssec - Stri;
  string vid = "малый"; if (deg > 180) { vid = "большой"; }
  info = "**Сегмент** — часть круга радиуса r = 4, отсекаемая хордой AB вместе с дугой AB, которую эта хорда стягивает (сегмент " + vid + ", так как ∠AOB = " + format(deg, 1) + "°).\n\nПлощадь сегмента S = Sсект − S△ = ½r²α − ½r²sin α = " + format(Ssec, 2) + " − " + format(Stri, 2) + " ≈ " + format(S, 2) + ".";
}
]
