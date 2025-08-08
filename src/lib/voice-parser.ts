interface ParsedItem {
  name: string;
  quantity: number;
  unit: string;
  confidence: number;
}

interface VoiceParserOptions {
  units?: string[];
  quantityKeywords?: string[];
  itemSeparators?: string[];
}

export class VoiceParser {
  private itemSeparators: string[];

  constructor(options: VoiceParserOptions = {}) {
    this.itemSeparators = options.itemSeparators || [
      "and",
      "also",
      "plus",
      "additionally",
      "next",
      "then",
      "also need",
      "don't forget",
      "remember to get",
      "need to buy",
      "add",
    ];
  }

  /**
   * Parse voice input into structured shopping items
   */
  parseVoiceInput(input: string): ParsedItem[] {
    const normalizedInput = this.normalizeInput(input);
    const items = this.splitIntoItems(normalizedInput);

    return items
      .map((item) => this.parseItem(item))
      .filter((item) => item.name.trim().length > 0);
  }

  /**
   * Normalize input text for better parsing
   */
  private normalizeInput(input: string): string {
    return input
      .toLowerCase()
      .replace(/[^\w\s]/g, " ") // Remove punctuation
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();
  }

  /**
   * Split input into individual items
   */
  private splitIntoItems(input: string): string[] {
    // First, try to split by common separators
    for (const separator of this.itemSeparators) {
      if (input.includes(separator)) {
        return input
          .split(separator)
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
      }
    }

    // If no separators found, treat as single item
    return [input];
  }

  /**
   * Parse a single item string into structured data
   */
  private parseItem(itemText: string): ParsedItem {
    const words = itemText.split(" ");
    let quantity = 1;
    let unit = "pcs";
    let nameWords: string[] = [];
    let confidence = 0.8;

    // Try to extract quantity and unit
    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      // Check for numeric quantities
      const numericQuantity = this.parseNumericQuantity(word);
      if (numericQuantity > 0) {
        quantity = numericQuantity;
        confidence += 0.1;
        continue;
      }

      // Check for word-based quantities
      const wordQuantity = this.parseWordQuantity(word);
      if (wordQuantity > 0) {
        quantity = wordQuantity;
        confidence += 0.1;
        continue;
      }

      // Check for units
      const foundUnit = this.parseUnit(word);
      if (foundUnit) {
        unit = foundUnit;
        confidence += 0.1;
        continue;
      }

      // If not quantity or unit, it's part of the item name
      nameWords.push(word);
    }

    // If no quantity was found, check for "a" or "an" at the beginning
    if (quantity === 1 && nameWords.length > 0) {
      const firstWord = nameWords[0];
      if (firstWord === "a" || firstWord === "an") {
        nameWords = nameWords.slice(1);
        confidence += 0.05;
      }
    }

    // Clean up the item name
    const name = this.cleanItemName(nameWords.join(" "));

    // Adjust confidence based on name quality
    if (name.length < 2) {
      confidence -= 0.3;
    }

