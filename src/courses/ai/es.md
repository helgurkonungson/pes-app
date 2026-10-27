---
id: cb-ai-es
version: 1
title: Alfabetización en IA
description: Cómo funcionan los chatbots como ChatGPT, Claude o Gemini, cuándo puedes fiarte de ellos, cómo escribir instrucciones y cómo no perjudicarte a ti ni a otros. Ocho lecciones cortas sin jerga técnica.
goal: Usar la IA con confianza y seguridad en los estudios y el trabajo
language: Spanish
minutes: 7
hue: 265
---

# ai-01 | Cómo funciona la IA | Qué es un modelo de lenguaje
## Un predictor de la siguiente palabra
Los chatbots como ChatGPT, Claude o Gemini funcionan con **grandes modelos de lenguaje**. Un modelo así se ha entrenado con una enorme cantidad de texto y hace una cosa muy bien: a partir del comienzo de un texto, predice qué es más probable que venga después. Cuando te responde, construye la respuesta paso a paso con pequeños fragmentos llamados **tokens** (palabras o partes de palabras).

De este mecanismo tan simple surgen capacidades sorprendentes: resumir, traducir, explicar, programar. Pero recuerda que el modelo no «busca la respuesta en una base de datos»: compone una continuación verosímil.

## Lo que el modelo no sabe
Un modelo tiene una **fecha de corte de conocimiento**: de lo ocurrido después solo sabe lo que encuentre si le das búsqueda en internet. No recuerda tus conversaciones anteriores salvo que el servicio las guarde a propósito. Y no tiene experiencia propia, solo patrones extraídos de textos.

!key Un modelo de lenguaje predice el siguiente fragmento de texto: un token.
!key La respuesta se compone, no se saca de una base de datos.
!key El modelo tiene una fecha de corte; de lo nuevo solo se entera mediante búsqueda.
!key Sus capacidades nacen de patrones en textos, no de experiencia personal.

?q:e ¿Qué hace, en esencia, un gran modelo de lenguaje?
- Busca una respuesta hecha en una base de datos
+ Predice qué fragmento de texto es más probable que venga después
- Copia respuestas de páginas web en tiempo real
- Te pone en contacto con un experto humano
= El modelo construye el texto paso a paso, token a token.

?q:e ¿Qué es un token?
- Una contraseña para entrar en un chatbot
+ Un fragmento de texto —una palabra o parte de ella— con el que trabaja el modelo
- Una unidad de pago en criptomoneda
- Una única respuesta del modelo
= El modelo lee y escribe el texto en tokens.

?q:m ¿Por qué un modelo puede no saber las noticias de ayer?
+ Su conocimiento está limitado por la fecha de corte de sus datos de entrenamiento, salvo que tenga búsqueda en internet
- Oculta las noticias a propósito
- Está prohibido hablar de noticias con una IA
- El modelo se actualiza cada minuto y simplemente no le ha dado tiempo
= Sin búsqueda, el modelo conoce el mundo solo hasta su entrenamiento.

?q:h ¿Qué afirmación sobre un chatbot es más exacta?
- Entiende el mundo como una persona con experiencia
- Siempre cita sus fuentes al pie de la letra
+ Construye una respuesta verosímil a partir de patrones en los textos
- Recuerda todas las conversaciones de todos los usuarios
= Esto explica tanto los puntos fuertes como los errores de los modelos.

?r:m ¿De dónde saca el modelo la respuesta a tu pregunta?
- De respuestas grabadas de antemano
+ La compone prediciendo cómo continúa el texto
- La descarga de Wikipedia
- Se la proporcionan los desarrolladores a mano
= La respuesta se genera, no se recupera.

?r:e ¿Qué limita lo que un modelo sabe sobre hechos recientes?
+ La fecha de corte de conocimiento
- El tamaño de la pantalla
- El idioma de la pregunta
- La hora del día
= Después de esa fecha solo sabe lo que encuentre buscando.

