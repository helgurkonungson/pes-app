---
id: cb-data-es
version: 1
title: Datos y hojas de cálculo: lo básico
description: Cómo se estructuran los datos en tablas, cómo mantenerlos limpios, calcular con fórmulas, buscar valores, resumir y mostrarlos con honestidad en gráficos. Sirve para Excel, Google Sheets y programas similares.
goal: Trabajar con hojas de cálculo con soltura y sacar conclusiones de los datos
language: Spanish
minutes: 7
hue: 174
---

# data-01 | Cómo se organizan los datos | Qué son los datos en tabla
## Filas y columnas
La mayoría de los datos de trabajo están en **tablas**. En una tabla bien organizada:
- cada **fila** es un registro (una venta, un cliente, un día);
- cada **columna** es un atributo de ese registro (fecha, importe, ciudad);
- la primera fila contiene los **encabezados** de las columnas.

Este formato se llama «datos ordenados» (tidy data). Las fórmulas, los filtros, las tablas dinámicas y cualquier herramienta de análisis trabajan con él.

## Tipos de datos
Cada columna tiene un tipo:
- **números**: se puede calcular con ellos (suma, recuento);
- **texto**: nombres, etiquetas, categorías;
- **fechas y horas**: dentro del programa también son números, así que se pueden restar y agrupar;
- **valores lógicos**: VERDADERO/FALSO.

Un error frecuente es un número guardado como texto (por ejemplo, «1.200 €»). El programa no puede sumarlo. Pon las unidades en el encabezado: «Importe, €».

!key Una fila es un registro, una columna es un atributo y la primera fila son los encabezados.
!key Una tabla ordenada funciona con fórmulas, filtros y tablas dinámicas.
!key Tipos principales: números, texto, fechas y valores lógicos.
!key No mezcles números y texto en una celda: las unidades, en el encabezado.

?q:e En una tabla ordenada, ¿qué representa una fila?
- Un atributo, como «ciudad»
+ Un registro, como una venta
- El título de la tabla
- El total de todos los datos
= Las filas son registros y las columnas, atributos.

?q:m ¿Por qué es mala idea escribir «1.200 €» en una celda?
- Es demasiado largo
+ El programa lo trata como texto y no puede sumarlo con otros importes
- Los euros no se pueden guardar en hojas de cálculo
- La celda se pondrá roja
= Pon las unidades en el encabezado: «Importe, €».

?q:m ¿Qué tipo de datos tiene la columna «Fecha del pedido»?
- Texto
- Lógico
- Solo un número sin significado
+ Fecha: dentro del programa es un número, así que las fechas se pueden restar y agrupar
= Las fechas se guardan como números, lo que permite calcular plazos.

?q:h Una tabla tiene las columnas «Enero», «Febrero», «Marzo» y los comerciales en las filas. ¿Por qué es poco práctica para analizar?
+ Un mismo atributo (el mes) está repartido en varias columnas; para analizar es mejor tener las columnas «Comercial», «Mes», «Importe»
- No lo es, es el formato ideal
- Los meses no se pueden escribir con mayúscula
- Hay muy pocas filas
= En los datos ordenados cada atributo es una columna.

?r:m ¿Qué debe haber en la primera fila de una tabla?
+ Los encabezados de las columnas
- Los totales
- Una fila vacía
- El nombre de la empresa
= Las fórmulas, los filtros y las tablas dinámicas necesitan encabezados.

?r:e ¿Qué es una columna en una tabla ordenada?
- Un registro
+ Un atributo de los registros
- Un conjunto aleatorio de valores
- Un espacio para comentarios
= Por ejemplo, «Ciudad» o «Importe».

