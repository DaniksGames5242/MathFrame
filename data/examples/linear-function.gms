[
title = "y = " + k + " * x + " + b;
undertitle = "Линейная функция";
description = "Двигайте ползунки k и b и смотрите, как меняется график";

float k = 1;
float b = 0;

func f(x) = k * x * x + b;

draw Function {
    name = "linGraph";
    f = "f";
    xmin = -100;
    xmax = 100;
    color = #3b82f6;
    thickness = 3;
    grid = true;
    gridStep = 10;
};

new UI {
    type = slider;
    label = "k (наклон)";
    variable = k;
    min = -5;
    max = 5;
    default = 1;
};

new UI {
    type = slider;
    label = "b (сдвиг)";
    variable = b;
    min = -8;
    max = 8;
    default = 0;
};

show axes = false;
show grid = false;
]
