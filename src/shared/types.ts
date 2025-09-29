import z from "zod";

export const AssessmentSchema = z.object({
  user_age: z.number().min(18).max(100),
  user_job: z.string().min(1),
  monthly_budget: z.number().min(100).max(50000),
  preferred_country: z.string().min(1),
  preferred_city: z.string().optional(),
  location_preference: z.enum(['beachside', 'rural', 'city']),
  climate_preference: z.enum(['tropical', 'seasonal', 'dry', 'mediterranean', 'temperate', 'northern']),
  immigration_policies_importance: z.number().min(0).max(5),
  healthcare_importance: z.number().min(0).max(5),
  safety_importance: z.number().min(0).max(5),
  internet_importance: z.number().min(0).max(5),
  emigration_process_importance: z.number().min(0).max(5),
  ease_of_immigration_importance: z.number().min(0).max(5),
  local_acceptance_importance: z.number().min(0).max(5),
});

export type AssessmentType = z.infer<typeof AssessmentSchema>;

export const AssessmentResultSchema = z.object({
  id: z.number(),
  overall_score: z.number().min(0).max(100),
  match_level: z.enum(['poor', 'good', 'very_good', 'perfect']),
  user_age: z.number(),
  user_job: z.string(),
  monthly_budget: z.number(),
  preferred_country: z.string(),
  preferred_city: z.string().nullable(),
  location_preference: z.string(),
  climate_preference: z.string(),
  immigration_policies_importance: z.number(),
  healthcare_importance: z.number(),
  safety_importance: z.number(),
  internet_importance: z.number(),
  emigration_process_importance: z.number(),
  ease_of_immigration_importance: z.number(),
  local_acceptance_importance: z.number(),
  budget_compatibility: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type AssessmentResultType = z.infer<typeof AssessmentResultSchema>;

export const CountryData = {
  countries: [
    'Portugal', 'Spain', 'Mexico', 'Costa Rica', 'Panama', 'Ecuador', 'Colombia',
    'Brazil', 'Argentina', 'Chile', 'Uruguay', 'Thailand', 'Malaysia', 'Philippines',
    'Vietnam', 'Japan', 'South Korea', 'Singapore', 'Australia', 'New Zealand',
    'Canada', 'United Kingdom', 'Ireland', 'Germany', 'France', 'Italy', 'Netherlands',
    'Denmark', 'Sweden', 'Norway', 'Finland', 'Switzerland', 'Austria', 'Belgium',
    'Ghana', 'Liberia', 'Nigeria', 'Morocco'
  ],
  cities: {
    'Portugal': ['Lisbon', 'Porto', 'Faro', 'Braga', 'Coimbra'],
    'Spain': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Bilbao'],
    'Mexico': ['Mexico City', 'Guadalajara', 'Monterrey', 'Cancun', 'Puerto Vallarta'],
    'Costa Rica': ['San José', 'Manuel Antonio', 'Tamarindo', 'Monteverde', 'Jaco'],
    'Panama': ['Panama City', 'Boquete', 'San Carlos', 'El Valle', 'Bocas del Toro'],
    'Ecuador': ['Quito', 'Cuenca', 'Guayaquil', 'Salinas', 'Manta'],
    'Colombia': ['Bogotá', 'Medellín', 'Cartagena', 'Cali', 'Santa Marta'],
    'Brazil': ['São Paulo', 'Rio de Janeiro', 'Salvador', 'Brasília', 'Florianópolis'],
    'Argentina': ['Buenos Aires', 'Mendoza', 'Córdoba', 'Bariloche', 'Salta'],
    'Chile': ['Santiago', 'Valparaíso', 'La Serena', 'Puerto Montt', 'Antofagasta'],
    'Uruguay': ['Montevideo', 'Punta del Este', 'Colonia del Sacramento', 'Maldonado'],
    'Thailand': ['Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya', 'Hua Hin'],
    'Malaysia': ['Kuala Lumpur', 'Penang', 'Johor Bahru', 'Kota Kinabalu', 'Malacca'],
    'Philippines': ['Manila', 'Cebu', 'Davao', 'Baguio', 'Iloilo'],
    'Vietnam': ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hoi An', 'Nha Trang'],
    'Japan': ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Hiroshima'],
    'South Korea': ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Jeju'],
    'Singapore': ['Singapore'],
    'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
    'New Zealand': ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga'],
    'Canada': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'],
    'United Kingdom': ['London', 'Edinburgh', 'Manchester', 'Liverpool', 'Bristol'],
    'Ireland': ['Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford'],
    'Germany': ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'],
    'France': ['Paris', 'Lyon', 'Marseille', 'Nice', 'Toulouse'],
    'Italy': ['Rome', 'Milan', 'Naples', 'Florence', 'Venice'],
    'Netherlands': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven'],
    'Denmark': ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg'],
    'Sweden': ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås'],
    'Norway': ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Drammen'],
    'Finland': ['Helsinki', 'Espoo', 'Tampere', 'Vantaa', 'Turku'],
    'Switzerland': ['Zurich', 'Geneva', 'Basel', 'Bern', 'Lausanne'],
    'Austria': ['Vienna', 'Salzburg', 'Innsbruck', 'Graz', 'Linz'],
    'Belgium': ['Brussels', 'Antwerp', 'Ghent', 'Charleroi', 'Liège'],
    'Ghana': ['Accra', 'Kumasi', 'Tamale', 'Cape Coast', 'Sekondi-Takoradi'],
    'Liberia': ['Monrovia', 'Gbarnga', 'Buchanan', 'Kakata', 'Voinjama'],
    'Nigeria': ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt'],
    'Morocco': ['Casablanca', 'Rabat', 'Marrakech', 'Fez', 'Tangier']
  }
};