!open Toma una tabla de tu trabajo o tu vida (un presupuesto, ventas, una lista de tareas). Describe sus filas, columnas y tipos de datos, y qué se podría mejorar.
!rubric Se describen las filas y columnas
!rubric Se nombran los tipos de datos
!rubric Se propone una mejora
!model Mi tabla de gastos: cada fila es una compra y las columnas son fecha (fecha), categoría (texto), importe (número) y tarjeta o efectivo (texto). Mejora: ahora los importes están escritos como «35€»; quitaré el «€» y pondré las unidades en el encabezado «Importe, €» para poder sumarlos.

# data-02 | Cómo se organizan los datos | Datos limpios
## El desorden típico
Analizar datos sucios lleva a conclusiones equivocadas. Los problemas más frecuentes:
- **duplicados**: el mismo registro dos veces;
- **espacios de más** y grafías distintas: «Sevilla», «sevilla», «Sevilla »;
- **formatos de fecha distintos**: 03/04/2025 y 2025-04-03 en la misma columna;
- **celdas combinadas**: estropean la ordenación y los filtros;
- **valores vacíos** y comodines como «—», «n/d» o 0 en lugar de «sin datos»;
- **varias tablas en una misma hoja** y totales en mitad de los datos.

## Cómo limpiar
- Elimina duplicados con el comando integrado (Datos → Quitar duplicados).
- La función **ESPACIOS** (TRIM) elimina los espacios sobrantes; **MAYUSC/MINUSC/NOMPROPIO** (UPPER/LOWER/PROPER) igualan las mayúsculas.
- Usa **listas desplegables** (validación de datos) para las categorías y así no aparecerán grafías nuevas.
- Un valor vacío y un cero no son lo mismo: 0 significa «cero» y una celda vacía, «desconocido».
- Guarda los datos originales aparte y limpia una copia.

!key Datos sucios: duplicados, espacios, formatos mezclados, celdas combinadas.
!key El cero y el valor vacío significan cosas distintas.
!key Las listas desplegables evitan categorías incoherentes.
!key Conserva los datos originales y limpia una copia.

?q:e ¿Qué estropea con más frecuencia la ordenación y los filtros?
- Los encabezados de las columnas
+ Las celdas combinadas
- Los valores numéricos
- Las fechas en un único formato
= Las celdas combinadas rompen la cuadrícula de filas y columnas.

?q:m La columna «Ciudad» contiene «Bilbao», «bilbao» y «Bilbao ». ¿Qué pasa al contar por ciudades?
- Todo se cuenta correctamente
+ El programa puede contarlas como ciudades distintas
- La tabla borra las filas sobrantes
- Aparece un error de fórmula
= Hay que igualar las mayúsculas y quitar los espacios.

?q:m ¿En qué se diferencia una celda vacía de un cero en la columna «Ingresos»?
+ El cero significa que no hubo ingresos; la celda vacía, que faltan datos
- No hay diferencia
- Una celda vacía siempre significa cero
- El cero significa un error
= Sustituir valores vacíos por ceros distorsiona las medias y los totales.

?q:h Antes de analizar las ventas encuentras pedidos duplicados. ¿Qué es lo correcto?
- Borrar los duplicados directamente en el archivo original sin guardar una copia
+ Conservar el original, buscar y quitar los duplicados en una copia y comprobar cuántas filas se eliminaron
- Dejar los duplicados, apenas influyen
- Borrar todas las filas con importes repetidos
= El original es tu red de seguridad; un mismo importe no implica un duplicado.

?r:m ¿Qué hace la función ESPACIOS (TRIM)?
- Elimina filas vacías
+ Elimina los espacios sobrantes del texto
- Convierte texto en números
- Elimina duplicados
= Ayuda a que los valores estén escritos igual.

?r:e ¿Cómo evitas que una categoría se escriba de formas distintas?
+ Con una lista desplegable
- Escribiendo en mayúsculas
- Combinando celdas
- Borrando la columna
= La lista limita lo que se puede introducir.