    return {
      name,
      quantity: Math.max(1, quantity),
      unit,
      confidence: Math.min(1, Math.max(0, confidence)),
    };
  }

  /**
   * Parse numeric quantities
   */
  private parseNumericQuantity(word: string): number {
    const num = parseInt(word, 10);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Parse word-based quantities
   */
  private parseWordQuantity(word: string): number {
    const quantityMap: Record<string, number> = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
      eleven: 11,
      twelve: 12,
      thirteen: 13,
      fourteen: 14,
      fifteen: 15,
      sixteen: 16,
      seventeen: 17,
      eighteen: 18,
      nineteen: 19,
      twenty: 20,
      thirty: 30,
      forty: 40,
      fifty: 50,
      sixty: 60,
      seventy: 70,
      eighty: 80,
      ninety: 90,
      hundred: 100,
      a: 1,
      an: 1,
      some: 2,
      few: 3,
      several: 5,
      many: 10,
    };

    return quantityMap[word] || 0;
  }

  /**
   * Parse units from text
   */
  private parseUnit(word: string): string | null {
    const unitMap: Record<string, string> = {
      // Pieces
      pieces: "pcs",
      piece: "pcs",
      pcs: "pcs",
      pc: "pcs",
      // Weight
      grams: "g",
      gram: "g",
      g: "g",
      kilograms: "kg",
      kilogram: "kg",
      kg: "kg",
      ounces: "oz",
      ounce: "oz",
      oz: "oz",
      pounds: "lb",
      pound: "lb",
      lb: "lb",
      // Volume
      liters: "L",
      liter: "L",
      l: "L",
      milliliters: "ml",
      milliliter: "ml",
      ml: "ml",
      // Containers
      packs: "pack",
      pack: "pack",
      boxes: "box",
      box: "box",
      bottles: "bottle",
      bottle: "bottle",
      cans: "can",
      can: "can",
      bags: "bag",
      bag: "bag",
      // Food items
      loaves: "loaf",
      loaf: "loaf",
      bunches: "bunch",
      bunch: "bunch",
      heads: "head",
      head: "head",
      cloves: "clove",
      clove: "clove",
      slices: "slice",
      slice: "slice",
      // Cooking
      cups: "cup",
      cup: "cup",
      tablespoons: "tbsp",
      tablespoon: "tbsp",
      tbsp: "tbsp",
      teaspoons: "tsp",
      teaspoon: "tsp",
      tsp: "tsp",
    };

    return unitMap[word] || null;
  }

  /**
   * Clean up item name
   */
  private cleanItemName(name: string): string {
    return name
      .replace(/\b(please|get|buy|need|want|add|also|and|the|of)\b/g, "") // Remove common filler words
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim()
      .replace(/^\w/, (c) => c.toUpperCase()); // Capitalize first letter
  }

  /**
   * Get suggestions for common grocery items
   */
  getSuggestions(partialName: string): string[] {
    const commonItems = [
      "Milk",
      "Bread",
      "Eggs",
      "Bananas",
      "Apples",
      "Chicken",
      "Rice",
      "Pasta",
      "Tomatoes",
      "Onions",
      "Potatoes",
      "Carrots",
      "Lettuce",
      "Cheese",
      "Yogurt",
      "Butter",
      "Oil",
      "Salt",
      "Sugar",
      "Flour",
      "Coffee",
      "Tea",
      "Juice",
      "Water",
      "Soda",
      "Beer",
      "Wine",
      "Cereal",
      "Oatmeal",
      "Nuts",
      "Chips",
      "Cookies",
      "Cake",
      "Ice Cream",
      "Frozen Pizza",
      "Frozen Vegetables",
      "Canned Beans",
      "Canned Tomatoes",
      "Tuna",
      "Salmon",
      "Beef",
      "Pork",
      "Turkey",
      "Ham",
      "Bacon",
      "Sausage",
      "Hot Dogs",
      "Hamburger Buns",
      "Mayonnaise",
      "Ketchup",
      "Mustard",
      "Soy Sauce",
      "Vinegar",
      "Honey",
      "Jam",
      "Peanut Butter",
      "Jelly",
      "Cream Cheese",
      "Sour Cream",
      "Garlic",
      "Ginger",
      "Lemon",
      "Lime",
      "Oranges",
      "Grapes",
      "Strawberries",
      "Blueberries",
      "Raspberries",
      "Pineapple",
      "Mango",
      "Avocado",
      "Cucumber",
      "Bell Peppers",
      "Mushrooms",
      "Spinach",
      "Kale",
      "Broccoli",
      "Cauliflower",
      "Zucchini",
      "Eggplant",
      "Asparagus",
      "Green Beans",
      "Peas",
      "Corn",
      "Sweet Potatoes",
      "Yams",
      "Garlic Bread",
      "Tortillas",
      "Bagels",
      "Croissants",
      "Donuts",
      "Muffins",
      "Pancake Mix",
      "Syrup",
      "Whipped Cream",
      "Chocolate",
      "Candy",
      "Gum",
      "Mints",
      "Vitamins",
      "Medicine",
      "Bandages",
      "Soap",
      "Shampoo",
      "Toothpaste",
      "Toilet Paper",
      "Paper Towels",
      "Napkins",
      "Plastic Bags",
      "Aluminum Foil",
      "Plastic Wrap",
      "Ziploc Bags",
    ];

    if (!partialName) return commonItems.slice(0, 10);

    return commonItems
      .filter((item) => item.toLowerCase().includes(partialName.toLowerCase()))
      .slice(0, 10);
  }
}