!open Explícale a un amigo en 3–4 frases cómo funciona un chatbot y por qué no hay que creerle a pies juntillas.
!rubric Se menciona la predicción del siguiente texto
!rubric Se explica que la respuesta se compone
!rubric Hay una conclusión sobre verificar
!model Un chatbot es un programa que ha leído muchísimo texto y ha aprendido a adivinar qué palabras deben venir después. Cuando le preguntas algo, no busca la respuesta en una enciclopedia: escribe un texto que suena verosímil. Por eso habla con seguridad incluso cuando se equivoca, y los datos importantes hay que comprobarlos.

# ai-02 | Cómo funciona la IA | Alucinaciones y verificación de datos
## Seguro, pero equivocado
A veces un modelo produce datos que no existen: citas, libros, artículos de leyes, enlaces o cifras inventados. Son las **alucinaciones**. La causa está en su funcionamiento: construye un texto verosímil, y verosímil no siempre es verdadero. Pasa sobre todo con temas poco comunes, números exactos, fechas y referencias a fuentes.

El peligro es que una respuesta equivocada suena igual de segura que una correcta.

## Cómo verificar
- Contrasta los datos importantes con la fuente original: una web oficial, un documento, una obra de referencia.
- Pide al modelo sus fuentes y ábrelas. Un enlace que no existe es una señal de alarma.
- Insiste: «¿cuánta seguridad tienes?», «¿qué argumentos hay en contra?».
- Cuanto más está en juego (salud, dinero, temas legales, tu trabajo), más estricta debe ser la verificación. La decisión final la toma una persona.

!key Una alucinación es información inventada presentada con seguridad.
!key Los errores son más frecuentes en temas raros, números, fechas y enlaces.
!key Contrasta los datos importantes con la fuente original.
!key Cuanto más está en juego, más estricta la verificación; decide una persona.

?q:e ¿Qué es una alucinación de un modelo?
- Un fallo de la pantalla al responder
+ Información inventada presentada con seguridad
- Una respuesta en otro idioma
- Una respuesta demasiado larga
= Por ejemplo, una cita o un enlace que no existen.

?q:m ¿Dónde son más frecuentes las alucinaciones?
- Al traducir frases sencillas
+ En cifras exactas, fechas, citas y referencias a fuentes
- Al responder a un saludo
- Al corregir erratas
= Son detalles que el modelo «rellena» de forma verosímil.

?q:m El modelo cita un enlace a un estudio. ¿Qué es sensato hacer?
- Citarlo en tu informe de inmediato
+ Abrir el enlace y comprobar que el estudio existe y dice exactamente eso
- Preguntar al mismo modelo si es cierto y creer la respuesta
- Borrar el enlace y quedarte con la conclusión
= El enlace hay que comprobarlo en la fuente original.

?q:h Preguntas a una IA la dosis de un medicamento para un familiar. ¿Cómo debes proceder?
- Fiarte de la respuesta si suena segura
- Preguntar a otros dos chatbots y hacer la media
+ Usar la respuesta como pista y comprobarla con un médico, un farmacéutico o el prospecto oficial
- Ignorar el prospecto si la IA dijo otra cosa
= Cuando hay mucho en juego, decide una persona basándose en una fuente fiable.

?r:m ¿Por qué alucinan los modelos?
+ Construyen un texto verosímil, y verosímil no siempre es verdadero
- Se les entrena a propósito para engañar
- Por una conexión a internet lenta
- Porque la pregunta se hizo con educación
= Es consecuencia de la propia forma de funcionar del modelo.

?r:e ¿Qué haces con los datos importantes de una respuesta de IA?
- Memorizarlos
+ Contrastarlos con la fuente original
- Reenviarlos a los amigos
- Nada, la IA no se equivoca
= La fuente original es la principal forma de verificar.