!open Describe tres problemas de datos que hayas encontrado (o podrías encontrar) en hojas de cálculo del trabajo y cómo los resolverías.
!rubric Tres problemas concretos
!rubric Una solución para cada uno
!rubric Se menciona trabajar con una copia o comprobar el resultado
!model 1) Fechas en formatos distintos: las pasaré a un único formato de fecha y comprobaré que se ordenan por tiempo. 2) Nombres de productos con espacios de más: aplicaré ESPACIOS. 3) Pedidos duplicados tras una exportación: los quitaré con «Quitar duplicados» en una copia y compararé el número de filas antes y después.

# data-03 | Fórmulas | Fórmulas y referencias
## Cómo funciona una fórmula
Una fórmula empieza por el signo **=**. Por ejemplo, `=B2*C2` multiplica los valores de las celdas B2 y C2. Si cambian los números de origen, el resultado se recalcula solo: esa es la fuerza de las hojas de cálculo.

Funciones básicas (en Excel en español; en inglés, entre paréntesis):
- **SUMA** (SUM): total, `=SUMA(D2:D100)`;
- **PROMEDIO** (AVERAGE): media;
- **CONTAR** (COUNT): cuántas celdas tienen números; **CONTARA** (COUNTA): cuántas no están vacías;
- **MIN / MAX**.

Con la configuración regional española, los argumentos se separan con punto y coma: `=SI(A2>0;1;0)`.

## Referencias relativas y absolutas
Cuando copias una fórmula hacia abajo, las referencias **se desplazan**: `=B2*C2` en la fila siguiente pasa a ser `=B3*C3`. Son referencias **relativas**.

Si una referencia debe quedarse fija (por ejemplo, un tipo de cambio en la celda F1), se bloquea con signos de dólar: `=B2*$F$1`. Es una referencia **absoluta**. En Excel, la tecla F4 cambia el tipo de referencia.

!key Una fórmula empieza por «=» y se recalcula cuando cambian los datos.
!key SUMA, PROMEDIO, CONTAR, MIN y MAX son las funciones básicas.
!key Las referencias relativas se desplazan al copiar una fórmula.
!key $F$1 es una referencia absoluta: no se desplaza.

?q:e ¿Con qué carácter empieza una fórmula?
- Con #
+ Con =
- Con $
- Con *
= El signo igual indica al programa que viene una fórmula.

?q:m La fórmula =B2*C2 se copia una fila más abajo. ¿Qué se obtiene?
- =B2*C2
+ =B3*C3
- =C2*D2
- Un error
= Las referencias relativas se mueven con la fórmula.

?q:m El tipo de cambio del dólar está en la celda F1. ¿Qué fórmula para convertir el importe de B2 se copia bien hacia abajo?
- =B2*F1
+ =B2*$F$1
- =$B$2*F1
- =B2+F1
= La referencia al tipo de cambio debe bloquearse con signos de dólar.

?q:h ¿En qué se diferencian CONTAR (COUNT) y CONTARA (COUNTA)?
+ CONTAR cuenta las celdas con números; CONTARA, todas las celdas no vacías
- Son iguales
- CONTARA cuenta solo las celdas vacías
- CONTAR suma los valores
= Si el rango contiene texto, los resultados son distintos.

?r:m ¿Qué significan los signos de dólar en $F$1?
- Que la celda contiene dinero
+ Que la referencia es absoluta y no se desplaza al copiar
- Que la celda está protegida con contraseña
- Que la fórmula contiene un error
= El dólar bloquea la columna y la fila.

?r:e ¿Qué función calcula la media?
- SUMA (SUM)
+ PROMEDIO (AVERAGE)
- CONTAR (COUNT)
- MAX
= PROMEDIO divide la suma entre la cantidad de números.

