export class NicknameGenerator {
  private static readonly adjectives = [
    // Positive adjectives
    'Happy',
    'Sunny',
    'Bright',
    'Swift',
    'Smart',
    'Clever',
    'Quick',
    'Brave',
    'Jolly',
    'Merry',
    'Cheerful',
    'Witty',
    'Lucky',
    'Magic',
    'Golden',
    'Silver',
    'Crystal',
    'Diamond',
    'Sparkling',
    'Shining',
    'Glowing',
    'Radiant',

    // Funny adjectives
    'Silly',
    'Funny',
    'Crazy',
    'Wild',
    'Wacky',
    'Zany',
    'Quirky',
    'Peppy',
    'Bouncy',
    'Bubbly',
    'Giggly',
    'Tickled',
    'Dizzy',
    'Snappy',
    'Zippy',

    // Colors
    'Red',
    'Blue',
    'Green',
    'Purple',
    'Orange',
    'Pink',
    'Violet',
    'Coral',
    'Crimson',
    'Azure',
    'Emerald',
    'Amber',
    'Ruby',
    'Sapphire',

    // Sizes/Shapes
    'Tiny',
    'Big',
    'Giant',
    'Mini',
    'Mega',
    'Super',
    'Ultra',
    'Mighty',
    'Little',
    'Huge',
    'Massive',
    'Petite',
    'Jumbo',

    // Natural
    'Misty',
    'Stormy',
    'Windy',
    'Frosty',
    'Snowy',
    'Rainy',
    'Cloudy',
    'Thunder',
    'Lightning',
    'Starry',
    'Moonlit',
    'Solar',
  ];

  private static readonly nouns = [
    // Animals
    'Tiger',
    'Lion',
    'Bear',
    'Wolf',
    'Fox',
    'Cat',
    'Dog',
    'Rabbit',
    'Panda',
    'Koala',
    'Penguin',
    'Dolphin',
    'Owl',
    'Eagle',
    'Hawk',
    'Falcon',
    'Swan',
    'Butterfly',
    'Dragonfly',
    'Unicorn',
    'Dragon',
    'Phoenix',
    'Pegasus',

    // Food (funny)
    'Cookie',
    'Muffin',
    'Cupcake',
    'Donut',
    'Pretzel',
    'Waffle',
    'Pancake',
    'Pizza',
    'Taco',
    'Burger',
    'Hotdog',
    'Sandwich',
    'Bagel',
    'Croissant',

    // Objects
    'Rocket',
    'Star',
    'Moon',
    'Sun',
    'Planet',
    'Comet',
    'Galaxy',
    'Nebula',
    'Crystal',
    'Diamond',
    'Pearl',
    'Gem',
    'Crown',
    'Castle',
    'Tower',

    // Professions/Roles (funny)
    'Ninja',
    'Pirate',
    'Knight',
    'Wizard',
    'Mage',
    'Hero',
    'Champion',
    'Master',
    'Captain',
    'Admiral',
    'Baron',
    'Duke',
    'Prince',
    'King',

    // Natural
    'Mountain',
    'River',
    'Ocean',
    'Forest',
    'Garden',
    'Meadow',
    'Valley',
    'Canyon',
    'Volcano',
    'Island',
    'Desert',
    'Jungle',
    'Prairie',

    // Music/Art
    'Melody',
    'Harmony',
    'Rhythm',
    'Beat',
    'Tune',
    'Song',
    'Dance',
    'Painter',
    'Artist',
    'Poet',
    'Writer',
    'Composer',

    // Funny words
    'Pickle',
    'Bubble',
    'Sparkle',
    'Giggle',
    'Whistle',
    'Jingle',
    'Wiggle',
    'Bounce',
    'Zoom',
    'Flash',
    'Dash',
    'Splash',
    'Crash',
    'Bang',
  ];

  /**
   * Generates a random nickname
   */
  private static generateRandomNickname(): string {
    const adjective = this.getRandomElement(this.adjectives);
    const noun = this.getRandomElement(this.nouns);
    const number = Math.floor(Math.random() * 9999) + 1;

    return `${adjective}${noun}${number}`;
  }