!open Pide a cualquier chatbot un dato poco conocido de tu profesión o tu ciudad. ¿Cómo comprobarás la respuesta? Describe los pasos.
!rubric Se nombran pasos concretos de verificación
!rubric Se menciona la fuente original
!rubric Se reconoce que un tono seguro no es garantía
!model Preguntaré en qué año se fundó el museo de mi ciudad. Después buscaré la web oficial del museo y su ficha en la guía municipal y compararé el año y el nombre del fundador. Si las fuentes no coinciden con el modelo, me fío de las fuentes: un tono seguro no garantiza nada.

# ai-03 | Buenas instrucciones | Cómo escribir una instrucción
## Cuatro elementos
El modelo no lee la mente: la calidad de la respuesta depende mucho de la instrucción (el prompt). Una buena instrucción suele incluir:
1. **Contexto**: quién eres, para qué es, qué se sabe ya.
2. **Tarea**: qué hacer exactamente: explicar, resumir, comparar, idear.
3. **Formato**: una lista, una tabla, un correo, 5 puntos, no más de 100 palabras.
4. **Restricciones y criterios**: tono, público, qué evitar.

## Antes y después
Débil: «Escribe sobre gestión del tiempo».

Mejor: «Dirijo un equipo de 5 diseñadores y no paramos de incumplir plazos. Propón 5 prácticas concretas de planificación semanal, cada una en 2–3 frases, sin consejos genéricos como "sed más organizados"».

Los **ejemplos** también ayudan: muestra un modelo de la respuesta que quieres y el modelo imitará su estilo y estructura.

!key Una buena instrucción: contexto, tarea, formato, restricciones.
!key Cuanto más concreta la tarea, más útil la respuesta.
!key Indica explícitamente el formato y la extensión.
!key Un ejemplo de la respuesta deseada ayuda al modelo a acertar con el estilo.

?q:e ¿Qué instrucción tiene más probabilidades de dar una respuesta útil?
- «Háblame de currículums»
+ «Soy analista junior y me presento a un puesto en un banco. Propón 3 puntos fuertes para la sección "Experiencia", cada uno con un resultado en cifras»
- «Currículum»
- «Ayuda»
= Tiene contexto, tarea y formato.

?q:m ¿Cuál de estos es el elemento «formato»?
- «Soy profesor de matemáticas»
+ «Responde con una tabla de tres columnas»
- «Explica qué son las fracciones»
- «Lo necesito para la clase de mañana»
= El formato es cómo debe ser la respuesta.

?q:m ¿Para qué añadir a la instrucción un ejemplo de la respuesta deseada?
- Para que el modelo lo copie sin cambios
+ Para mostrar el estilo, la estructura y el nivel de detalle que necesitas
- Un ejemplo solo confunde al modelo
- Para que la respuesta sea más corta
= Un ejemplo marca el listón con más precisión que cualquier descripción.

?q:h Has recibido una respuesta sobre marketing demasiado genérica. ¿Qué cambias primero en la instrucción?
- Escribir lo mismo en mayúsculas
+ Añadir contexto: el producto, el público, el presupuesto y lo que ya has probado
- Pedir que responda más rápido
- Cambiar el idioma de la instrucción
= Una respuesta genérica suele venir de una instrucción genérica sin contexto.

?r:m ¿Qué cuatro elementos forman una buena instrucción?
+ Contexto, tarea, formato, restricciones
- Saludo, pregunta, gracias, firma
- Tema, palabras clave, hashtags, emojis
- Longitud, tipo de letra, color, idioma
= Estos elementos hacen útil la respuesta.

?r:e ¿Qué es un prompt?
- La respuesta del modelo
+ La instrucción que le escribes al modelo
- El nombre del modelo
- Un ajuste de pantalla
= Un prompt es tu petición.

!open Reescribe la instrucción débil «Ayúdame con una presentación» como una instrucción fuerte para una tarea real tuya, usando los cuatro elementos.
!rubric Hay contexto
!rubric La tarea es concreta
!rubric Se indican formato y restricciones
!model Soy product manager y el viernes presento los resultados del trimestre a la dirección: los ingresos crecieron un 12 %, pero también aumentó la pérdida de clientes. Haz un guion de 8 diapositivas con un título y 2–3 ideas clave en cada una. Tono profesional y sin jerga; una diapositiva aparte sobre qué hacemos con la pérdida de clientes.

