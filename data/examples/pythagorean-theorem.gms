[
space = 2D
title = "Теорема Пифагора"
undertitle = "Прямоугольный треугольник"
description = "Перетащите точку C и посмотрите, как соотносятся катеты и гипотенуза"

new Point { name = "A"; pos = (-4, -2); color = #3b82f6; text = true("A"); dynamic = true }
new Point { name = "B"; pos = (3, -2); color = #3b82f6; text = true("B"); dynamic = true }
new Point { name = "C"; pos = (3, 2.5); color = #f59e0b; text = true("C"); dynamic = true }

new Line { name = "ab"; pos = (A, B); color = #e8e8f0; thickness = 2; interect = true } 
new Line { name = "bc"; pos = (B, C); color = #e8e8f0; thickness = 2; interect = true }
new Line { name = "ca"; pos = (C, A); color = #7c7cff; thickness = 2; interect = true }

show axes = true;
show grid = true;
]
