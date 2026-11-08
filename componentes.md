Circuito digital para hacer un ascensor de 4 pisos que funciona de tal manera que hay 3 instancias: piso actual, piso de llamada y piso de destino y tiene que ir en primer lugar el piso actual al piso de llamada, para luego desde ahí ir al piso de destino.

Cómo funciona en componentes electrónicos:
Los pisos en cuanto a bits, considerando que sólo habrá 2 bits para registrar son:
00 -> 1
01 -> 2
10 -> 3
11 -> 4

Flip Flops D (74LS74): Son 6 flip flops D, 2 se usan para los dos bits del piso actual, 2 para los dos bits del piso de llamada y 2 para los dos bits del piso de destino.
Llegada de los dos bits del piso de llamada: Los 2 bits del piso de llamada se eligen a través de pushbuttons, de los cuales habrá 4 que representarán a los 4 pisos, seguidos de las 2 ecuaciones: 2 OR 4, 3 OR 4 (referenciando a los botones que representan los pisos); y esas dos salidas, siendo 2 OR 4 el Q0 y 3 OR 4 el Q1, se van para los respectivos 2 flip flops.
Llegada de los dos bits del piso de destino: Se eligen igual a los dos bits del piso de llamada, se eligen también a través de pushbuttons y también están las dos ecuaciones 2 OR 4, 3 OR 4, y eso va para los 2 flip flops D de la misma forma, como Q0 y Q1 respectivamente.
Decodoficadores BCD de 7 segmentos (74LS48): Habrá 2 decodificadores, uno que sea para el piso de llamada y otro para el piso de destino; para lo cual saldrán unas ecuaciones que transformen los 2 bits que hay para cada piso a 4 bits de acuerdo al número de piso.

A (S0) - > Q0'
B (S1) - > Q1 XOR Q0
C (S2) - > Q1 and Q0
D (S3) - > 0

Y esas cuatro salidas irían a al decodificador respectivo de cada uno, de tal forma que también estuviera conectado con un display, por lo que habrían 2 displays, uno para el piso de llamada y otro para el piso de destino.

En cuanto a cómo se muestra el piso actual, sería a través de 4 Luces LEDS, las cuales representaran los 4 pisos respectivamente, a través de las siguientes ecuaciones:
Piso 1 - > Q1' and Q0'
Piso 2 - > Q1' and Q0
Piso 3 - > Q1 and Q0'
Piso 4 - > Q1 and Q0

Adicionalmente, habría dos comparadores 74LS85, que se encargarían de comparar el primero el valor del piso actual con el del piso de llamada, y el segundo, el del posterior piso actual con el piso de destino; estos a su vez, tendrían que encender LEDS de acuerdo a el movimiento del piso actual; habría 3 LEDS:
-LED Subida: Se enciende si el piso actual está yendo hacia arriba.
-LED Bajada: Se enciende si el piso actual está yendo hacia abajo.
-LED Parar: Se enciende si el piso actual está detenido.

Ahora, habría una placa Arduino que regularía las siguientes funcionalidades:
-Valores de bits del piso actual: Sería inicialmente 1, mientras que, a través del comparador, iría aumentando o disminuyendo gradualmente hacia el piso en que debe dirigirse, esto funcionaría junto con un servo motor SG90 el cual serviría de tal forma que su rotación sirivera para indicar el piso, sería como:
Piso 1 - > -90°
Piso 2 - > -30°
Piso 3 - > 30°
Piso 4 - > 90°

Y el Arduino se comunicaría con él para indicarle la rotación al motor y a su vez recibir el ángulo para las nuevas entradas a los 2 flip flops D respectivos al piso actual. 

-Comunicación con el comparador: El comparador le dice al Arduino si el piso actual es mayor al otro piso(ya sea de llamada o de destino)
-CLKs de los flip flops: El Arduino regularía también los relojes de los flip flops, de los 6, de tal forma que lo haría a conveniencia de cómo deben ser los movimientos.

-Regulación de movimiento: No puede ocurrir que se elijan de forma simultánea un piso de destino y un piso de llamada, si o si debe ser primero el de llamada y luego el piso de destino; el Arduino también debe regular que eso ocurra de tal manera. 


Innovación:
Adicionalmente, se quería añadir una funcionalidad que fuera una suerte de ascensor para ciegos; aquí, se haría uso de un Raspberry Pi * 8GB, una ESP32 Cam USB, un parlante amplificado, y el uso de dos mutliplexores, que sería 74LS153.

Lo que se quiere hacer es lo siguiente: 
-Arduino: El Arduino seguiría teniendo las mismas funcionalidades de antes, pero adicionalmente se le tendría que añadir que pueda generar nuevas entradas también a los Flip Flops D que almacenan las entradas de piso de llamada y de destino
-Multiplexor: Este tendría el rol de regular si se entra al modo para ciegos o el modo normal; por ello, se usaría los Multiplexores para elegir si las entradas del piso de llamada y de destino (uno por cada multiplexor) son a partir de el Arduino o a partir de los botones que ya se encontraban antes; el selector también sería regulado por el Arduino.
-Raspberry: El Raspberry es el que tendría toda la programación en Python de el procesamiento de imágenes, la idea sería que ocurriera lo siguiente. El piso por defecto debería ser el piso 1, y a partir de ahí, deberían haber 3 gestos, dedo hacia arriba para indicar que debe ir hacia arriba, dedo hacia abajo para ir hacia abajo y "stop" indicando que ese es el piso elegido; por cada modificación de piso se debe reproducir un sonido; o sea, al inicio, debería decir "piso 1", si sube, "piso 2" y así, y cuando haga stop que diga: "Piso 2 seleccionado, desea confirmar?" y que el stop sea como una confirmación, y luego que diga algo como "subiendo" o "bajando" según la dirección y que al llegar al destino diga: "Piso 2 alcanzado" y cosas así. Se supone que los audios estarían guardados dentro de la Raspberry.
-ESP32 Cam USB: La cámara sería la que captaría las imágenes de los gestos, estaría directamente conectada con la Raspberry, la cual le daría las imágenes y luego la Raspberry las procesaría.
-Parlante amplificado: Este estaría conectado con el Raspberry, y simplemente reproduciría los sonidos que el Raspberry tiene de acuerdo al momento en el que se encuentra.