# ai-04 | Buenas instrucciones | Diálogo y mejora
## La primera respuesta es un borrador
Rara vez el mejor resultado sale a la primera. Trata la respuesta como un **borrador** y mejórala conversando: «más corto», «más sencillo, para principiantes», «añade un ejemplo del comercio minorista», «quita el tercer punto».

Técnicas útiles:
- Pide **varias opciones**: «dame 3 titulares distintos» y elige o combina.
- Pide al modelo que **te haga preguntas**: «antes de escribir, pregunta lo que falte».
- Pide **críticas**: «busca los puntos débiles de este plan» o «¿qué objetaría un escéptico?».

## Divide las tareas grandes
Una tarea compleja es mejor hacerla por pasos: primero la estructura, luego cada sección y al final una revisión. Así es más fácil controlar la calidad y corregir el rumbo a tiempo.

Si la conversación se atasca y el modelo repite los mismos errores, a veces es más rápido abrir un chat nuevo con una instrucción mejorada.

!key La primera respuesta es un borrador; mejórala conversando.
!key Pide opciones, preguntas aclaratorias y críticas.
!key Haz las tareas grandes por pasos: estructura → secciones → revisión.
!key Si la conversación se atasca, empieza de nuevo con una instrucción mejor.

?q:e ¿Cómo debes tratar la primera respuesta del modelo?
+ Como un borrador que se puede mejorar
- Como el resultado final
- Como un error si no es perfecta
- Como una respuesta que no se puede cambiar
= Mejorar conversando es parte normal del trabajo.

?q:m ¿Qué petición ayuda a encontrar los puntos débiles de un texto?
- «Mejóralo»
+ «¿Qué le objetaría un escéptico a este plan?»
- «Escribe lo mismo otra vez»
- «Gracias, todo perfecto»
= Pedir críticas saca a la luz los puntos débiles.

?q:m ¿Para qué pedir al modelo que te haga preguntas antes de responder?
- Para ganar tiempo
+ Para que averigüe el contexto que falta y responda con más precisión
- Es una formalidad educada
- Para que la respuesta sea más corta
= El modelo te mostrará qué información le falta.

?q:h Necesitas un informe de 10 páginas. ¿Qué enfoque es más fiable?
- Pedir todo el informe en un solo mensaje y enviarlo enseguida
+ Acordar primero la estructura, luego escribir las secciones una a una y revisarlo al final
- Pedir diez informes distintos y elegir uno al azar
- Escribir una instrucción de una línea
= Trabajar por pasos te da control sobre la calidad.

?r:m ¿Qué haces si el modelo repite el mismo error en una conversación?
- Repetir la misma petición más fuerte
+ Abrir un chat nuevo con una instrucción mejorada
- Borrar la app
- Aceptar el error
= Un contexto nuevo suele resolver el problema.

?r:e ¿Cómo consigues varias ideas entre las que elegir?
+ Pidiendo varias opciones distintas
- Pidiendo una sola opción perfecta
- Haciendo una pregunta sin contexto
- Sin pedir nada
= Las opciones se pueden comparar y combinar.

!open Describe cómo llevarías una conversación con una IA para preparar un correo de disculpa a un cliente por un pedido retrasado. ¿Qué pasos y mejoras harías?
!rubric Hay una instrucción inicial con contexto
!rubric Hay al menos dos mejoras
!rubric Hay una revisión final humana
!model Primero daré contexto: el pedido va 5 días tarde por culpa de un proveedor, el cliente es habitual y quiero mantener la relación. Pediré 2 versiones del correo. Luego: «haz la segunda más corta y cálida», «añade una compensación: 10 % de descuento en el próximo pedido». Al final revisaré yo mismo las fechas, el importe y el nombre del cliente antes de enviarlo.