!open Tienes las columnas «Precio» (B) y «Cantidad» (C) y un porcentaje de descuento en la celda F1. Escribe una fórmula para el total con descuento en la fila 2 que se pueda copiar hacia abajo y explica qué referencias usas.
!rubric La fórmula es correcta
!rubric El descuento está bloqueado con una referencia absoluta
!rubric Se explica por qué B2 y C2 son relativas
!model =B2*C2*(1-$F$1). B2 y C2 son relativas: al copiar hacia abajo pasan a B3, C3 y así en cada fila. El descuento es el mismo para todos, así que $F$1 está bloqueada y no se desplaza.

# data-04 | Fórmulas | Condiciones: SI y contar por condición
## La función SI
**SI** (IF) elige un resultado según una condición: `=SI(condición; valor_si_verdadero; valor_si_falso)`.

Ejemplo: `=SI(D2>=100000;"Grande";"Normal")` marca como grandes los pedidos de 100 000 o más.

Las condiciones se construyen con comparaciones: `>`, `<`, `>=`, `<=`, `=`, `<>` (distinto de). Varias condiciones se combinan con **Y** (AND) y **O** (OR): `=SI(Y(D2>0;E2="Madrid");1;0)`.

## Contar y sumar por condición
- **CONTAR.SI** (COUNTIF): cuántas celdas cumplen una condición, `=CONTAR.SI(E2:E100;"Madrid")`.
- **SUMAR.SI** (SUMIF): suma con condición, `=SUMAR.SI(E2:E100;"Madrid";D2:D100)`, los ingresos solo de Madrid.
- Para varias condiciones existen **CONTAR.SI.CONJUNTO** y **SUMAR.SI.CONJUNTO** (COUNTIFS, SUMIFS).

Las cadenas largas de SI anidados son difíciles de leer. Si hay muchas opciones, es mejor crear una tabla de referencia aparte y buscar en ella: eso es la siguiente lección.

!key SI(condición; si_verdadero; si_falso) elige un resultado según una condición.
!key Y / O combinan varias condiciones.
!key CONTAR.SI y SUMAR.SI cuentan y suman por condición.
!key Muchos SI anidados son señal de que necesitas una tabla de referencia.

?q:e ¿Qué devuelve =SI(5>3;"sí";"no")?
+ «sí»
- «no»
- 5
- Un error
= La condición 5>3 es verdadera, así que devuelve el segundo argumento.

?q:m ¿Qué fórmula cuenta los pedidos de Bilbao en el rango E2:E100?
- =SUMA(E2:E100;"Bilbao")
+ =CONTAR.SI(E2:E100;"Bilbao")
- =SI(E2:E100="Bilbao")
- =PROMEDIO(E2:E100)
= CONTAR.SI cuenta las celdas que cumplen la condición.

?q:m ¿Cómo se escribe «distinto de» en una fórmula?
- !=
- ><
+ <>
- =/
= En las hojas de cálculo «distinto de» se escribe <>.

?q:h Necesitas los ingresos de Madrid solo de marzo; la ciudad está en E, el mes en F y los ingresos en D. ¿Qué función encaja mejor?
- SUMAR.SI con una condición
- SI sin suma
+ SUMAR.SI.CONJUNTO (SUMIFS) con dos condiciones
- CONTAR.SI
= SUMAR.SI.CONJUNTO suma con varias condiciones a la vez.

?r:m ¿Qué hace SUMAR.SI (SUMIF)?
- Cuenta celdas
+ Suma los valores que cumplen una condición
- Encuentra el máximo
- Borra filas según una condición
= Por ejemplo, los ingresos de una sola ciudad.

?r:e ¿Cómo combinas dos condiciones que deben cumplirse a la vez?
+ Con la función Y (AND)
- Con la función O (OR)
- Con un signo de dólar
- Con la función SUMA
= Y devuelve VERDADERO solo si se cumplen todas las condiciones.