  /**
   * Generates a nickname using parts of the first and last name
   */
  public static generateNickname(firstName?: string, lastName?: string): string {
    if (!firstName && !lastName) {
      return this.generateRandomNickname();
    }

    const cleanFirstName = firstName ? this.sanitizeName(firstName) : '';
    const cleanLastName = lastName ? this.sanitizeName(lastName) : '';

    if (!cleanFirstName && !cleanLastName) {
      return this.generateRandomNickname();
    }

    const strategies = [
      // The first 3-4 letters of the name + a random number
      () => {
        const name = cleanFirstName || cleanLastName;
        const prefix = name.slice(0, Math.min(4, name.length));
        const number = Math.floor(Math.random() * 9999) + 1;
        return `${prefix}${number}`;
      },

      // First letters of first and last name + funny word
      () => {
        if (cleanFirstName && cleanLastName) {
          const initials = cleanFirstName.charAt(0) + cleanLastName.charAt(0);
          const noun = this.getRandomElement(this.nouns);
          const number = Math.floor(Math.random() * 99) + 1;
          return `${initials}${noun}${number}`;
        }
        return null;
      },

      // Name + adjective
      () => {
        const name = cleanFirstName || cleanLastName;
        const shortName = name.slice(0, 6);
        const adjective = this.getRandomElement(this.adjectives);
        const number = Math.floor(Math.random() * 99) + 1;
        return `${shortName}${adjective}${number}`;
      },

      // Reverse: adjective + name
      () => {
        const name = cleanFirstName || cleanLastName;
        const shortName = name.slice(0, 5);
        const adjective = this.getRandomElement(this.adjectives);
        const number = Math.floor(Math.random() * 99) + 1;
        return `${adjective}${shortName}${number}`;
      },
    ];

    // Select a random strategy
    const strategy = this.getRandomElement(strategies);
    const result = strategy();

    return result || this.generateRandomNickname();
  }

  /**
   * Generates multiple login options
   */
  public static generateMultipleLogins(firstName?: string, lastName?: string): string[] {
    const logins = new Set<string>();

    const cleanFirstName = firstName ? this.sanitizeName(firstName).toLowerCase() : '';
    const cleanLastName = lastName ? this.sanitizeName(lastName).toLowerCase() : '';

    if (!cleanFirstName && !cleanLastName) {
      return this.generateRandomLogins(7);
    }

    // All login generation strategies for first/last name cases
    const strategies = [
      // First 3 letters of the name + digit
      () => {
        const name = cleanFirstName || cleanLastName;
        const prefix = name.slice(0, 3);
        const digit = Math.floor(Math.random() * 10);
        return `${prefix}${digit}`;
      },

      // First letters of first and last name + animal in lowercase
      () => {
        const animals = ['cat', 'fox', 'owl', 'bear', 'wolf', 'lion', 'hawk'];
        const initials = (cleanFirstName.charAt(0) || '') + (cleanLastName.charAt(0) || '');
        const animal = this.getRandomElement(animals);
        const digit = Math.floor(Math.random() * 10);
        return `${initials}_${animal}${digit}`;
      },

      // Part of the name + color
      () => {
        const colors = ['red', 'blue', 'gold', 'green', 'silver'];
        const name = cleanFirstName || cleanLastName;
        const namePrefix = name.slice(0, 2);
        const color = this.getRandomElement(colors);
        const digit = Math.floor(Math.random() * 10);
        return `${namePrefix}_${color}${digit}`;
      },

      // Part of the name + funny food
      () => {
        const foods = ['pizza', 'taco', 'cookie', 'donut', 'cake'];
        const name = cleanFirstName || cleanLastName;
        const namePrefix = name.slice(0, 2);
        const food = this.getRandomElement(foods);
        return `${namePrefix}_${food}`;
      },

      // Initials + magic words
      () => {
        const magic = ['star', 'moon', 'gem', 'magic', 'spark', 'glow'];
        const initials = (cleanFirstName.charAt(0) || '') + (cleanLastName.charAt(0) || '');
        const magicWord = this.getRandomElement(magic);
        const digit = Math.floor(Math.random() * 10);
        return `${initials}${magicWord}${digit}`;
      },

      // Part of the last name + adjective
      () => {
        if (cleanLastName) {
          const adjectives = ['cool', 'wild', 'fast', 'smart', 'brave', 'quick'];
          const lastName = cleanLastName.slice(0, 3);
          const adj = this.getRandomElement(adjectives);
          const digit = Math.floor(Math.random() * 10);
          return `${adj}_${lastName}${digit}`;
        }
        return null;
      },

      // Mix of letters from first and last name + animal
      () => {
        if (cleanFirstName && cleanLastName) {
          const animals = ['cat', 'fox', 'owl', 'dog', 'bear'];
          const mix = cleanFirstName.charAt(0) + cleanLastName.charAt(1) + cleanFirstName.charAt(1);
          const animal = this.getRandomElement(animals);
          return `${mix}_${animal}`;
        }
        return null;
      },
    ];

    // First, we generate one login from each working strategy
    const validStrategies = strategies.filter((strategy) => {
      const result = strategy();
      return result !== null && result.length > 0;
    });

    // Adding one login from each strategy
    validStrategies.forEach((strategy) => {
      if (logins.size < strategies.length) {
        const login = strategy();
        if (login && login.length > 0) {
          logins.add(login);
        }
      }
    });

    // If more logins are needed, add random ones from all strategies
    while (logins.size < strategies.length) {
      const strategy = this.getRandomElement(validStrategies);
      const login = strategy();
      if (login && login.length > 0) {
        logins.add(login);
      }
    }

    return Array.from(logins);
  }

