import type { Cuisine } from '@repo/shared';

export type ItemTemplate = {
  key: string;
  name: string;
  description: string;
  priceCents: number;
};

export type CategoryTemplate = {
  key: string;
  name: string;
  items: readonly ItemTemplate[];
};

export type CuisineTemplate = {
  names: readonly string[];
  prepMinutes: readonly [min: number, max: number];
  priceLevel: 1 | 2 | 3;
  categories: readonly CategoryTemplate[];
};

function item(key: string, name: string, description: string, priceCents: number): ItemTemplate {
  return { key, name, description, priceCents };
}

export const cuisineTemplates: Record<Cuisine, CuisineTemplate> = {
  pizza: {
    names: [
      'Slice Theory',
      'Crust & Ember',
      'Corner Oven',
      'Dough Republic',
      'Fennel & Flour',
      'Night Owl Pizza',
      'Basil Street Pies',
      'Firebrick Pizza Co.',
    ],
    prepMinutes: [15, 25],
    priceLevel: 2,
    categories: [
      {
        key: 'pizzas',
        name: 'Pizzas',
        items: [
          item('margherita', 'Margherita', 'Tomato, mozzarella, basil', 1650),
          item('pepperoni', 'Pepperoni', 'Tomato, mozzarella, cup-and-char pepperoni', 1850),
          item('veggie', 'Garden', 'Peppers, mushrooms, onion, olives', 1795),
          item('white', 'White Pie', 'Ricotta, garlic, lemon zest', 1895),
        ],
      },
      {
        key: 'sides',
        name: 'Sides',
        items: [
          item('knots', 'Garlic Knots', 'Six knots with marinara', 750),
          item('caesar', 'Caesar Salad', 'Romaine, parmesan, croutons', 995),
          item('soda', 'Sparkling Soda', '12 oz can', 300),
        ],
      },
    ],
  },
  burgers: {
    names: [
      'Patty Lab',
      'Smash Society',
      'Griddle House',
      'Two Bun Diner',
      'Grill Line',
      'Charcoal Corner',
      'Stack & Sauce',
      'The Burger Pantry',
    ],
    prepMinutes: [10, 18],
    priceLevel: 1,
    categories: [
      {
        key: 'burgers',
        name: 'Burgers',
        items: [
          item('classic', 'Classic Smash', 'Two patties, cheese, pickles, house sauce', 1195),
          item('double-bacon', 'Bacon Double', 'Two patties, bacon, cheddar', 1495),
          item('veggie', 'Veggie Burger', 'Black bean patty, avocado', 1250),
          item('chicken', 'Crispy Chicken', 'Buttermilk thigh, slaw', 1295),
        ],
      },
      {
        key: 'sides',
        name: 'Sides and drinks',
        items: [
          item('fries', 'Fries', 'Skin-on, sea salt', 495),
          item('rings', 'Onion Rings', 'Beer-battered', 595),
          item('shake', 'Vanilla Shake', 'Made with soft serve', 650),
        ],
      },
    ],
  },
  mexican: {
    names: [
      'Casa Cilantro',
      'Taqueria Luna Verde',
      'Salsa Roja Kitchen',
      'El Comal Street',
      'Masa & Lime',
      'Tortilla Union',
      'Chile Verde Cantina',
      'Little Elote',
    ],
    prepMinutes: [10, 20],
    priceLevel: 1,
    categories: [
      {
        key: 'mains',
        name: 'Tacos and burritos',
        items: [
          item('al-pastor', 'Al Pastor Tacos', 'Three tacos, pineapple, onion, cilantro', 1150),
          item('carnitas-burrito', 'Carnitas Burrito', 'Rice, beans, salsa verde', 1395),
          item('veggie-bowl', 'Veggie Bowl', 'Grilled vegetables, rice, black beans', 1250),
          item('quesadilla', 'Chicken Quesadilla', 'Flour tortilla, jack cheese', 1195),
        ],
      },
      {
        key: 'sides',
        name: 'Sides',
        items: [
          item('chips', 'Chips and Guacamole', 'Made to order', 795),
          item('elote', 'Elote', 'Grilled corn, cotija, chile', 550),
          item('horchata', 'Horchata', '16 oz', 450),
        ],
      },
    ],
  },
  sushi: {
    names: [
      'Kaze Sushi Bar',
      'Nori House',
      'Wasabi Lane',
      'Sakana Counter',
      'Tsuki Hand Rolls',
      'Blue Fin Kitchen',
      'Umi Table',
      'Kumo Roll',
    ],
    prepMinutes: [18, 30],
    priceLevel: 3,
    categories: [
      {
        key: 'rolls',
        name: 'Rolls',
        items: [
          item('california', 'California Roll', 'Crab, avocado, cucumber', 950),
          item('spicy-tuna', 'Spicy Tuna Roll', 'Tuna, chili mayo, scallion', 1150),
          item('salmon-avocado', 'Salmon Avocado Roll', 'Salmon, avocado', 1095),
          item('dragon', 'Dragon Roll', 'Shrimp tempura, eel, avocado', 1695),
        ],
      },
      {
        key: 'more',
        name: 'Small plates',
        items: [
          item('edamame', 'Edamame', 'Sea salt', 595),
          item('miso', 'Miso Soup', 'Tofu, wakame', 450),
          item('gyoza', 'Pork Gyoza', 'Six pieces', 895),
        ],
      },
    ],
  },
  thai: {
    names: [
      'Lemongrass Corner',
      'Basil & Chili',
      'Siam Night Market',
      'Bangkok Street Kitchen',
      'Coconut Curry House',
      'Thai Orchid Table',
      'Little Lanna',
      'Tamarind Leaf',
    ],
    prepMinutes: [15, 25],
    priceLevel: 2,
    categories: [
      {
        key: 'mains',
        name: 'Noodles and curries',
        items: [
          item('pad-thai', 'Pad Thai', 'Rice noodles, egg, peanuts, tamarind', 1495),
          item('green-curry', 'Green Curry', 'Coconut, Thai basil, bamboo', 1595),
          item('pad-see-ew', 'Pad See Ew', 'Wide noodles, Chinese broccoli', 1495),
          item('basil-chicken', 'Basil Chicken', 'Holy basil, chili, jasmine rice', 1450),
        ],
      },
      {
        key: 'starters',
        name: 'Starters',
        items: [
          item('spring-rolls', 'Spring Rolls', 'Four rolls, sweet chili', 795),
          item('tom-yum', 'Tom Yum Soup', 'Lemongrass, lime, shrimp', 895),
          item('thai-tea', 'Thai Iced Tea', '16 oz', 495),
        ],
      },
    ],
  },
  indian: {
    names: [
      'Saffron Route',
      'Tandoor Lane',
      'Curry Leaf Kitchen',
      'Masala Junction',
      'Spice Bazaar',
      'Chai & Naan',
      'Bombay Bowl',
      'Garam House',
    ],
    prepMinutes: [18, 30],
    priceLevel: 2,
    categories: [
      {
        key: 'mains',
        name: 'Curries',
        items: [
          item('tikka-masala', 'Chicken Tikka Masala', 'Tomato cream sauce, basmati', 1695),
          item('saag-paneer', 'Saag Paneer', 'Spinach, house cheese', 1495),
          item('chana', 'Chana Masala', 'Chickpeas, tomato, ginger', 1295),
          item('lamb-vindaloo', 'Lamb Vindaloo', 'Spicy, vinegar, potato', 1895),
        ],
      },
      {
        key: 'breads',
        name: 'Breads and sides',
        items: [
          item('garlic-naan', 'Garlic Naan', 'From the tandoor', 450),
          item('samosas', 'Vegetable Samosas', 'Two pieces, tamarind chutney', 695),
          item('lassi', 'Mango Lassi', '16 oz', 495),
        ],
      },
    ],
  },
  chinese: {
    names: [
      'Dumpling Theory',
      'Wok & Lantern',
      'Jade Garden Kitchen',
      'Szechuan Pepper House',
      'Noodle Lantern',
      'Lucky Bao',
      'Red Ember Wok',
      'Five Spice Counter',
    ],
    prepMinutes: [12, 22],
    priceLevel: 1,
    categories: [
      {
        key: 'mains',
        name: 'Mains',
        items: [
          item('kung-pao', 'Kung Pao Chicken', 'Peanuts, dried chili, Sichuan pepper', 1450),
          item('beef-broccoli', 'Beef and Broccoli', 'Oyster sauce, garlic', 1595),
          item('mapo-tofu', 'Mapo Tofu', 'Silken tofu, chili bean sauce', 1295),
          item('chow-mein', 'Chicken Chow Mein', 'Egg noodles, cabbage', 1295),
        ],
      },
      {
        key: 'dumplings',
        name: 'Dumplings',
        items: [
          item('xlb', 'Soup Dumplings', 'Six pork dumplings', 1095),
          item('potstickers', 'Potstickers', 'Eight pork and chive', 995),
          item('fried-rice', 'Egg Fried Rice', 'Scallion, egg', 895),
        ],
      },
    ],
  },
  mediterranean: {
    names: [
      'Olive & Za’atar',
      'Pita Republic',
      'Falafel Corner',
      'Aegean Table',
      'Hummus House',
      'Cedar Grill',
      'Levant Kitchen',
      'Fig & Lemon',
    ],
    prepMinutes: [10, 20],
    priceLevel: 2,
    categories: [
      {
        key: 'plates',
        name: 'Plates',
        items: [
          item('chicken-shawarma', 'Chicken Shawarma Plate', 'Rice, salad, garlic sauce', 1595),
          item('falafel-plate', 'Falafel Plate', 'Hummus, tabbouleh, pita', 1395),
          item('lamb-kofta', 'Lamb Kofta Plate', 'Grilled skewers, rice', 1795),
          item('gyro-wrap', 'Gyro Wrap', 'Tzatziki, tomato, onion', 1250),
        ],
      },
      {
        key: 'mezze',
        name: 'Mezze',
        items: [
          item('hummus', 'Hummus and Pita', 'Olive oil, paprika', 795),
          item('baba', 'Baba Ganoush', 'Smoked eggplant', 850),
          item('baklava', 'Baklava', 'Two pieces', 550),
        ],
      },
    ],
  },
  salads: {
    names: [
      'Green Fork',
      'Leaf & Grain',
      'Crisp Bowl Co.',
      'Daily Greens',
      'Harvest Bowl',
      'Root & Sprout',
      'Kale Society',
      'Garden Counter',
    ],
    prepMinutes: [8, 15],
    priceLevel: 2,
    categories: [
      {
        key: 'bowls',
        name: 'Salads and bowls',
        items: [
          item('harvest', 'Harvest Bowl', 'Wild rice, sweet potato, chicken, kale', 1495),
          item('cobb', 'Cobb Salad', 'Egg, bacon, avocado, blue cheese', 1450),
          item('greek', 'Greek Salad', 'Feta, olives, cucumber', 1295),
          item('poke', 'Salmon Grain Bowl', 'Brown rice, edamame, sesame', 1695),
        ],
      },
      {
        key: 'drinks',
        name: 'Drinks',
        items: [
          item('lemonade', 'Mint Lemonade', '16 oz', 450),
          item('juice', 'Green Juice', 'Kale, apple, ginger', 795),
        ],
      },
    ],
  },
  breakfast: {
    names: [
      'Sunny Side Cafe',
      'Morning Griddle',
      'Pancake Parlor',
      'Early Bird Kitchen',
      'Biscuit & Jam',
      'The Toast House',
      'Brunch Club Kitchen',
      'Rise & Dine',
    ],
    prepMinutes: [10, 20],
    priceLevel: 2,
    categories: [
      {
        key: 'plates',
        name: 'Breakfast',
        items: [
          item('pancakes', 'Buttermilk Pancakes', 'Three pancakes, maple syrup', 1195),
          item('breakfast-burrito', 'Breakfast Burrito', 'Eggs, potatoes, cheese, salsa', 1250),
          item('avocado-toast', 'Avocado Toast', 'Sourdough, chili flakes, egg', 1150),
          item('omelette', 'Veggie Omelette', 'Three eggs, toast', 1395),
        ],
      },
      {
        key: 'drinks',
        name: 'Coffee and juice',
        items: [
          item('latte', 'Latte', '12 oz', 525),
          item('oj', 'Fresh Orange Juice', '12 oz', 600),
        ],
      },
    ],
  },
  italian: {
    names: ['Trattoria Lume', 'Pasta Corner', 'Via Sorrento', "Nonna's Table", 'Osteria Nove'],
    prepMinutes: [18, 28],
    priceLevel: 2,
    categories: [
      {
        key: 'pasta',
        name: 'Pasta',
        items: [
          item('spaghetti', 'Spaghetti Pomodoro', 'San Marzano tomato, basil, olive oil', 1695),
          item('carbonara', 'Rigatoni Carbonara', 'Guanciale, egg yolk, pecorino', 1995),
          item('lasagna', 'Lasagna', 'Beef ragù, béchamel, parmesan', 2095),
          item('pesto', 'Trofie al Pesto', 'Basil pesto, green beans, potato', 1795),
        ],
      },
      {
        key: 'starters',
        name: 'Starters',
        items: [
          item('burrata', 'Burrata', 'Tomatoes, basil, grilled bread', 1450),
          item('arancini', 'Arancini', 'Three rice balls, mozzarella, marinara', 1095),
          item('tiramisu', 'Tiramisu', 'Espresso, mascarpone, cocoa', 950),
        ],
      },
    ],
  },
  american: {
    names: [
      'Main Street Diner',
      'Hickory & Co.',
      'Blue Plate Kitchen',
      'Ember Grill',
      'Uptown Eats',
    ],
    prepMinutes: [12, 22],
    priceLevel: 2,
    categories: [
      {
        key: 'mains',
        name: 'Mains',
        items: [
          item('chicken', 'Fried Chicken Plate', 'Three pieces, slaw, biscuit', 1795),
          item('ribs', 'BBQ Half Rack', 'Smoked pork ribs, cornbread', 2395),
          item('sandwich', 'Club Sandwich', 'Turkey, bacon, lettuce, tomato', 1595),
          item('mac', 'Mac and Cheese', 'Three cheeses, toasted crumbs', 1195),
        ],
      },
      {
        key: 'sides',
        name: 'Sides',
        items: [
          item('fries', 'Fries', 'Sea salt', 595),
          item('wings', 'Wings', 'Six pieces, buffalo or BBQ', 1295),
          item('shake', 'Milkshake', 'Vanilla, chocolate or strawberry', 795),
        ],
      },
    ],
  },
  vietnamese: {
    names: [
      'Pho Saigon House',
      'Little Hanoi',
      'Banh Mi Stop',
      'Lotus Noodle Bar',
      'Mekong Kitchen',
    ],
    prepMinutes: [12, 20],
    priceLevel: 1,
    categories: [
      {
        key: 'pho',
        name: 'Pho & Noodles',
        items: [
          item('pho', 'Beef Pho', 'Rare steak, brisket, rice noodles, herbs', 1595),
          item('chicken', 'Chicken Pho', 'Poached chicken, scallion, ginger', 1495),
          item('bun', 'Lemongrass Bun', 'Grilled pork, vermicelli, nuoc cham', 1550),
        ],
      },
      {
        key: 'banhmi',
        name: 'Banh Mi & Rolls',
        items: [
          item('banhmi', 'Classic Banh Mi', 'Pork, pâté, pickled carrot, cilantro', 1095),
          item('rolls', 'Fresh Spring Rolls', 'Shrimp, herbs, peanut sauce', 895),
          item('coffee', 'Vietnamese Iced Coffee', 'Condensed milk', 595),
        ],
      },
    ],
  },
  korean: {
    names: ['Seoul Bowl', 'Gochu House', 'Han River Kitchen', 'Bap & Co.', 'Kimchi Corner'],
    prepMinutes: [15, 25],
    priceLevel: 2,
    categories: [
      {
        key: 'bowls',
        name: 'Bowls',
        items: [
          item('bibimbap', 'Bibimbap', 'Rice, vegetables, egg, gochujang', 1695),
          item('bulgogi', 'Bulgogi Bowl', 'Marinated beef, rice, kimchi', 1895),
          item('tofu', 'Soft Tofu Stew', 'Sundubu, egg, rice', 1595),
        ],
      },
      {
        key: 'sides',
        name: 'Sides',
        items: [
          item('chicken', 'Korean Fried Chicken', 'Half order, soy garlic or spicy', 1695),
          item('mandu', 'Mandu', 'Six pork dumplings', 995),
          item('kimchi', 'Kimchi', 'House-made', 495),
        ],
      },
    ],
  },
  cafe: {
    names: ['Morning Grind', 'Daylight Coffee', 'The Steam Room', 'Cup & Crumb', 'Little Roast'],
    prepMinutes: [6, 12],
    priceLevel: 1,
    categories: [
      {
        key: 'coffee',
        name: 'Coffee',
        items: [
          item('latte', 'Latte', 'Double shot, steamed milk', 575),
          item('cappuccino', 'Cappuccino', 'Double shot, foamed milk', 525),
          item('coldbrew', 'Cold Brew', '16 oz', 550),
        ],
      },
      {
        key: 'bakery',
        name: 'Bakery',
        items: [
          item('croissant', 'Butter Croissant', 'Baked this morning', 450),
          item('sandwich', 'Egg Sandwich', 'Egg, cheddar, tomato jam', 895),
          item('muffin', 'Blueberry Muffin', 'Lemon sugar top', 425),
        ],
      },
    ],
  },
};