!open Piensa en una tarea de tu trabajo o tu día a día en la que te sirva SI o SUMAR.SI y escribe la fórmula.
!rubric Se describe la tarea
!rubric La fórmula es verosímil
!rubric Se explica qué devuelve
!model En mi tabla de gastos la categoría está en B y el importe en C. Para saber cuánto gasté en comida escribo =SUMAR.SI(B2:B200;"Comida";C2:C200). La fórmula suma los importes solo de las filas cuya categoría es «Comida».

# data-05 | Fórmulas | Buscar valores: BUSCARV y BUSCARX
## Para qué buscar
A menudo los datos están en tablas distintas: una con los pedidos y el código de producto, otra con la lista de precios. Las funciones de búsqueda traen el valor correcto a partir de una clave.

## BUSCARV y BUSCARX
**BUSCARV** (VLOOKUP) busca un valor en la primera columna de un rango y devuelve el valor de una columna indicada de la misma fila:
`=BUSCARV(A2;Precios!A:C;3;FALSO)`

El último argumento **FALSO** significa coincidencia exacta: casi siempre es el que necesitas. Sin él, BUSCARV puede devolver el valor «más cercano» y equivocarse sin avisar.

Limitaciones de BUSCARV: solo busca en la primera columna y solo hacia la derecha, y el número de columna se rompe si insertas una columna nueva.

**BUSCARX** (XLOOKUP), en las versiones recientes de Excel y en Google Sheets, es más cómodo: `=BUSCARX(A2;Precios!A:A;Precios!C:C)`. Indicas por separado dónde buscar y qué devolver, y por defecto busca coincidencias exactas. La alternativa clásica es la pareja **INDICE + COINCIDIR** (INDEX + MATCH).

## La clave debe ser única
Si el mismo código aparece dos veces en la tabla de referencia, la función devuelve la primera coincidencia y no notarás el error. Comprueba que las claves sean únicas.

!key Las funciones de búsqueda traen valores de otra tabla a partir de una clave.
!key En BUSCARV, usa FALSO (coincidencia exacta).
!key BUSCARX es más cómodo: «dónde buscar» y «qué devolver» van por separado.
!key La clave de la tabla de referencia debe ser única.

?q:e ¿Para qué sirve BUSCARV (VLOOKUP)?
- Para sumar una columna
+ Para encontrar un valor a partir de una clave en otra tabla
- Para crear un gráfico
- Para quitar duplicados
= BUSCARV trae datos de una tabla de referencia.

?q:m ¿Qué significa FALSO como último argumento de BUSCARV?
- Que la fórmula está desactivada
+ Que se exige una coincidencia exacta de la clave
- Que el resultado será texto
- Que la búsqueda va de abajo arriba
= Sin coincidencia exacta, BUSCARV puede devolver un valor equivocado.

?q:m ¿Por qué BUSCARX es más cómodo que BUSCARV?
+ Indicas por separado dónde buscar y qué devolver, y puede buscar hacia la izquierda
- Solo funciona con texto
- Se escribe más rápido
- No necesita clave
= No hace falta el número de columna, así que insertar columnas no rompe nada.

?q:h BUSCARV devuelve precios, pero algunos son incorrectos. En la tabla de referencia algunos códigos tienen dos filas con precios distintos. ¿Qué ocurre?
- La función elige el precio medio
+ La función toma la primera coincidencia que encuentra, por eso la clave debe ser única
- La función devuelve un error para esos códigos
- La función toma la última coincidencia
= Las claves no únicas provocan errores silenciosos.

?r:m ¿Qué pareja de funciones es la alternativa clásica a BUSCARV?
- SUMA + CONTAR
+ INDICE + COINCIDIR (INDEX + MATCH)
- SI + Y
- MIN + MAX
= COINCIDIR encuentra la fila e INDICE devuelve el valor.

?r:e ¿Cómo debe ser la clave de una tabla de referencia?
+ Única
- Larga
- Siempre un número
- Escrita en mayúsculas
= Si no, la búsqueda devuelve la primera de varias coincidencias.

