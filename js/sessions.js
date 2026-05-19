/* ============================================
   ZENFLOW — Sesiones de meditación
   ============================================ */

const ZenSessions = (() => {

  // ---- Catálogo de sesiones ----
  const SESSIONS = [
    {
      id: 'urgente',
      name: 'Rescate Urgente',
      emoji: '⚡',
      desc: 'Para cuando el estrés te supera. 3 minutos que cambian todo.',
      duration: 180,
      tags: ['stress', 'short'],
      color: ['#f43f5e', '#f97316'],
      audio: ['ocean'],
      steps: [
        { text: 'Para. Estás bien. Pon ambas manos en el pecho y siente tu corazón.', dur: 20, phase: null },
        { text: 'Inhala muy lentamente por la nariz, llenando el vientre primero...', dur: 4, phase: 'inhale' },
        { text: 'Retén. Siente la pausa. Tú tienes el control.', dur: 4, phase: 'hold' },
        { text: 'Exhala despacio por la boca, soltando toda la tensión...', dur: 8, phase: 'exhale' },
        { text: 'Inhala de nuevo. Profundo. Todo está bien.', dur: 4, phase: 'inhale' },
        { text: 'Retén. El estrés es temporal. Tú no lo eres.', dur: 4, phase: 'hold' },
        { text: 'Exhala. Suelta. Más largo esta vez.', dur: 8, phase: 'exhale' },
        { text: 'Una vez más. Inhala... y recuerda: este momento pasará.', dur: 4, phase: 'inhale' },
        { text: 'Retén...', dur: 4, phase: 'hold' },
        { text: 'Exhala completamente. Eres más grande que cualquier problema.', dur: 8, phase: 'exhale' },
        { text: 'Abre los ojos despacio. Llevas dentro todo lo que necesitas.', dur: 20, phase: null },
      ]
    },
    {
      id: 'despertar',
      name: 'Despertar Suave',
      emoji: '🌅',
      desc: 'Empieza el día con calma, claridad e intención.',
      duration: 300,
      tags: ['short'],
      color: ['#f5a623', '#f97316'],
      audio: ['forest', 'bowl1'],
      steps: [
        { text: 'Buenos días. Siente el peso de tu cuerpo sobre la cama o el suelo.', dur: 30, phase: null },
        { text: 'Inhala profundo, como si fuera la primera respiración del día.', dur: 4, phase: 'inhale' },
        { text: 'Retén y recibe la energía del nuevo día.', dur: 4, phase: 'hold' },
        { text: 'Exhala y libera cualquier residuo del sueño.', dur: 6, phase: 'exhale' },
        { text: 'Siente los dedos de tus pies. Muévelos suavemente. El cuerpo despierta.', dur: 30, phase: null },
        { text: 'Ahora los tobillos, las rodillas, las caderas. Todo se activa.', dur: 30, phase: null },
        { text: 'Lleva la atención al vientre. Observa cómo sube y baja con cada respiración.', dur: 30, phase: null },
        { text: 'Inhala llenando primero el vientre, luego el pecho, luego las clavículas.', dur: 5, phase: 'inhale' },
        { text: 'Retén en la cima. Energía pura.', dur: 3, phase: 'hold' },
        { text: 'Exhala todo, de arriba hacia abajo. Completo.', dur: 6, phase: 'exhale' },
        { text: 'Piensa en una cosa que te ilusione de hoy. Sonríe si puedes.', dur: 30, phase: null },
        { text: 'Repite en silencio: "Estoy presente. Estoy agradecido. Estoy listo."', dur: 30, phase: null },
        { text: 'Una última respiración completa. Inhala tu intención para el día.', dur: 5, phase: 'inhale' },
        { text: 'Retén...', dur: 4, phase: 'hold' },
        { text: 'Exhala y abre los ojos. El día es tuyo.', dur: 6, phase: 'exhale' },
      ]
    },
    {
      id: 'respiracion478',
      name: 'Respiración 4-7-8',
      emoji: '🌬',
      desc: 'Técnica ancestral para calmar el sistema nervioso en minutos.',
      duration: 480,
      tags: ['short', 'stress'],
      color: ['#06b6d4', '#3b82f6'],
      audio: ['bowl2', 'rain'],
      steps: [
        { text: 'La respiración 4-7-8 activa el nervio vago y calma el sistema nervioso en segundos.', dur: 20, phase: null },
        { text: 'Coloca la punta de la lengua justo detrás de los dientes superiores.', dur: 15, phase: null },
        { text: 'Exhala completamente por la boca con un sonido suave "ahhh".', dur: 8, phase: 'exhale' },
        { text: 'Inhala en silencio por la nariz. 1... 2... 3... 4...', dur: 4, phase: 'inhale' },
        { text: 'Retén la respiración. 1... 2... 3... 4... 5... 6... 7...', dur: 7, phase: 'hold' },
        { text: 'Exhala por la boca completamente. 1...2...3...4...5...6...7...8...', dur: 8, phase: 'exhale' },
        { text: 'Eso es un ciclo. Repite. Inhala suavemente...', dur: 4, phase: 'inhale' },
        { text: 'Retén...', dur: 7, phase: 'hold' },
        { text: 'Exhala...', dur: 8, phase: 'exhale' },
        { text: 'Sientes cómo tu cuerpo se suaviza. Inhala...', dur: 4, phase: 'inhale' },
        { text: 'Retén...', dur: 7, phase: 'hold' },
        { text: 'Exhala...', dur: 8, phase: 'exhale' },
        { text: 'Casi terminas. Inhala por última vez...', dur: 4, phase: 'inhale' },
        { text: 'Retén...', dur: 7, phase: 'hold' },
        { text: 'Exhala todo. Siente la calma profunda que has creado dentro de ti.', dur: 8, phase: 'exhale' },
        { text: 'Respira normalmente. Observa cuánto más tranquilo/a te sientes.', dur: 30, phase: null },
      ]
    },
    {
      id: 'cuencos',
      name: 'Cuencos Tibetanos',
      emoji: '🔔',
      desc: 'Las frecuencias sagradas de 432, 528 y 639 Hz sanan mente y cuerpo.',
      duration: 900,
      tags: ['long'],
      color: ['#7c3aed', '#f5a623'],
      audio: ['bowl1', 'bowl2'],
      steps: [
        { text: 'Siéntate cómodamente. Cierra los ojos. Deja que el sonido te encuentre.', dur: 30, phase: null },
        { text: 'El cuenco de 432 Hz resuena con la frecuencia natural del universo. Escucha.', dur: 60, phase: null },
        { text: 'Inhala el sonido...', dur: 5, phase: 'inhale' },
        { text: 'Retén... siente las vibraciones en el pecho...', dur: 5, phase: 'hold' },
        { text: 'Exhala y libera lo que ya no necesitas.', dur: 6, phase: 'exhale' },
        { text: 'El sonido viaja por tu cuerpo como agua. Siente dónde resuena.', dur: 60, phase: null },
        { text: 'Ahora el cuenco de 528 Hz, la frecuencia del amor y la reparación celular.', dur: 60, phase: null },
        { text: 'Inhala amor hacia ti mismo/a. Profundo y completo.', dur: 5, phase: 'inhale' },
        { text: 'Retén... siente tu corazón...', dur: 5, phase: 'hold' },
        { text: 'Exhala y libera toda autocrítica.', dur: 6, phase: 'exhale' },
        { text: 'Cada célula de tu cuerpo vibra con salud y vitalidad.', dur: 60, phase: null },
        { text: '639 Hz: la frecuencia de la conexión y las relaciones. Siente el amor.', dur: 60, phase: null },
        { text: 'Inhala gratitud por todos quienes te rodean.', dur: 5, phase: 'inhale' },
        { text: 'Retén y envía amor a quien más lo necesite ahora.', dur: 5, phase: 'hold' },
        { text: 'Exhala con un sonido suave. Comparte tu energía con el mundo.', dur: 6, phase: 'exhale' },
        { text: 'Los tres cuencos resuenan juntos ahora. Tú eres parte de esa armonía.', dur: 60, phase: null },
        { text: 'Descansa en el silencio entre los sonidos. Ahí también vive la paz.', dur: 60, phase: null },
        { text: 'Cuando estés listo/a, lleva la mano al corazón. Lleva este sonido contigo.', dur: 30, phase: null },
      ]
    },
    {
      id: 'bodyscan',
      name: 'Escáner Corporal',
      emoji: '✨',
      desc: 'Un viaje lento de los pies a la cabeza. Suelta tensiones que no sabías que tenías.',
      duration: 1200,
      tags: ['long'],
      color: ['#10b981', '#06b6d4'],
      audio: ['rain', 'pad'],
      steps: [
        { text: 'Túmbate boca arriba. Cierra los ojos. Respira tres veces profundo.', dur: 30, phase: null },
        { text: 'Inhala...', dur: 4, phase: 'inhale' },
        { text: 'Retén...', dur: 3, phase: 'hold' },
        { text: 'Exhala y suelta el día.', dur: 6, phase: 'exhale' },
        { text: 'Lleva tu atención a los dedos del pie derecho. Solo obsérvales. Sin juzgar.', dur: 60, phase: null },
        { text: 'Ahora el pie izquierdo. Siente el contacto con el suelo o la superficie.', dur: 60, phase: null },
        { text: 'Tus tobillos, pantorrillas y espinillas. ¿Hay tensión? Si la hay, respira hacia ella.', dur: 90, phase: null },
        { text: 'Inhala hacia las piernas...', dur: 4, phase: 'inhale' },
        { text: 'Exhala y suelta cualquier tensión de las piernas.', dur: 6, phase: 'exhale' },
        { text: 'Rodillas y muslos. Músculos grandes que cargan mucho peso. Deja que descansen.', dur: 90, phase: null },
        { text: 'Caderas y pelvis. Un centro de mucha energía emocional. Respira aquí.', dur: 90, phase: null },
        { text: 'Inhala hacia el vientre...', dur: 4, phase: 'inhale' },
        { text: 'Exhala. El vientre se ablanda. Todo está bien.', dur: 6, phase: 'exhale' },
        { text: 'La espalda baja. Siente los puntos de contacto con el suelo.', dur: 90, phase: null },
        { text: 'El pecho. Siente cómo se mueve con cada respiración. Aquí vive la emoción.', dur: 60, phase: null },
        { text: 'Los hombros. Déjalos caer. Más. Todavía más.', dur: 60, phase: null },
        { text: 'Brazos, codos, muñecas, dedos. Un río de relajación fluye hacia abajo.', dur: 60, phase: null },
        { text: 'El cuello. Zona de mucha tensión. Permítele suavizarse.', dur: 60, phase: null },
        { text: 'La cara: la mandíbula, los ojos, la frente. Todo se suelta.', dur: 60, phase: null },
        { text: 'Inhala llenando todo el cuerpo de luz y calma...', dur: 5, phase: 'inhale' },
        { text: 'Retén ese bienestar...', dur: 4, phase: 'hold' },
        { text: 'Exhala cualquier resto de tensión. Tu cuerpo es una ofrenda de paz.', dur: 6, phase: 'exhale' },
        { text: 'Permanece aquí unos momentos. No hay prisa. Este momento es tuyo.', dur: 60, phase: null },
      ]
    },
    {
      id: 'gratitud',
      name: 'Gratitud Profunda',
      emoji: '💛',
      desc: 'La gratitud cambia el cerebro. 10 minutos de amor propio y apertura.',
      duration: 600,
      tags: ['short', 'long'],
      color: ['#f5a623', '#10b981'],
      audio: ['forest', 'pad'],
      steps: [
        { text: 'Pon la mano derecha en el corazón. Siente su latido. Ese ritmo es vida pura.', dur: 30, phase: null },
        { text: 'Inhala gratitud. Exhala amor.', dur: 4, phase: 'inhale' },
        { text: 'Retén...', dur: 3, phase: 'hold' },
        { text: 'Exhala suave.', dur: 5, phase: 'exhale' },
        { text: 'Piensa en tu cuerpo. Que respira solo, que late solo, que sana solo. Es un milagro.', dur: 45, phase: null },
        { text: 'Piensa en alguien que te quiera. Siente esa conexión. Deja que te llene.', dur: 45, phase: null },
        { text: 'Inhala ese amor que recibes...', dur: 4, phase: 'inhale' },
        { text: 'Retén y siente lo afortunado/a que eres.', dur: 5, phase: 'hold' },
        { text: 'Exhala amor hacia esa persona.', dur: 5, phase: 'exhale' },
        { text: 'Piensa en algo pequeño y hermoso de hoy: una luz, un sabor, un momento.', dur: 45, phase: null },
        { text: 'La gratitud no niega el dolor. Lo pone en perspectiva. Puedes tener ambos.', dur: 45, phase: null },
        { text: 'Repite conmigo en silencio: "Soy suficiente. Tengo suficiente. Hay suficiente amor."', dur: 45, phase: null },
        { text: 'Inhala esta verdad...', dur: 4, phase: 'inhale' },
        { text: 'Retén. Deja que entre hasta el fondo.', dur: 5, phase: 'hold' },
        { text: 'Exhala y libera la escasez, la comparación, el juicio.', dur: 5, phase: 'exhale' },
        { text: 'Envía gratitud hacia adelante. Hacia quien seas en el futuro.', dur: 45, phase: null },
        { text: 'Una última vez: mano en el corazón. Gracias. Por todo.', dur: 30, phase: null },
      ]
    },
    {
      id: 'sueno',
      name: 'Sueño Profundo',
      emoji: '🌙',
      desc: 'Deja ir el día. Guía tu mente hacia el descanso más profundo.',
      duration: 1200,
      tags: ['long'],
      color: ['#1e1b4b', '#312e81'],
      audio: ['rain', 'ocean'],
      steps: [
        { text: 'Estás en tu cama. Estás seguro/a. No hay nada más que hacer hoy.', dur: 30, phase: null },
        { text: 'Cierra los ojos. Siente el peso de tu cuerpo hundiéndose en el colchón.', dur: 30, phase: null },
        { text: 'Inhala muy despacio, sin esfuerzo...', dur: 5, phase: 'inhale' },
        { text: 'Retén un momento...', dur: 3, phase: 'hold' },
        { text: 'Exhala largo y lento. Todo el día se va con esa respiración.', dur: 8, phase: 'exhale' },
        { text: 'Escucha la lluvia. Cada gota te acuna. No hay nada que resolver ahora.', dur: 60, phase: null },
        { text: 'Tus pies son pesados. Tus piernas son pesadas. Como plomo cálido.', dur: 60, phase: null },
        { text: 'Tu vientre es pesado. Tu pecho es pesado. Tu respiración es lenta.', dur: 60, phase: null },
        { text: 'Inhala...', dur: 5, phase: 'inhale' },
        { text: 'Retén...', dur: 3, phase: 'hold' },
        { text: 'Exhala... cayendo más profundo...', dur: 8, phase: 'exhale' },
        { text: 'Tus brazos son pesados. Tu cuello es pesado. Tu cabeza se hunde.', dur: 60, phase: null },
        { text: 'Imagina una escalera de diez peldaños bajando hacia un jardín de paz.', dur: 30, phase: null },
        { text: '10... 9... con cada número caes más profundo... 8... 7... 6...', dur: 60, phase: null },
        { text: '5... 4... tus pensamientos se convierten en nubes y se alejan... 3...', dur: 60, phase: null },
        { text: '2... 1... Llegas al jardín. Silencio. Calidez. Paz total.', dur: 60, phase: null },
        { text: 'Aquí puedes descansar. No hay pasado ni futuro. Solo este momento.', dur: 60, phase: null },
        { text: 'Inhala paz...', dur: 5, phase: 'inhale' },
        { text: 'Exhala... y duerme.', dur: 8, phase: 'exhale' },
        { text: 'Buenas noches.', dur: 120, phase: null },
      ]
    },
    {
      id: 'activa',
      name: 'Meditación Activa',
      emoji: '🌀',
      desc: 'Inspirada en Osho. Libera energía acumulada y llega a la quietud desde el movimiento.',
      duration: 900,
      tags: ['long', 'stress'],
      color: ['#7c3aed', '#f43f5e'],
      audio: ['drum'],
      steps: [
        { text: 'FASE 1 — CAOS: Durante 2 minutos, mueve el cuerpo como quieras. ¡Sacúdete! ¡Salta! ¡Libera!', dur: 120, phase: null },
        { text: 'Sigue moviéndote. Los tambores te llevan. Deja que el cuerpo haga lo que quiera.', dur: 60, phase: null },
        { text: 'FASE 2 — RESPIRACIÓN: Respira fuerte por la nariz. Rápido y profundo. Sin parar.', dur: 10, phase: null },
        { text: 'Inhala fuerte...', dur: 2, phase: 'inhale' },
        { text: 'Exhala fuerte...', dur: 2, phase: 'exhale' },
        { text: 'Más rápido. Inhala...', dur: 2, phase: 'inhale' },
        { text: 'Exhala...', dur: 2, phase: 'exhale' },
        { text: 'Sigue. 10 veces más. ¡Respira! Libera todo.', dur: 30, phase: null },
        { text: 'FASE 3 — GRITO: Si quieres gritar, grita. Si quieres llorar, llora. Todo vale.', dur: 60, phase: null },
        { text: 'FASE 4 — SILENCIO: Para. Completamente. Quédate exactamente donde estás.', dur: 10, phase: null },
        { text: 'No te muevas. No hagas nada. Solo observa.', dur: 60, phase: null },
        { text: 'Inhala la quietud...', dur: 4, phase: 'inhale' },
        { text: 'Retén. Eres el testigo de todo lo que ocurre.', dur: 5, phase: 'hold' },
        { text: 'Exhala. Desde el caos llega el silencio más profundo.', dur: 6, phase: 'exhale' },
        { text: 'FASE 5 — INTEGRACIÓN: Siéntate. Cierra los ojos. Esa quietud que sientes ahora... eres tú.', dur: 120, phase: null },
        { text: 'El movimiento y el silencio no son opuestos. Son el mismo río.', dur: 60, phase: null },
        { text: 'Lleva la mano al pecho. Agradece a tu cuerpo por todo lo que acaba de soltar.', dur: 30, phase: null },
      ]
    },
    {
      id: 'yoganidra',
      name: 'Yoga Nidra',
      emoji: '🌌',
      desc: 'El sueño consciente. Un viaje guiado por el cuerpo hacia el descanso más profundo.',
      duration: 1500,
      tags: ['sleep', 'long'],
      color: ['#1e1b4b', '#0c4a6e'],
      audio: ['rain', 'pad'],
      steps: [
        { text: 'Túmbate boca arriba. Brazos a los lados, palmas hacia el cielo. Piernas separadas.', dur: 30, phase: null },
        { text: 'Esta es la postura del cadáver. No te dormirás del todo. Solo descansarás más profundo que durmiendo.', dur: 30, phase: null },
        { text: 'Inhala lento por la nariz...', dur: 5, phase: 'inhale' },
        { text: 'Exhala más largo todavía. Suelta el día.', dur: 8, phase: 'exhale' },
        { text: 'Lleva tu atención a la mano derecha. Siente el pulgar derecho.', dur: 15, phase: null },
        { text: 'El índice... el dedo medio... el anular... el meñique.', dur: 20, phase: null },
        { text: 'La palma de la mano derecha. El dorso. La muñeca.', dur: 20, phase: null },
        { text: 'El antebrazo derecho. El codo. El brazo. El hombro derecho.', dur: 20, phase: null },
        { text: 'Ahora la mano izquierda. Pulgar izquierdo... índice... medio... anular... meñique.', dur: 30, phase: null },
        { text: 'Palma izquierda. Muñeca. Antebrazo. Codo. Brazo. Hombro izquierdo.', dur: 30, phase: null },
        { text: 'Lleva la atención al pie derecho. Dedo gordo... los demás dedos...', dur: 20, phase: null },
        { text: 'La planta del pie. El empeine. El tobillo. La pantorrilla. La rodilla. El muslo.', dur: 30, phase: null },
        { text: 'Pie izquierdo. Dedos. Planta. Empeine. Tobillo. Pantorrilla. Rodilla. Muslo.', dur: 30, phase: null },
        { text: 'La cadera derecha... la cadera izquierda... el bajo vientre.', dur: 20, phase: null },
        { text: 'El ombligo. El estómago. El pecho. El corazón latiendo suavemente.', dur: 25, phase: null },
        { text: 'La garganta. La mandíbula se afloja. La lengua descansa.', dur: 20, phase: null },
        { text: 'Los labios se separan ligeramente. Las mejillas. La nariz.', dur: 20, phase: null },
        { text: 'Los ojos cerrados, pesados como dos lagos en calma. Las cejas se relajan.', dur: 25, phase: null },
        { text: 'La frente se vuelve ancha y suave. El cuero cabelludo se afloja.', dur: 20, phase: null },
        { text: 'Todo el cuerpo en reposo. Tan denso que casi flota.', dur: 30, phase: null },
        { text: 'Inhala paz...', dur: 5, phase: 'inhale' },
        { text: 'Retén suavemente...', dur: 3, phase: 'hold' },
        { text: 'Exhala todo lo que ya no necesitas.', dur: 8, phase: 'exhale' },
        { text: 'Visualiza un cielo nocturno infinito. Tú estás ahí, flotando entre las estrellas.', dur: 40, phase: null },
        { text: 'No tienes cuerpo. No tienes nombre. Solo eres conciencia entre la luz.', dur: 40, phase: null },
        { text: 'Una estrella se acerca. Es cálida. Te envuelve. Eres luz dentro de luz.', dur: 50, phase: null },
        { text: 'Aquí no existe el tiempo. Aquí no hay nada que hacer. Solo ser.', dur: 60, phase: null },
        { text: 'Si llega el sueño, déjalo llegar. Si no llega, sigue descansando.', dur: 60, phase: null },
        { text: 'Tu cuerpo ya descansa lo que descansaría en cuatro horas de sueño.', dur: 60, phase: null },
        { text: 'Sigue flotando. Sigue siendo luz. No hay prisa por volver.', dur: 90, phase: null },
        { text: 'Cuando quieras, mueve ligeramente los dedos. Sin abrir los ojos.', dur: 30, phase: null },
        { text: 'O quédate aquí. Esta paz es tuya. La llevas dentro siempre.', dur: 120, phase: null },
      ]
    },
    {
      id: 'cuento',
      name: 'Cuento para Dormir',
      emoji: '📖',
      desc: 'Una visualización suave para soltar el día y deslizarte hacia el sueño.',
      duration: 900,
      tags: ['sleep'],
      color: ['#1e3a8a', '#312e81'],
      audio: ['fire', 'pad'],
      steps: [
        { text: 'Acomódate. Cierra los ojos. Hoy no tienes que esforzarte por dormir.', dur: 20, phase: null },
        { text: 'Imagina que caminas por un sendero de bosque al atardecer.', dur: 25, phase: null },
        { text: 'El aire huele a pino y tierra mojada. Hace exactamente la temperatura justa.', dur: 30, phase: null },
        { text: 'A lo lejos ves una pequeña cabaña con luz cálida en la ventana.', dur: 25, phase: null },
        { text: 'Te acercas sin prisa. Cada paso es más ligero que el anterior.', dur: 30, phase: null },
        { text: 'Empujas la puerta. Dentro huele a madera, a fuego suave, a té de manzanilla.', dur: 30, phase: null },
        { text: 'Hay una cama enorme cubierta de mantas suaves. Te están esperando.', dur: 30, phase: null },
        { text: 'Te dejas caer en ella. Las mantas te abrazan. El colchón te recibe.', dur: 35, phase: null },
        { text: 'Inhala el aire tibio del cuarto...', dur: 5, phase: 'inhale' },
        { text: 'Exhala todo el camino del día.', dur: 8, phase: 'exhale' },
        { text: 'Fuera, empieza a nevar muy despacio. Los copos caen sin ruido.', dur: 40, phase: null },
        { text: 'El fuego de la chimenea crepita suavemente. Solo eso. Nada más.', dur: 40, phase: null },
        { text: 'Tu cuerpo se hunde un poco más en las mantas. Los párpados pesan.', dur: 45, phase: null },
        { text: 'Tus piernas ya no son tuyas. Pertenecen al sueño.', dur: 40, phase: null },
        { text: 'Tus brazos tampoco. Se han ido a flotar a otro lugar.', dur: 40, phase: null },
        { text: 'Tu mente se vuelve líquida. Los pensamientos se vuelven copos. Caen sin ruido.', dur: 60, phase: null },
        { text: 'Ya no sabes si estás en la cabaña o en tu cama. Da igual. Ambas son lo mismo.', dur: 60, phase: null },
        { text: 'Inhala calor...', dur: 5, phase: 'inhale' },
        { text: 'Exhala... y déjate ir.', dur: 10, phase: 'exhale' },
        { text: 'No tienes que terminar este cuento. Puedes quedarte aquí.', dur: 60, phase: null },
        { text: 'Mañana habrá tiempo. Ahora solo hay nieve, fuego y tu respiración.', dur: 90, phase: null },
        { text: 'Duerme. Buenas noches.', dur: 180, phase: null },
      ]
    },
  ];

  // ---- Controlador de sesión activa ----
  let currentSession = null;
  let stepIndex = 0;
  let stepTimer = null;
  let elapsedTotal = 0;
  let totalTimer = null;
  let paused = false;
  let onStepChange = null;
  let onComplete = null;
  let onTick = null;

  function getAll() { return SESSIONS; }
  function getById(id) { return SESSIONS.find(s => s.id === id); }
  function getQuick() { return SESSIONS.slice(0, 4); }

  function start(sessionId, callbacks = {}) {
    const session = getById(sessionId);
    if (!session) return;

    currentSession = session;
    stepIndex = 0;
    elapsedTotal = 0;
    paused = false;
    onStepChange = callbacks.onStep || (() => {});
    onComplete = callbacks.onComplete || (() => {});
    onTick = callbacks.onTick || (() => {});

    ZenAudio.startSessionAudio(session.audio);
    runStep();
    runTotalTimer();
  }

  function runStep() {
    if (!currentSession) return;
    const step = currentSession.steps[stepIndex];
    if (!step) { complete(); return; }

    onStepChange(step, stepIndex, currentSession.steps.length);
    if (step.phase) ZenAnim.setBreathPhase(step.phase, step.dur);
    else ZenAnim.setBreathPhase('rest', 4);

    clearTimeout(stepTimer);
    stepTimer = setTimeout(() => {
      if (!paused) nextStep();
    }, step.dur * 1000);
  }

  function runTotalTimer() {
    clearInterval(totalTimer);
    totalTimer = setInterval(() => {
      if (paused) return;
      elapsedTotal++;
      onTick(elapsedTotal, currentSession.duration);
      ZenAnim.updateTimer(elapsedTotal, currentSession.duration);
      if (elapsedTotal >= currentSession.duration) complete();
    }, 1000);
  }

  function nextStep() {
    stepIndex++;
    if (stepIndex >= currentSession.steps.length) { complete(); return; }
    runStep();
  }

  function pause() {
    paused = true;
    clearTimeout(stepTimer);
  }

  function resume() {
    if (!paused) return;
    paused = false;
    runStep();
  }

  function togglePause() {
    paused ? resume() : pause();
    return paused;
  }

  function skipStep() {
    clearTimeout(stepTimer);
    nextStep();
  }

  function stop() {
    clearTimeout(stepTimer);
    clearInterval(totalTimer);
    ZenAudio.stopSessionAudio();
    ZenAnim.stopSessionBg();
    ZenAnim.stopViz();
    currentSession = null;
  }

  function complete() {
    clearTimeout(stepTimer);
    clearInterval(totalTimer);
    ZenAudio.stopSessionAudio();
    const duration = Math.floor(elapsedTotal / 60);
    if (onComplete) onComplete(currentSession, duration);
  }

  function getCurrentSession() { return currentSession; }
  function getElapsed() { return elapsedTotal; }

  return {
    SESSIONS,
    getAll, getById, getQuick,
    start, stop, complete,
    nextStep, skipStep,
    togglePause, pause, resume,
    getCurrentSession, getElapsed,
  };
})();