# ai-05 | Seguridad y responsabilidad | Datos y privacidad
## Lo que envías
Todo lo que escribes en un chatbot llega a los servidores de la empresa. Según el servicio y el plan, las conversaciones pueden guardarse, revisarse para control de calidad o usarse para entrenar futuros modelos. Esto es especialmente habitual en los **planes gratuitos**: merece la pena leer las condiciones.

## Lo que no hay que enviar
- contraseñas, códigos SMS, datos de tarjetas bancarias;
- datos personales de otras personas sin su consentimiento: documentos de identidad, direcciones, información médica;
- documentos confidenciales de tu empresa, salvo que la empresa tenga un servicio de IA aprobado.

## Cómo trabajar con más seguridad
- Anonimiza: sustituye nombres y cifras por «Cliente A», «importe X».
- Conoce las normas de tu empresa: muchas solo permiten versiones corporativas de servicios de IA.
- Revisa la configuración del servicio: a menudo puedes desactivar que tus chats se usen para entrenar.

!key Todo lo que escribes en un chatbot llega a los servidores de la empresa.
!key Los planes gratuitos usan más a menudo las conversaciones para entrenar: lee las condiciones.
!key No envíes contraseñas, datos de pago ni datos personales de otros.
!key Anonimiza los datos y sigue las normas de tu empresa.

?q:e ¿Cuál de estos nunca debe enviarse a un chatbot?
- Una duda de gramática
+ Un código SMS para confirmar un pago
- Una petición para poner nombre a un gato
- El texto de tu propia publicación pública
= Los códigos SMS y las contraseñas no se comparten con nadie.

?q:m Quieres que una IA te ayude a analizar la queja de un cliente. ¿Cuál es la forma más segura?
- Pegar la queja entera con el teléfono y la dirección del cliente
+ Quitar el nombre, los contactos y el número de contrato y sustituirlos por marcadores
- Enviar una captura del documento de identidad del cliente
- Pedir al cliente que escriba él mismo al chatbot
= Anonimizar conserva el sentido y protege a la persona.

?q:m ¿Por qué leer las condiciones del plan gratuito de un servicio de IA?
+ Las conversaciones de un plan gratuito pueden usarse para entrenar modelos
- Un plan gratuito siempre es más peligroso que uno de pago en todo
- Las condiciones son solo para abogados
- Contienen las respuestas a todas las preguntas
= Las condiciones deciden qué pasa con tus datos.

?q:h Tu empresa tiene un servicio de IA corporativo, pero tu cuenta gratuita personal te resulta más cómoda. Preparas un informe con cifras internas. ¿Qué es lo correcto?
- Usar la personal, ya que es más cómoda
+ Usar el servicio corporativo, como exigen las normas
- Enviar las cifras a la personal y luego borrar el chat
- Pedirle a un compañero que lo envíe por ti
= Los datos confidenciales de la empresa solo van a servicios aprobados.

?r:m ¿Qué significa anonimizar datos?
- Borrar todo el texto
+ Sustituir nombres, contactos y cifras exactas por marcadores
- Traducir el texto a otro idioma
- Reducir el texto a la mitad
= El sentido se mantiene; los datos personales, no.

?r:e ¿Adónde va el texto que escribes en un chatbot?
+ A los servidores de la empresa que ofrece el servicio
- A ningún sitio, se queda en el móvil
- Directamente a la policía
- A internet, a la vista de todos
= Por eso importa lo que envías.

!open Piensa en una tarea real de trabajo o estudio en la que te ayudaría una IA. ¿Qué datos tendrías que quitar o sustituir antes de enviarla?
!rubric Se describe la tarea
!rubric Se nombran datos sensibles concretos
!rubric Se propone una forma de anonimizar
!model La tarea es analizar una tabla de ventas por comercial y encontrar las causas de una caída. Antes de enviarla sustituiré los nombres de los comerciales por «Comercial 1–5», quitaré los nombres de los clientes y redondearé los importes. Mantendré la estructura y las tendencias, que es suficiente para el análisis.