!open Tienes una tabla de pedidos con el código de cada empleado y una tabla aparte «código — nombre — departamento». Describe cómo añadirías el departamento a los pedidos y qué comprobarías.
!rubric Se nombra una función de búsqueda
!rubric Se indica la coincidencia exacta
!rubric Se menciona comprobar la unicidad de la clave o los errores
!model En la tabla de pedidos añadiré una columna «Departamento» con =BUSCARX(B2;Empleados!A:A;Empleados!C:C), donde B es el código del empleado. Antes comprobaré que los códigos de la tabla de referencia no se repiten y, después, buscaré los errores #N/A: son códigos que faltan en la tabla de referencia.

# data-06 | Análisis | Ordenar, filtrar y tablas dinámicas
## Ordenar y filtrar
**Ordenar** coloca las filas en orden: por ingresos de mayor a menor, por fecha. Selecciona toda la tabla; si no, puedes ordenar una sola columna y mezclar los datos entre filas.

Un **filtro** oculta temporalmente las filas que no cumplen una condición; por ejemplo, muestra solo una región. Los datos no se borran.

## Tablas dinámicas
Una **tabla dinámica** (pivot table) convierte miles de filas en un informe breve en un minuto. Arrastras campos a cuatro áreas:
- **Filas**: por qué agrupar (por ejemplo, comercial);
- **Columnas**: una segunda dimensión (por ejemplo, mes);
- **Valores**: qué calcular: suma, recuento, promedio;
- **Filtros**: para acotar el informe (por ejemplo, solo 2025).

Una tabla dinámica solo funciona con datos ordenados: encabezados en la primera fila, sin celdas combinadas ni filas vacías en medio. Cuando cambian los datos de origen, hay que **actualizarla**.

!key Ordena la tabla entera, no una sola columna.
!key Un filtro oculta filas pero no las borra.
!key Una tabla dinámica tiene filas, columnas, valores y filtros.
!key Cuando cambian los datos de origen, actualiza la tabla dinámica.

?q:e ¿Qué hace un filtro?
- Borra para siempre las filas sobrantes
+ Oculta temporalmente las filas que no cumplen una condición
- Ordena alfabéticamente
- Combina celdas
= Las filas ocultas siguen en la tabla.

?q:m ¿Por qué es peligroso ordenar una sola columna seleccionada?
+ Sus valores se desordenan respecto a las demás columnas y los registros «se rompen»
- La ordenación no funcionará
- La tabla se hará más pequeña
- Solo es peligroso con fechas
= Una fila debe seguir siendo un registro completo.

?q:m Quieres ver los ingresos por comercial y por mes. ¿Qué va en «Valores» de la tabla dinámica?
- El comercial
- El mes
+ La suma de los ingresos
- La región
= Los valores son lo que se calcula.

?q:h Has añadido ventas nuevas a la tabla de origen, pero la tabla dinámica muestra los totales antiguos. ¿Qué pasa?
- Las tablas dinámicas no admiten datos nuevos
+ Hay que actualizar la tabla dinámica y su rango debe incluir las filas nuevas
- Hay que borrar la tabla dinámica y hacer el informe a mano
- Las ventas nuevas se introdujeron mal
= Una tabla dinámica no se recalcula sola como las fórmulas.

?r:m ¿Cuáles son las cuatro áreas de una tabla dinámica?
+ Filas, columnas, valores y filtros
- Título, texto, pie y total
- Celdas, hojas, libros y archivos
- Suma, promedio, mínimo y máximo
= En ellas se colocan los campos.

?r:e ¿Qué tipo de datos necesita una tabla dinámica?
- Cualquiera, incluso con celdas combinadas
+ Ordenados: encabezados en la primera fila y sin celdas combinadas
- Solo texto
- Una sola columna
= Los datos ordenados son la base de cualquier análisis.

