[
title = "y = ax^2 + bx + c"
undertitle = "Квадратичная функция"
description = "Меняйте коэффициенты a, b и c, чтобы увидеть, как парабола меняет форму и положение"

float a = 1;
float b = 0;
float c = 0;

func f(x) = a * x^2 + b * x + c;

draw Function {
    name = "quadGraph";
    f = "f";
    xmin = -10;
    xmax = 10;
    segments = 200;
    color = #818cf8;
    thickness = 3;
    grid = true;
    gridStep = 1;
}

new UI {
    type = slider;
    label = "a";
    variable = a;
    min = -3;
    max = 3;
    default = 1;
}

new UI {
    type = slider;
    label = "b";
    variable = b;
    min = -5;
    max = 5;
    default = 0;
}

new UI {
    type = slider;
    label = "c";
    variable = c;
    min = -8;
    max = 8;
    default = 0;
}

show axes = true;
show grid = true;
]
