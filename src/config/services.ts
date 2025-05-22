export interface Service {
  id: string;
  name: string;
  price: number;
  description?: string;
  category: 'Wash' | 'Detailing' | 'Additional' | 'Package';
}

export const WASH_SERVICES: Service[] = [
  { 
    id: 'basic_wash', 
    name: 'Basic Wash', 
    price: 15, 
    description: 'Exterior wash and dry.',
    category: 'Wash'
  },
  { 
    id: 'premium_wash', 
    name: 'Premium Wash', 
    price: 30, 
    description: 'Includes basic wash, interior vacuum, and underbody cleaning.',
    category: 'Wash'
  },
  { 
    id: 'detailing_wax', 
    name: 'Detailing: Wax', 
    price: 50, 
    description: 'Hand wax application for shine and protection.',
    category: 'Detailing'
  },
  { 
    id: 'detailing_polish', 
    name: 'Detailing: Polish', 
    price: 60, 
    description: 'Machine polish to remove minor scratches and restore gloss.',
    category: 'Detailing'
  },
  { 
    id: 'detailing_engine', 
    name: 'Detailing: Engine Bay Cleaning', 
    price: 40, 
    description: 'Safe cleaning of the engine bay.',
    category: 'Detailing'
  },
  { 
    id: 'ceramic_coating', 
    name: 'Ceramic Coating', 
    price: 150, 
    description: 'Long-lasting protective coating for paint.',
    category: 'Additional' 
  },
  { 
    id: 'tire_shine', 
    name: 'Tire Shine', 
    price: 10, 
    description: 'Application of tire dressing for a glossy finish.',
    category: 'Additional'
  },
  { 
    id: 'package_basic_plus', 
    name: 'Package: Basic Wash + Tire Shine', 
    price: 22, // 15 + 10 = 25, discounted
    description: 'Basic wash with tire shine application.',
    category: 'Package'
  },
  { 
    id: 'package_premium_detail', 
    name: 'Package: Premium Wash + Wax', 
    price: 75, // 30 + 50 = 80, discounted
    description: 'Premium wash combined with hand wax application.',
    category: 'Package'
  },
];

export const SERVICE_CATEGORIES = ['Wash', 'Detailing', 'Additional', 'Package'] as const;