!open Describe un informe que podrías crear con una tabla dinámica a partir de tus datos: qué va en filas, columnas, valores y filtro, y a qué pregunta responde.
!rubric Se indican todas las áreas
!rubric Se nombra la pregunta que responde el informe
!rubric Los datos son realistas
!model Los datos son mis gastos del año. Filas: categoría; columnas: mes; valores: suma del gasto; filtro: solo tarjeta. El informe responde a en qué meses y en qué categorías gasto más.

# data-07 | Análisis | Media, mediana y porcentajes
## Media y mediana
La **media** es la suma dividida entre la cantidad. La **mediana** es el valor central cuando todo está ordenado. Si los datos tienen **valores atípicos** (muy grandes o muy pequeños), la media se desplaza mucho, pero la mediana no.

Ejemplo: cinco empleados ganan 50, 55, 60, 65 y 500 mil. La media es de 146 mil, aunque cuatro de ellos ganan 65 o menos. La mediana es de 60 mil y describe mejor al empleado típico. En la hoja de cálculo: **MEDIANA** (MEDIAN).

## Porcentajes y puntos porcentuales
- Pasar de 200 a 250 es un crecimiento del **25 %**: (250 − 200) / 200.
- Si la conversión pasa del 2 % al 3 %, sube **1 punto porcentual**, pero un **50 %** en términos relativos. Confundirlos es un error frecuente en los informes.
- Un porcentaje sobre una base pequeña engaña: «crecimiento del 100 %» puede significar 2 pedidos en lugar de uno.

!key La mediana resiste mejor que la media los valores atípicos.
!key Variación porcentual = (nuevo − anterior) / anterior.
!key Los puntos porcentuales son diferencias entre porcentajes; no los confundas con porcentajes.
!key Mira la base: un porcentaje grande sobre un número pequeño dice poco.

?q:e ¿Qué es la mediana?
- La suma de todos los valores
+ El valor central de una serie ordenada
- El valor más frecuente
- La diferencia entre el máximo y el mínimo
= La mitad de los valores está por debajo de la mediana y la otra mitad, por encima.

?q:m Salarios: 40, 45, 50, 55 y 400 mil. ¿Qué medida describe mejor un salario típico?
- La media: 118 mil
+ La mediana: 50 mil
- El máximo: 400 mil
- La suma: 590 mil
= El valor atípico de 400 mil tira mucho de la media hacia arriba.

?q:m Los ingresos pasaron de 160 a 200 mil. ¿En qué porcentaje crecieron?
- Un 20 %
+ Un 25 %
- Un 40 %
- Un 80 %
= (200 − 160) / 160 = 0,25.

?q:h La tasa de devoluciones bajó del 8 % al 6 %. ¿Cómo se describe correctamente el cambio?
- Un 2 % en términos relativos
+ 2 puntos porcentuales, o un 25 % respecto al nivel anterior
- Un 6 %
- 33 puntos porcentuales
= 8 − 6 = 2 p. p.; 2 / 8 = 25 %.

?r:m ¿Por qué la media puede engañar?
+ Los valores atípicos la desplazan mucho
- Siempre es menor que la mediana
- No se puede calcular en una hoja de cálculo
- Solo sirve para fechas
= En esos casos, mira la mediana.

?r:e ¿Cómo se calcula una variación porcentual?
- Nuevo menos anterior
+ (Nuevo − anterior) / anterior
- Nuevo / 100
- Anterior / nuevo
= Se divide el cambio entre el valor de partida.

!open Busca en las noticias o en un informe de trabajo una frase con porcentajes y compruébala: ¿se usan bien los porcentajes y los puntos porcentuales? ¿La base es demasiado pequeña?
!rubric Se cita una frase o un ejemplo
!rubric Se comprueban los porcentajes o los p. p.
!rubric Se valora la base
!model Un informe dice «la cuota de ventas online creció un 5 %»: era del 20 % y ahora es del 25 %. Lo correcto es 5 puntos porcentuales, o un 25 % respecto a la cuota anterior. La base es adecuada, miles de pedidos al mes, así que el cambio es relevante.