  /**
   * Generates a list of diverse random logins
   * Uses all available strategies to maximize diversity
   */
  private static generateRandomLogins(count: number): string[] {
    const logins = new Set<string>();

    // All strategies for generating random logins
    const strategies = [
      // Animal + number (tiger5, fox3)
      () => {
        const animals = [
          'tiger',
          'lion',
          'bear',
          'wolf',
          'fox',
          'cat',
          'dog',
          'owl',
          'hawk',
          'swan',
        ];
        const animal = this.getRandomElement(animals);
        const digit = Math.floor(Math.random() * 10);
        return `${animal}${digit}`;
      },

      // Animal with underscore + number (tiger_5, fox_3)
      () => {
        const animals = [
          'tiger',
          'lion',
          'bear',
          'wolf',
          'fox',
          'cat',
          'dog',
          'owl',
          'hawk',
          'swan',
        ];
        const animal = this.getRandomElement(animals);
        const digit = Math.floor(Math.random() * 10);
        return `${animal}_${digit}`;
      },

      // Adjective + animal (red_cat, blue_fox)
      () => {
        const colors = ['red', 'blue', 'green', 'gold', 'silver'];
        const animals = ['cat', 'fox', 'owl', 'bear', 'wolf'];
        const color = this.getRandomElement(colors);
        const animal = this.getRandomElement(animals);
        return `${color}_${animal}`;
      },

      // Short adjective + animal + number (big_cat5, red_fox3)
      () => {
        const adjectives = ['big', 'red', 'blue', 'wild', 'cool', 'hot', 'fast'];
        const animals = ['cat', 'fox', 'owl', 'dog', 'wolf'];
        const adjective = this.getRandomElement(adjectives);
        const animal = this.getRandomElement(animals);
        const digit = Math.floor(Math.random() * 10);
        return `${adjective}_${animal}${digit}`;
      },

      // Food + number (pizza3, taco7)
      () => {
        const foods = ['pizza', 'taco', 'cookie', 'donut', 'waffle'];
        const food = this.getRandomElement(foods);
        const digit = Math.floor(Math.random() * 10);
        return `${food}${digit}`;
      },

      // Color + food (red_pizza, blue_taco)
      () => {
        const colors = ['red', 'blue', 'green', 'gold'];
        const foods = ['pizza', 'taco', 'cookie', 'donut'];
        const color = this.getRandomElement(colors);
        const food = this.getRandomElement(foods);
        return `${color}_${food}`;
      },

      // Magical words + number (star7, moon2)
      () => {
        const magic = ['star', 'moon', 'gem', 'magic', 'spark', 'glow'];
        const word = this.getRandomElement(magic);
        const digit = Math.floor(Math.random() * 10);
        return `${word}${digit}`;
      },
    ];

    // First, add one login from each strategy
    strategies.forEach((strategy) => {
      if (logins.size < count) {
        const login = strategy();
        logins.add(login);
      }
    });

    // If more logins are needed, add random ones from all strategies
    while (logins.size < count) {
      const strategy = this.getRandomElement(strategies);
      const login = strategy();
      logins.add(login);
    }

    return Array.from(logins).slice(0, count);
  }