# ai-06 | Seguridad y responsabilidad | Dónde la IA es fuerte y dónde flojea
## Puntos fuertes
La IA rinde bien en tareas que consisten en trabajar con texto y cuyo resultado es fácil de comprobar:
- borradores de correos, publicaciones y planes;
- resumir y acortar textos largos;
- explicar lo complejo con palabras sencillas y ejemplos;
- lluvia de ideas: ideas, nombres, opciones;
- traducción y corrección de estilo;
- ayuda con código y fórmulas (revisándolo).

## Puntos débiles
- **Cálculos exactos**: los modelos pueden fallar en aritmética si no usan una calculadora o código.
- **Hechos recientes** sin acceso a búsqueda.
- **Datos muy concretos**: nombres poco comunes, citas, números de documentos.
- **Decisiones con mucho en juego**: diagnósticos, decisiones legales y financieras, siempre revisadas por un especialista.

Una buena regla: usa la IA donde **comprobar el resultado sea más fácil que hacer el trabajo desde cero**.

!key La IA es fuerte en borradores, resúmenes, explicaciones, ideas y traducción.
!key Puntos débiles: cálculos exactos, hechos recientes, datos poco comunes.
!key Las decisiones importantes las toma una persona con un especialista.
!key Usa la IA donde comprobar sea más fácil que hacerlo desde cero.

?q:e ¿Para qué tarea es especialmente buena la IA?
+ Redactar un borrador de correo para tus compañeros
- Hacer un diagnóstico médico
- Decidir si firmar un contrato
- Saber el tipo de cambio exacto de hoy sin búsqueda
= Un borrador es fácil de revisar y corregir.

?q:m ¿Por qué revisar los cálculos de un modelo?
- Los modelos siempre calculan mal
+ Un modelo puede fallar en aritmética si no usa una calculadora o código
- Los cálculos en los chatbots están prohibidos
- Las cifras de las respuestas siempre están redondeadas
= Un modelo de lenguaje predice texto; no calcula.

?q:m ¿Qué regla te ayuda a decidir si usar la IA?
- Usa la IA para todo
- Nunca uses la IA en el trabajo
+ Úsala donde comprobar el resultado sea más fácil que hacer el trabajo desde cero
- Úsala solo los fines de semana
= Así ahorras tiempo sin perder el control.

?q:h ¿Qué tarea es un ejemplo de uso sensato de la IA?
- Preguntarle qué préstamo pedir y firmar enseguida
+ Pedirle que explique con palabras sencillas un contrato largo y comentar las cláusulas dudosas con un abogado
- Copiar una respuesta de la IA en un artículo científico sin revisarla
- Dejar que la IA elija un tratamiento médico
= La IA acelera la comprensión; la decisión sigue siendo de una persona y un especialista.

?r:m ¿Cuál de estos es un punto débil de los modelos?
- Reformular un texto
+ Datos poco comunes: citas exactas, números de documentos
- La lluvia de ideas
- Explicar con palabras sencillas
= El modelo puede inventarse datos muy concretos.

?r:e ¿Quién toma las decisiones con mucho en juego?
+ Una persona, con un especialista si hace falta
- El modelo, si está seguro
- Quien responda más rápido
- Nadie
= La IA es una ayudante, no la responsable.

!open Enumera tres tareas de tu semana: una que merezca la pena delegar en la IA, una para usarla con cuidado y una para no usarla. Explica por qué.
!rubric Tres tareas de distinto tipo
!rubric Explicación basada en lo comprobable o en lo que está en juego
!rubric Ejemplos realistas
!model Delegar en la IA: el borrador de mi informe semanal, que puedo comprobar fácilmente con mis datos. Con cuidado: traducir un correo a un socio; revisaré los términos y el tono. Nada de IA: decidir a qué candidato contratar, porque hay mucho en juego y debe decidir una persona.