# data-08 | Análisis | Gráficos que no mienten
## Elegir el gráfico
- **Líneas**: cambios en el tiempo, como los ingresos por mes.
- **Barras o columnas**: comparar categorías, como las ventas por región. Las etiquetas largas caben mejor en barras horizontales.
- **Gráfico circular**: partes de un todo, y solo si hay pocas partes (hasta 4–5). Los ángulos se comparan mal, así que a menudo es mejor usar barras.
- **Dispersión**: la relación entre dos medidas numéricas, como el precio y el número de ventas.

## Honestidad
- Las barras deben empezar **en cero**: un eje recortado convierte un crecimiento del 3 % en un «despegue».
- No compares periodos de distinta duración sin advertirlo.
- Rotula los ejes y las unidades, e indica la fuente y el periodo.
- Un gráfico, un mensaje. Destaca lo principal con color y pon el resto en gris.

## Resumen del curso
Tabla ordenada → datos limpios → fórmulas y búsquedas → tabla dinámica → porcentajes correctos → un gráfico honesto. Ese es el ciclo básico del trabajo con datos en cualquier profesión.

!key Líneas para el tiempo, barras para comparar, circular para partes de pocas piezas.
!key Las barras empiezan en cero; si no, el gráfico exagera la diferencia.
!key Rotula ejes, unidades, fuente y periodo.
!key Un gráfico, un mensaje, con lo principal en color.

?q:e ¿Qué gráfico muestra mejor los ingresos por mes a lo largo de un año?
- Un gráfico circular
+ Un gráfico de líneas
- Una tabla con un solo número
- Un gráfico de dispersión sin etiquetas
= Una línea muestra bien los cambios en el tiempo.

?q:m ¿Cuándo es adecuado un gráfico circular?
- Para comparar 15 regiones
+ Para partes de un todo cuando hay pocas partes
- Para la evolución diaria
- Para la relación entre dos medidas
= Muchos sectores son difíciles de comparar.

?q:m ¿Qué peligro tiene un gráfico de barras cuyo eje no empieza en cero?
+ Una diferencia pequeña parece enorme
- El gráfico se vuelve demasiado ancho
- Desaparecen las etiquetas
- Ninguno, es lo habitual
= La altura de una barra debe ser proporcional a su valor.

?q:h Quieres comprobar si un producto se vende peor cuanto más caro es. ¿Qué gráfico eliges?
- Un circular con las proporciones de precios
+ Un gráfico de dispersión de precio frente a número de ventas
- Un gráfico de líneas solo con el precio
- Barras con los nombres de los productos por orden alfabético
= La dispersión muestra la relación entre dos medidas numéricas.

?r:m ¿Qué hay que rotular siempre en un gráfico?
+ Los ejes, las unidades, la fuente y el periodo
- Solo el título
- Nada, se entiende solo
- Solo el color de fondo
= Sin esto, un gráfico se malinterpreta con facilidad.

?r:e ¿Qué regla ayuda a que un gráfico sea claro?
- Usar todos los colores posibles
+ Un gráfico, un mensaje
- Añadir siempre un efecto 3D
- Poner todas las etiquetas en letra pequeña
= Destaca lo principal y atenúa el resto.

!open Describe un gráfico que harías para tu responsable con tus datos: qué tipo, qué va en los ejes, qué destacarías y qué único mensaje debe transmitir.
!rubric El tipo de gráfico encaja con la tarea
!rubric Se describen los ejes y lo destacado
!rubric Se formula un único mensaje
!model Mostraré un gráfico de líneas con los ingresos mensuales del año: los meses en el eje horizontal y los ingresos en miles de euros, desde cero, en el vertical. La línea de este año en color y la del año pasado en gris. El mensaje: desde que lanzamos el reparto a domicilio en mayo, los ingresos están siempre por encima del año pasado.
