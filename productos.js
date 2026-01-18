// products.js
window.KIMCHI_PRODUCTS = [
  
  { 
    id:"promo_akusay_tofu",
    name:"1 Kimchi Akusay + 1 Kimchi Tofu", 
    price:35000, 
    category:"Promo", 
    bestSeller:true,

    short:"............", 
    long:"............", 
    
    image:"img/productos/.png",
  },
  { 
    id:"promo_2_iguales",
    name:"2 Kimchis Iguales", 
    price:35000, 
    category:"Promo", 
    bestSeller:false,

    short:"Excluye ediciones especiales.", 
    long:"Excluye ediciones especiales.", 
    
    image:"img/productos/.png",
  },
  { 
    id:"promo_3_kimchis",
    name:"3 Kimchis", 
    price:50000, 
    category:"Promo", 
    bestSeller:false,

    short:"Combinarlos como quieras! Excluye ediciones especiales.", 
    long:"Combinarlos como quieras! Excluye ediciones especiales.", 
    
    image:"img/productos/.png",
  },
  { 
    id:"promo_3_salsas",
    name:"3 Salsas", 
    price:40000, 
    category:"Promo", 
    bestSeller:false,

    short:"Combinarlas como quieras!", 
    long:"Combinarlas como quieras!", 
    
    image:"img/productos/.png",
  },

  {
  id: "Akusay picante",
  name: "Kimchi de Akusay",
  price: 20000,
  category: "Picante",
  bestSeller: true,

  short: "Akusay, Zanahoria, Cebolla, Cebolla de Verdeo, Gochujang Vegano.",
  long: "Akusay, Zanahoria, Cebolla, Cebolla de Verdeo, Gochujang Vegano.",

  image: "img/productos/fotopicanteakusay.png",

  info: {
    fermentacion: "10 – 15 días",

    nivelPicante: 4,

    beneficios: [
      "Fuente de vitaminas A, B1, B2, C y E",
      "Fortalece el sistema inmunológico",
      "Aporta probióticos que favorecen el sistema digestivo",
      "Propiedades antiinflamatorias",
      "Regula la flora intestinal",
      "Alto contenido en fibra"
    ]
    }
  },
  {
  id: "Nabo picante",
  name: "Kimchi de Nabo",
  price: 20000,
  category: "Picante",
  bestSeller: true,

  short: "Nabo, Cebolla, Zanahoria, Verdeo, Ajo, Jengibre, Pasta de Kimchi.",
  long: "Nabo, Cebolla, Zanahoria, Verdeo, Ajo, Jengibre, Pasta de Kimchi.",

  image: "img/productos/fotopicantenabo.png",

  info: {
    fermentacion: "10 – 15 días",

    nivelPicante: 5,

    beneficios: [
      "Fuente de vitaminas B6, B2, C y K",
      "Fuente de magnesio, calcio y potasio",
      "Fortalece el sistema inmunológico",
      "Aporta probióticos que favorecen el sistema digestivo",
      "Propiedades antiinflamatorias",
      "Regula la flora intestinal",
      "Alto contenido en fibra"
    ]
    }
  },
  {
  id: "Anana picante",
  name: "Kimchi de Anana",
  price: 20000,
  category: "Picante",
  bestSeller: false,

  short: "Anana, Cebolla Morada, Verdeo, Ajo, Jengibre, Pasta de Kimchi.",
  long: "Anana, Cebolla Morada, Verdeo, Ajo, Jengibre, Pasta de Kimchi.",

  image: "img/productos/fotopicanteanana.png",

  info: {
    fermentacion: "5 días",

    nivelPicante: 3,

    beneficios: [
      "Fuente de vitaminas A, B1, B2, C y K",
      "Fuente de calcio, potasio, hierro y ácido fólico",
      "Fortalece el sistema inmunológico",
      "Aporta probióticos que favorecen el sistema digestivo",
      "Propiedades antiinflamatorias",
      "Regula la flora intestinal",
      "Alto contenido en fibra",
      "Favorece la producción de ornitina, relacionada con el rendimiento físico",
      "Favorece el equilibrio hormonal",
      "Ayuda a la desintoxicación del organismo y protege el hígado",
      "Contribuye a la producción de citrulina, mejorando la circulación sanguínea",
      "Favorece la recuperación de los tejidos",
      "Mejora la sensibilidad a la insulina"
      ]
    }
  },
  {
  id: "Sandia picante",
  name: "Kimchi de Sandia",
  price: 20000,
  category: "Picante",
  bestSeller: false,

  short: "Sandia, Cebolla Morada, Cilantro, Verdeo, Ajo, Jengibre y Pasta de Kimchi.",
  long: "Sandia, Cebolla Morada, Cilantro, Verdeo, Ajo, Jengibre y Pasta de Kimchi.",

  image: "img/productos/fotopicantesandia.png",

  info: {
    fermentacion: "4 días",

    nivelPicante: 2,

    beneficios: [
      "Fuente de vitaminas A, B1, B2, C y K",
      "Fuente de magnesio, potasio y hierro",
      "Fortalece el sistema inmunológico",
      "Aporta probióticos que favorecen el sistema digestivo",
      "Propiedades antiinflamatorias",
      "Regula la flora intestinal",
      "Alto contenido en fibra",
      "Favorece la producción de citrulina, ayudando a reducir la presión arterial",
      "Mejora el flujo sanguíneo",
      "Favorece la recuperación de los tejidos",
      "Mejora la sensibilidad a la insulina"
      ]
    }
  },
  {
  id: "Pera picante",
  name: "Kimchi de Pera",
  price: 20000,
  category: "Picante",
  bestSeller: false,

  short: "Pera, Manzana Verde, Cebolla, Verdeo, Ajo, Jengibre y Pasta de Kimchi.",
  long: "Pera, Manzana Verde, Cebolla, Verdeo, Ajo, Jengibre y Pasta de Kimchi.",

  image: "img/productos/fotopicantepera.png",

  info: {
    fermentacion: "5 días",

    nivelPicante: 1,

    beneficios: [
      "Fuente de vitaminas A, B, C y K",
      "Fuente de magnesio, potasio, hierro y yodo",
      "Fortalece el sistema inmunológico",
      "Aporta probióticos que favorecen el sistema digestivo",
      "Propiedades antiinflamatorias",
      "Regula la flora intestinal",
      "Alto contenido en fibra",
      "Ayuda a mantener la salud de la glándula tiroides"
    ]
  },  
  },
  {
  id: "Pepino picante",
  name: "Kimchi de Pepino",
  price: 20000,
  category: "Picante",
  bestSeller: false,

  short: "Pepino, Cebolla Morada, Zanahoria, Verdeo, Ajo, Jengibre y Pasta de Kimchi.",
  long: "Pepino, Cebolla Morada, Zanahoria, Verdeo, Ajo, Jengibre y Pasta de Kimchi.",

  image: "img/productos/fotopicantepepino.png",

  info: {
    fermentacion: "5 días",

    nivelPicante: 3,

    beneficios: [
      "Fuente de vitaminas A, B, C y K",
      "Fuente de magnesio, potasio y hierro",
      "Fortalece el sistema inmunológico",
      "Aporta probióticos que favorecen el sistema digestivo",
      "Propiedades antiinflamatorias",
      "Regula la flora intestinal",
      "Alto contenido en fibra",
      "Contiene lignanos que pueden ayudar a reducir el riesgo de enfermedades coronarias",
      "Puede contribuir a la prevención de osteoporosis",
      "Puede ayudar a reducir el riesgo de cáncer de mama, ovario, útero y próstata"
      ]
    }
  },
  {
  id: "Remolacha picante",
  name: "Kimchi de Remolacha",
  price: 20000,
  category: "Picante",
  bestSeller: true,

  short: "Remolacha, Nabo, Cebolla, Ajo, Jengibre y Pasta de Kimchi.",
  long: "Remolacha, Nabo, Cebolla, Ajo, Jengibre y Pasta de Kimchi.",

  image: "img/productos/fotopicanteremolacha.png",

  info: {
    fermentacion: "5 días",

    nivelPicante: 1,

    beneficios: [
      "Fuente de vitaminas A, C, B1, B2 y Folatos",
      "Fuente de Magnesio, Fósforo, Potasio, Calcio, Zinc y Hierro",
      "Fortalece el sistema inmunológico",
      "Fuente de Probióticos que favorecen el sistema digestivo, Antiinflamatorio y Antioxidante",
      "Propiedades antiinflamatorias",
      "Regula la flora intestinal",
      "Alto contenido en fibra",
      "Favorece la producción de ornitina, relacionada con el rendimiento físico",
      "Favorece el equilibrio hormonal",
      "Ayuda a la desintoxicación del organismo y protege el hígado",
      "Contribuye a la producción de citrulina, mejorando la circulación sanguínea",
      "Favorece la recuperación de los tejidos",
      "Mejora la sensibilidad a la insulina"
      ]
    }
  },

  { 
    id:"Akusay No picante",
    name:"Kimchi de Akusay Blanco", 
    price:20000, 
    category:"Sin picante", 
    bestSeller: true,

    short:"Akusay, Zanahoria, Cebolla, Cebolla de Verdeo, Gochujang Vegano Blanco", 
    long:"Akusay, Zanahoria, Cebolla, Cebolla de Verdeo, Gochujang Vegano Blanco", 
    
    image:"img/productos/fotopicanteakusay.png",

    info: {
    fermentacion: "10 - 15 días",

    beneficios: [
      "Fuente de vitaminas A, B1, B2, C y E",
      "Fortalece el sistema inmunológico",
      "Aporta probióticos que favorecen el sistema digestivo",
      "Propiedades antiinflamatorias",
      "Regula la flora intestinal",
      "Alto contenido en fibra"
      ]
    }
  },
  { 
    id:"Pera No picante",
    name:"Kimchi de Pera", 
    price:20000, 
    category:"Sin picante", 
    bestSeller:false,

    short:"Pera, Manzana Verde, Cebolla, Cebolla de Verdeo, Gochujang Vegano Blanco", 
    long:"Pera, Manzana Verde, Cebolla, Cebolla de Verdeo, Gochujang Vegano Blanco", 
    
    image:"img/productos/fotopicantepera.png",

    info: {
    fermentacion: "5 días",

    beneficios: [
      "Fuente de vitaminas A, B, C y K",
      "Fuente de magnesio, potasio, hierro y yodo",
      "Fortalece el sistema inmunológico",
      "Aporta probióticos que favorecen el sistema digestivo",
      "Propiedades antiinflamatorias",
      "Regula la flora intestinal",
      "Alto contenido en fibra",
      "Ayuda a mantener la salud de la glándula tiroides"
      ]
    }
  },
  { 
    id:"Remolacha No picante",
    name:"Kimchi de Remolacha", 
    price:20000, 
    category:"Sin picante", 
    bestSeller:false,

    short:"Remolacha, Nabo, Cebolla, Gochujang Vegano, Blanco", 
    long:"Remolacha, Nabo, Cebolla, Gochujang Vegano, Blanco", 
    
    image:"img/productos/fotopicanteremolacha.png",

    info: {
    fermentacion: "5 días",

    beneficios: [
      "Fuente de vitaminas A, C, B1, B2 y Folatos",
      "Fuente de Magnesio, Fósforo, Potasio, Calcio, Zinc y Hierro",
      "Fortalece el sistema inmunológico",
      "Fuente de Probióticos que favorecen el sistema digestivo, Antiinflamatorio y Antioxidante",
      "Propiedades antiinflamatorias",
      "Regula la flora intestinal",
      "Alto contenido en fibra",
      "Favorece la producción de ornitina, relacionada con el rendimiento físico",
      "Favorece el equilibrio hormonal",
      "Ayuda a la desintoxicación del organismo y protege el hígado",
      "Contribuye a la producción de citrulina, mejorando la circulación sanguínea",
      "Favorece la recuperación de los tejidos",
      "Mejora la sensibilidad a la insulina"
      ]
    }
  },
  { 
    id:"Tofu",
    name:"Kimchi de Tofu", 
    price:25000, 
    category:"Especiales", 
    bestSeller:false,

    short:"Tofu Orgánico, Cebolla de Verdeo, Gochujang Vegano", 
    long:"Tofu Orgánico, Cebolla de Verdeo, Gochujang Vegano", 
    
    image:"img/productos/.png",

    info: {
    fermentacion: "....... días",

    beneficios: [
      ".......",
      ".......",
      ".......",
      ".......",
      ".......",
      ".......",
      ".......",
      ".......",
      ".......",
      ".......",
      ".......",
      "......."
      ]
    }
  },
  { 
    id:"Loto",
    name:"Kimchi de Loto", 
    price:25000, 
    category:"Especiales", 
    bestSeller:false,

    short:"Raíz de Loto, Zanahoria, Cebolla, Cebolla de Verdeo, Gochujang Vegano", 
    long:"Raíz de Loto, Zanahoria, Cebolla, Cebolla de Verdeo, Gochujang Vegano", 
    
    image:"img/productos/.png",

    info: {
    fermentacion: "....... días",

    beneficios: [
      ".......",
      ".......",
      ".......",
      ".......",
      ".......",
      ".......",
      ".......",
      ".......",
      ".......",
      ".......",
      ".......",
      "......."
      ]
    }
  },
  { 
    id:"Loto blanco",
    name:"Kimchi de Loto Blanco", 
    price:25000, 
    category:"Especiales", 
    bestSeller:false,

    short:"Raíz de Loto, Zanahoria, Cebolla, Cebolla de Verdeo, Gochujang Vegano Blanco", 
    long:"Raíz de Loto, Zanahoria, Cebolla, Cebolla de Verdeo, Gochujang Vegano Blanco", 
    
    image:"img/productos/.png",

    info: {
    fermentacion: "....... días",

    beneficios: [
      ".......",
      ".......",
      ".......",
      ".......",
      ".......",
      ".......",
      ".......",
      ".......",
      ".......",
      ".......",
      ".......",
      "......."
      ]
    }
  },

  { 
    id:"Salsa Konchi",
    name:"Salsa Konchi", 
    price:15000, 
    category:"Salsas", 
    bestSeller:false,

    short:"Ají Putí Parió, Vinagre de Alcohol", 
    long:"Ají Putí Parió, Vinagre de Alcohol", 
    
    image:"img/productos/.png",

    info: {
    fermentacion: "Tiene 3 semanas de Fermentación.",

    beneficios: [
      ".......",
      ".......",
      "......."
      ]
    }
  },
  { 
    id:"Salsa Verde",
    name:"Salsa Verde", 
    price:15000, 
    category:"Salsas", 
    bestSeller:true,

    short:"Jalapeño Verde, Tomatillo, Ajo, Vinagre de Alcohol", 
    long:"Jalapeño Verde, Tomatillo, Ajo, Vinagre de Alcohol", 
    
    image:"img/productos/.png",

    info: {
    fermentacion: "Tiene 3 semanas de Fermentación.",

    beneficios: [
      ".......",
      ".......",
      "......."
      ]
    }
  },
  { 
    id:"Salsa Kimchi Honey",
    name:"Salsa Kimchi Honey", 
    price:15000, 
    category:"Salsas", 
    bestSeller:false,

    short:"Jalapeño Amarillo, Jugo de Kimchi, Miel, Vinagre de Alcohol", 
    long:"Jalapeño Amarillo, Jugo de Kimchi, Miel, Vinagre de Alcohol", 
    
    image:"img/productos/.png",

    info: {
    fermentacion: "Tiene 3 semanas de Fermentación.",

    beneficios: [
      ".......",
      ".......",
      "......."
      ]
    }
  },
];