# ai-07 | Seguridad y responsabilidad | Sesgos, autoría y honestidad
## Sesgos
Los modelos aprenden de textos humanos, con sus estereotipos incluidos. Por eso sus respuestas pueden estar sesgadas: por ejemplo, atribuir por defecto un género a una profesión o describir países con tópicos. Fíjate en ello y pide alternativas: «¿y si lo miramos desde otro ángulo?».

## Autoría y honestidad
- **Transparencia**. Si las normas de tus estudios o tu trabajo lo exigen, indica que has usado IA. Muchas universidades y editoriales ya tienen normas así.
- **Responsabilidad**. Eres responsable del texto que publicas, aunque lo haya escrito un modelo.
- **Derechos ajenos**. Un modelo puede reproducir fragmentos de textos de otros; no los hagas pasar por tuyos y revisa los posibles plagios.
- **Deepfakes**. No crees fotos, voces ni vídeos falsos de personas reales sin su consentimiento y no uses la IA para engañar.

!key Los modelos heredan estereotipos de los textos: vigila los sesgos.
!key Indica el uso de IA cuando las normas lo exijan.
!key El responsable del texto publicado eres tú, no el modelo.
!key No uses la IA para engañar ni para suplantar a personas reales.

?q:e ¿De dónde vienen los sesgos de los modelos?
- Se añaden a propósito
+ Los modelos aprenden de textos humanos, estereotipos incluidos
- De una mala conexión a internet
- Solo las personas pueden tener sesgos
= Los datos reflejan la sociedad con todas sus distorsiones.

?q:m ¿Quién es responsable de una publicación escrita con IA y publicada con tu nombre?
- La empresa que desarrolló el modelo
+ Tú, como autor de la publicación
- Nadie
- Los lectores
= Quien publica responde de lo publicado.

?q:m Tu universidad exige indicar el uso de IA. Le pediste a una IA que acortara la introducción de tu trabajo. ¿Qué haces?
+ Indicarlo como exigen las normas
- No decir nada, porque los cambios son pequeños
- Borrar el historial del chat
- Reescribir el texto con otra IA para ocultarlo
= La honestidad y las normas van antes que la comodidad.

?q:h ¿Qué uso de la IA es inaceptable?
- Pedir ideas para felicitar a un compañero
- Pedir que te explique un tema difícil
+ Generar un audio «de parte de» un conocido para pedir dinero a sus amigos
- Pedir una revisión gramatical
= Es un engaño que suplanta a una persona real.

?r:m ¿Cómo reaccionar ante un estereotipo en la respuesta de un modelo?
- Aceptarlo como un hecho
+ Detectarlo y pedir otro punto de vista
- Borrar la app de inmediato
- Compartir la respuesta sin comentarios
= Ser crítico con las respuestas forma parte de la alfabetización en IA.

?r:e ¿Puedes presentar el texto de un modelo como totalmente tuyo donde las normas lo prohíben?
- Sí, si nadie se entera
+ No, hay que seguir las normas e indicar el uso de IA
- Sí, si el texto es corto
- Sí, si lo traduces
= Las normas de honestidad también se aplican a la IA.

!open Escribe 3 normas personales para usar la IA con honestidad en tus estudios o tu trabajo.
!rubric Tres normas concretas
!rubric Se tienen en cuenta la responsabilidad y la transparencia
!rubric Las normas son prácticas
!model 1) Reviso y corrijo todo lo que escribe la IA; solo firmo aquello con lo que estoy de acuerdo. 2) Si las normas del curso o del cliente lo exigen, digo que usé IA y para qué. 3) No subo datos personales de otras personas ni creo nada en nombre de personas reales.