  /**
   * Generates a random short login
   */
  private static generateRandomLogin(): string {
    const strategies = [
      // Animal + number (tiger5, fox3)
      () => {
        const animals = [
          'tiger',
          'lion',
          'bear',
          'wolf',
          'fox',
          'cat',
          'dog',
          'owl',
          'hawk',
          'swan',
        ];
        const animal = this.getRandomElement(animals);
        const digit = Math.floor(Math.random() * 10);
        return `${animal}${digit}`;
      },

      // Animal with underscore + number (tiger_5, fox_3)
      () => {
        const animals = [
          'tiger',
          'lion',
          'bear',
          'wolf',
          'fox',
          'cat',
          'dog',
          'owl',
          'hawk',
          'swan',
        ];
        const animal = this.getRandomElement(animals);
        const digit = Math.floor(Math.random() * 10);
        return `${animal}_${digit}`;
      },

      // Adjective + animal (red_cat, blue_fox)
      () => {
        const colors = ['red', 'blue', 'green', 'gold', 'silver'];
        const animals = ['cat', 'fox', 'owl', 'bear', 'wolf'];
        const color = this.getRandomElement(colors);
        const animal = this.getRandomElement(animals);
        return `${color}_${animal}`;
      },

      // Short adjective + animal + number (big_cat5, red_fox3)
      () => {
        const adjectives = ['big', 'red', 'blue', 'wild', 'cool', 'hot', 'fast'];
        const animals = ['cat', 'fox', 'owl', 'dog', 'wolf'];
        const adjective = this.getRandomElement(adjectives);
        const animal = this.getRandomElement(animals);
        const digit = Math.floor(Math.random() * 10);
        return `${adjective}_${animal}${digit}`;
      },

      // Food + number (pizza3, taco7)
      () => {
        const foods = ['pizza', 'taco', 'cookie', 'donut', 'waffle'];
        const food = this.getRandomElement(foods);
        const digit = Math.floor(Math.random() * 10);
        return `${food}${digit}`;
      },

      // 3 random letters + a number (for variety)
      () => {
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        const chars = Array.from({ length: 3 }, () =>
          letters.charAt(Math.floor(Math.random() * letters.length)),
        ).join('');
        const digit = Math.floor(Math.random() * 10);
        return `${chars}${digit}`;
      },

      // Vowel + consonant + consonant + number
      () => {
        const vowels = 'aeiou';
        const consonants = 'bcdfghjklmnpqrstvwxyz';
        const vowel = vowels.charAt(Math.floor(Math.random() * vowels.length));
        const cons1 = consonants.charAt(Math.floor(Math.random() * consonants.length));
        const cons2 = consonants.charAt(Math.floor(Math.random() * consonants.length));
        const digit = Math.floor(Math.random() * 10);
        return `${vowel}${cons1}${cons2}${digit}`;
      },
    ];

    const strategy = this.getRandomElement(strategies);
    return strategy();
  }

  /**
   * Cyrillic to Latin transliteration map
   */
  private static readonly transliterationMap: { [key: string]: string } = {
    а: 'a',
    А: 'A',
    б: 'b',
    Б: 'B',
    в: 'v',
    В: 'V',
    г: 'g',
    Г: 'G',
    д: 'd',
    Д: 'D',
    е: 'e',
    Е: 'E',
    ё: 'yo',
    Ё: 'Yo',
    ж: 'zh',
    Ж: 'Zh',
    з: 'z',
    З: 'Z',
    и: 'i',
    И: 'I',
    й: 'y',
    Й: 'Y',
    к: 'k',
    К: 'K',
    л: 'l',
    Л: 'L',
    м: 'm',
    М: 'M',
    н: 'n',
    Н: 'N',
    о: 'o',
    О: 'O',
    п: 'p',
    П: 'P',
    р: 'r',
    Р: 'R',
    с: 's',
    С: 'S',
    т: 't',
    Т: 'T',
    у: 'u',
    У: 'U',
    ф: 'f',
    Ф: 'F',
    х: 'h',
    Х: 'H',
    ц: 'ts',
    Ц: 'Ts',
    ч: 'ch',
    Ч: 'Ch',
    ш: 'sh',
    Ш: 'Sh',
    щ: 'sch',
    Щ: 'Sch',
    ъ: '',
    Ъ: '',
    ы: 'y',
    Ы: 'Y',
    ь: '',
    Ь: '',
    э: 'e',
    Э: 'E',
    ю: 'yu',
    Ю: 'Yu',
    я: 'ya',
    Я: 'Ya',
  };

  /**
   * Transliterates Cyrillic to Latin
   */
  private static transliterate(text: string): string {
    return text
      .split('')
      .map((char) => this.transliterationMap[char] || char)
      .join('');
  }

  private static sanitizeName(name: string): string {
    let sanitized = this.transliterate(name);
    sanitized = sanitized.replace(/[^a-zA-Z0-9]/g, '');
    return sanitized.slice(0, 15);
  }

  private static getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}
