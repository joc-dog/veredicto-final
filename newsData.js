const newsData = {
  colombia: [
    {
      id: "co-1",
      category: "Política",
      title: "Juez envió a prisión a presuntos implicados en el crimen de Camila Potosí y su bebé",
      deck: "La Fiscalía los acusa de orquestar el atroz hecho. Los cinco detenidos deberán enfrentar el proceso legal en un centro carcelario tras demostrarse pruebas contundentes.",
      content: `El Juzgado Penal Municipal de Cali dictó medida de aseguramiento en centro carcelario contra cinco personas presuntamente implicadas en el secuestro y homicidio de la joven Camila Potosí y su bebé de tan solo ocho meses de nacida.

La Fiscalía General de la Nación presentó pruebas técnicas y testimoniales sólidas que demostrarían cómo los acusados planificaron y ejecutaron el crimen el pasado mes en el oriente de la ciudad. Los delitos imputados incluyen feminicidio agravado, secuestro simple y desaparición forzada.

Durante las audiencias concentradas, los imputados no aceptaron los cargos, sin embargo, el juez determinó que representan un peligro inminente para la sociedad y para los familiares de las víctimas, ordenando su reclusión inmediata mientras avanza el juicio oral.`,
      image: "assets/colombia_hero.png",
      author: "Jhoan Pardo",
      date: "Hace 10 min",
      readTime: "4 min de lectura",
      trending: true
    },
    {
      id: "co-2",
      category: "Deportes",
      title: "Colombia brilla en el ciclismo internacional con una victoria épica en los Andes",
      deck: "El pedalista boyacense se impuso en la etapa reina tras un ataque demoledor en el último puerto de montaña, consolidando su liderazgo en la clasificación general.",
      content: `Una jornada memorable para el ciclismo nacional se vivió hoy en las carreteras andinas. El corredor colombiano logró descolgar a sus rivales directos a falta de tres kilómetros para la meta, coronando el puerto de categoría especial en solitario.

Con lágrimas en los ojos, el atleta dedicó el triunfo a su familia y a todo el país. \"Ha sido una preparación muy dura, pero el apoyo de la gente en la carretera me dio la fuerza necesaria para aguantar el ritmo en las rampas más empinadas\", declaró en la rueda de prensa posterior.

La prensa internacional destaca el resurgir de los 'escarabajos' colombianos en las grandes vueltas, posicionando al país como el rival a batir en las próximas etapas de alta montaña.`,
      image: "assets/sports.png",
      author: "Mariana Silva",
      date: "Hace 1 hora",
      readTime: "3 min de lectura",
      trending: true
    },
    {
      id: "co-3",
      category: "Tecnología",
      title: "Medellín se consolida como el epicentro de la Inteligencia Artificial en América Latina",
      deck: "Con la inauguración de un nuevo centro de investigación y desarrollo, la capital antioqueña busca atraer talento global y capacitar a miles de jóvenes.",
      content: `La ciudad de Medellín ha dado un paso gigantesco en su estrategia de convertirse en el Silicon Valley de Sudamérica. Hoy se abrieron las puertas del Centro Internacional de IA, una alianza pública-privada que cuenta con el respaldo de grandes tecnológicas mundiales.

El proyecto cuenta con laboratorios especializados en aprendizaje profundo, procesamiento de lenguaje natural y robótica aplicada. El alcalde de la ciudad destacó que el principal objetivo es democratizar el acceso a la educación tecnológica.

\"No solo queremos importar tecnología, queremos crearla desde aquí, con talento local que resuelva problemas reales de nuestras comunidades\", afirmó el director del centro durante el evento de lanzamiento.`,
      image: "assets/technology.png",
      author: "Carlos Andrés",
      date: "Hace 3 horas",
      readTime: "5 min de lectura",
      trending: false
    },
    {
      id: "co-4",
      category: "Entretenimiento",
      title: "El cine colombiano conquista taquillas europeas con una propuesta innovadora",
      deck: "La película, filmada enteramente en los paisajes del Eje Cafetero, recibe elogios de la crítica internacional por su fotografía y profunda narrativa social.",
      content: `Un drama familiar ambientado en los cafetales colombianos está dando de qué hablar en los principales festivales cinematográficos de Europa. Tras su exitoso estreno, la producción nacional ha logrado posicionarse entre las favoritas del público y la crítica especializada.

El largometraje explora las dinámicas generacionales de una familia de recolectores de café, entrelazando toques de realismo mágico con una dura realidad socioeconómica. La dirección de arte y la banda sonora han sido calificadas como obras de arte independientes.

Se espera que la película se estrene en las salas de cine colombianas a finales del próximo mes, con una expectativa de taquilla muy alta debido a su gran recepción en el exterior.`,
      image: "assets/colombia_hero.png",
      author: "Sofía Gómez",
      date: "Hace 5 horas",
      readTime: "3 min de lectura",
      trending: false
    },
    {
      id: "co-5",
      category: "Economía",
      title: "Exportaciones de café premium colombiano registran un crecimiento récord en el semestre",
      deck: "La demanda de cafés de especialidad en mercados como Asia y Norteamérica impulsa los ingresos de miles de familias caficultoras en todo el país.",
      content: `El café colombiano sigue ganando terreno en los mercados más exigentes del mundo. De acuerdo con el último reporte de la Federación Nacional de Cafeteros, las exportaciones de café de alta especialidad crecieron notablemente durante la primera mitad del año.

El aumento se atribuye al cambio en los hábitos de consumo global, donde los compradores valoran cada vez más el origen ético, la sostenibilidad del cultivo y los perfiles de sabor complejos que ofrecen las variedades colombianas.

Los caficultores expresaron su optimismo por el alza de precios internos, lo que les permite reinvertir en tecnología agrícola y mejorar la calidad de vida de sus trabajadores.`,
      image: "assets/colombia_hero.png",
      author: "Alejandro Torres",
      date: "Ayer",
      readTime: "4 min de lectura",
      trending: true
    }
  ],
  mexico: [
    {
      id: "mx-1",
      category: "Política",
      title: "Gobierno de México anuncia histórico plan de infraestructura para el Istmo de Tehuantepec",
      deck: "El proyecto busca potenciar el corredor interoceánico como alternativa al canal de Panamá, impulsando el desarrollo industrial y comercial en el sur del país.",
      content: `La Presidencia de la República presentó de manera oficial la fase de expansión del Corredor Interoceánico del Istmo de Tehuantepec, una de las mayores apuestas de la administración actual para detonar el crecimiento del sur-sureste del territorio nacional.

El plan contempla la modernización de los puertos de Coatzacoalcos y Salina Cruz, la ampliación de las vías férreas para trenes de carga rápidos y la creación de diez polos de desarrollo industrial con estímulos fiscales atractivos para empresas multinacionales.

Representantes de cámaras de comercio internacionales expresaron que este proyecto podría transformar el flujo logístico del continente, reduciendo los tiempos de traslado de mercancías entre el Océano Pacífico y la costa este de los Estados Unidos.`,
      image: "assets/mexico_hero.png",
      author: "Ana Karen Ruíz",
      date: "Hace 15 min",
      readTime: "5 min de lectura",
      trending: true
    },
    {
      id: "mx-2",
      category: "Deportes",
      title: "Mexicana de clavados se lleva el oro en el campeonato mundial de deportes acuáticos",
      deck: "Con una ejecución perfecta en sus últimos dos saltos desde la plataforma de 10 metros, la atleta subió al escalón más alto del podio en Doha.",
      content: `Una actuación histórica consagró hoy a la delegación mexicana en el Campeonato Mundial. La clavadista nacida en Guadalajara dominó la ronda final de principio a fin, logrando calificaciones sobresalientes que dejaron sin opciones a las competidoras de China y Canadá.

La precisión en la entrada al agua y la complejidad de sus giros cautivaron a los jueces de la competencia. Con este triunfo, asegura además su clasificación directa para la próxima cita olímpica.

\"He entrenado más de ocho horas diarias para este momento. Es un honor poner el nombre de México en lo más alto del podio mundial\", declaró con orgullo tras colgarse la medalla.`,
      image: "assets/sports.png",
      author: "Fernando Esquivel",
      date: "Hace 2 horas",
      readTime: "3 min de lectura",
      trending: true
    },
    {
      id: "mx-3",
      category: "Tecnología",
      title: "Desarrollan en la UNAM dispositivo biomédico portátil para detección temprana de enfermedades",
      deck: "Un grupo de científicos y estudiantes de ingeniería médica creó un sensor capaz de analizar biomarcadores a partir de una sola gota de saliva en minutos.",
      content: `Investigadores de la Universidad Nacional Autónoma de México (UNAM) han diseñado un prototipo de laboratorio en un chip que revolucionaría los diagnósticos médicos preventivos en zonas rurales del país.

El dispositivo se conecta a cualquier teléfono inteligente mediante Bluetooth y procesa los datos a través de una aplicación dedicada que evalúa de forma preliminar marcadores metabólicos e inflamatorios.

El líder de la investigación señaló que el costo de producción es sumamente bajo en comparación con los análisis de laboratorio tradicionales, lo que facilitará su distribución en clínicas de bajos recursos.`,
      image: "assets/technology.png",
      author: "Valeria Montes",
      date: "Hace 4 horas",
      readTime: "4 min de lectura",
      trending: false
    },
    {
      id: "mx-4",
      category: "Entretenimiento",
      title: "Mariachi femenil encabeza festival de folklore mexicano en el Palacio de Bellas Artes",
      deck: "La agrupación rompe barreras de género en la música tradicional y celebra una emotiva presentación a sala llena en el máximo recinto cultural de la nación.",
      content: `En una noche llena de gala, color y música vibrante, el Palacio de Bellas Artes se vistió de fiesta con la presentación estelar de un mariachi compuesto enteramente por mujeres, marcando un hito en la difusión de la música tradicional de Jalisco.

El ensamble interpretó clásicos del repertorio nacional con arreglos contemporáneos que cautivaron a los más de dos mil asistentes. La presentación contó además con la participación de bailarines folklóricos de diversos estados de la república.

\"Queremos mostrar que el mariachi es parte de nuestro ADN sin distinción de género, aportando nuestra propia sensibilidad artística a las grandes canciones de nuestra historia\", comentó la directora del grupo musical.`,
      image: "assets/mexico_hero.png",
      author: "Héctor Juárez",
      date: "Hace 6 horas",
      readTime: "3 min de lectura",
      trending: false
    },
    {
      id: "mx-5",
      category: "Economía",
      title: "El peso mexicano mantiene su firmeza impulsado por flujos récord de remesas y turismo",
      deck: "La divisa nacional se sitúa en niveles destacados frente al dólar debido a la estabilidad macroeconómica y el continuo flujo de inversión extranjera directa.",
      content: `El comportamiento macroeconómico de México continúa sorprendiendo a los analistas financieros internacionales. Al cierre de la jornada bursátil, la moneda nacional mostró una apreciación sólida impulsada por los constantes flujos monetarios provenientes del exterior.

Tanto el turismo internacional en destinos clave como Cancún y Los Cabos, como la llegada récord de divisas de los trabajadores en el extranjero, actúan como amortiguadores ante las fluctuaciones del mercado global.

Expertos del Banco de México señalan que esta fortaleza beneficia las importaciones de insumos industriales, aunque vigilan de cerca el impacto en la competitividad de las exportaciones manufactureras.`,
      image: "assets/mexico_hero.png",
      author: "Patricia Mendoza",
      date: "Ayer",
      readTime: "4 min de lectura",
      trending: true
    }
  ]
};