# ai-08 | Seguridad y responsabilidad | Aprender junto a la IA
## Una ayudante, no un sustituto
La IA puede acelerar el aprendizaje o sustituirlo sin que te des cuenta. Si el modelo resuelve los problemas por ti, obtienes la respuesta pero no la habilidad: la memoria y la comprensión solo crecen con tu propio esfuerzo. Recuerda el primer curso: **recordar y explicar** es lo que hace duradero el conocimiento.

## Cómo usar la IA para aprender
- Pídele que te **explique** un tema de distintas maneras, con ejemplos de tu vida.
- Pídele que **te haga preguntas** sobre el tema y que corrija tus respuestas: es práctica de recuperación.
- Pide una **pista**, no la solución completa: «dame una pregunta que me oriente».
- Explícale tú el tema al modelo y pídele que encuentre errores: es la técnica Feynman.
- Comprueba los datos: una explicación de la IA también puede tener errores.

## La IA en Chompbook
Si conectas una IA, Chompbook escribe lecciones a partir de tus propios materiales y corrige tus respuestas abiertas. Las lecciones de IA están señaladas, y la bandera de la parte superior de cada lección te permite informar de un error. Sin IA, la app también funciona, con cursos ya preparados y tus propias fuentes.

!key Si la IA hace el trabajo por ti, la habilidad no crece.
!key Pide explicaciones, preguntas y pistas, no soluciones hechas.
!key Explícale tú el tema al modelo y pídele que encuentre errores.
!key Las explicaciones de la IA también hay que comprobarlas.

?q:e ¿Por qué es arriesgado que la IA resuelva todas tus tareas de estudio?
+ Obtienes respuestas pero no la habilidad: la comprensión crece con tu propio esfuerzo
- La IA siempre las resuelve mal
- Va contra la ley
- Es demasiado caro
= El conocimiento se refuerza al recordar y explicar tú mismo.

?q:m ¿Qué petición a la IA entrena mejor tu memoria?
- «Resuélveme el problema»
+ «Hazme 5 preguntas sobre este tema y corrige mis respuestas»
- «Escribe un resumen, ya lo leeré»
- «Dime la respuesta directamente»
= Es práctica de recuperación con retroalimentación.

?q:m Te has atascado en un problema. ¿Cómo pides ayuda para aprender en lugar de copiar?
- «Dame la solución completa»
+ «Dame una pregunta que me oriente sin revelar la respuesta»
- «Resuelve todos los problemas parecidos»
- «Dime solo el número»
= Una pista te deja el trabajo principal a ti.

?q:h ¿Cómo puedes usar la técnica Feynman con una IA?
- Pedirle a la IA que explique el tema y memorizar su texto
+ Explicarle el tema al modelo con tus palabras y pedirle que encuentre errores y lagunas
- Pedirle a la IA que escriba el trabajo por ti
- Comparar dos respuestas de modelos distintos
= Tú explicas; el modelo te ayuda a ver las lagunas.

?r:m ¿Qué haces con una explicación que te ha dado una IA?
- Aceptarla sin comprobarla
+ Contrastar los datos clave con una fuente fiable
- Aprendértela de memoria
- Presentarla como trabajo tuyo
= Las explicaciones también pueden contener errores.

?r:e ¿Qué tipo de ayuda de la IA preserva tu aprendizaje?
+ Explicaciones, preguntas y pistas
- Respuestas hechas para todos los ejercicios
- Que escriba tus trabajos por ti
- Que haga los exámenes por ti
= El esfuerzo principal debe seguir siendo tuyo.

!open Escribe una instrucción para una IA que te ayude a preparar un examen o una entrevista de trabajo sin hacer el trabajo por ti.
!rubric Se dan el contexto y el tema
!rubric La instrucción exige tu participación activa
!rubric Hay retroalimentación
!model Me estoy preparando para una entrevista de analista de datos. Hazme una pregunta cada vez sobre SQL y estadística, de fácil a difícil. Después de cada respuesta, dime qué estaba bien y qué faltaba, y solo entonces hazme la siguiente pregunta. No me enseñes las respuestas modelo hasta que te lo pida.
