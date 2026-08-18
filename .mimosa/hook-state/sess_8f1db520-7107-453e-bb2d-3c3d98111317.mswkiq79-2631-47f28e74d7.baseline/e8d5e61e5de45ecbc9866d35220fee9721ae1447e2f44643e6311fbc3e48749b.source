export const UNIT_SALE_STATUS = {
  available: {
    mn: 'Нээлттэй',
    en: 'Available',
    color: 'var(--border)',
  },
  reserved: {
    mn: 'Түр хадгалсан',
    en: 'Reserved',
    color: '#F59E0B',
  },
  sold: {
    mn: 'Худалдагдсан',
    en: 'Sold',
    color: '#10B981',
  },
  underFinance: {
    mn: 'Санхүүгийн тооцоо',
    en: 'Under financing',
    color: '#6366F1',
  },
  cancelled: {
    mn: 'Цуцлагдсан',
    en: 'Cancelled',
    color: '#6B7280',
  },
  onHold: {
    mn: 'Түгжсэн',
    en: 'On hold',
    color: '#3B82F6',
  },
};

export const UNIT_LEASE_STATUS = {
  vacant: {
    mn: 'Чөлөөтэй',
    en: 'Vacant',
  },
  reserved: {
    mn: 'Урьдчилсан захиалга',
    en: 'Reserved',
  },
  leased: {
    mn: 'Түрээслэгдсэн',
    en: 'Leased/Occupied',
  },
  leaseExpireSoon: {
    mn: 'Дуусах гэж буй',
    en: 'Lease expire soon',
  },
  leaseRenewal: {
    mn: 'Сунгагдаж буй',
    en: 'Lease renewal',
  },
  underFitout: {
    mn: 'Дотоод тохижилт',
    en: 'Under Fitout',
  },
  cancelled: {
    mn: 'Цуцлагдсан',
    en: 'Cancelled',
  },
  internalUse: {
    mn: 'Дотоод хэрэглээ ',
    en: 'Internal use',
  },
};

export const UNIT_USAGE_TYPE: Record<string, { en: string; mn: string }> = {
  apartment: {
    mn: 'Орон сууц',
    en: 'Apartment',
  },
  residential: {
    mn: 'Амьны орон сууц',
    en: 'Residential house',
  },
  office: {
    mn: 'Оффис',
    en: 'Office',
  },
  serviceArea: {
    mn: 'Үйлчилгээний талбай',
    en: 'Service area',
  },
  parking: {
    mn: 'Авто зогсоол',
    en: 'Parking',
  },
  basement: {
    mn: 'Зоорь',
    en: 'Basement',
  },
  retail: {
    mn: 'Худалдан авах',
    en: 'Retail',
  },

  school: {
    mn: 'Сургууль',
    en: 'School',
  },
  kindergarten: {
    mn: 'Цэцэрлэг',
    en: 'Kindergarten',
  },
  factory: {
    mn: 'Үйлдвэр',
    en: 'Factory',
  },
  hospital: {
    mn: 'Эмнэлэг',
    en: 'Hospital',
  },
  station: {
    mn: 'Буудал',
    en: 'Station',
  },
};

export const UNIT_MARKET_TYPE = {
  forSale: {
    mn: 'Худалдаа',
    en: 'Sale',
  },
  forLease: {
    mn: 'Түрээс',
    en: 'Lease',
  },
};

export const UNIT_AREA_TYPE = {
  private: {
    mn: 'Өөрийн эзэмшлийн талбай',
    en: 'Private Area',
  },
  common: {
    mn: 'Нийтийн эзэмшлийн талбай',
    en: 'Common Area',
  },
};

export const UNIT_ROOM_COUNT = {
  studio: {
    mn: 'Студио',
    en: 'Studio',
  },
  oneBedroom: {
    mn: '1 өрөө',
    en: '1 room',
  },
  twoBedrooms: {
    mn: '2 өрөө',
    en: '2 room',
  },
  threeBedrooms: {
    mn: '3 өрөө',
    en: '3 room',
  },
  fourBedrooms: {
    mn: '4 өрөө',
    en: '4 room',
  },
  fiveOrMoreBedrooms: {
    mn: '5-аас дээш өрөө',
    en: '5 room',
  },
};

export const UNIT_ORIENTATION = {
  north: {
    mn: 'Хойд',
    en: 'North',
  },
  south: {
    mn: 'Өмнө',
    en: 'South',
  },
  east: {
    mn: 'Зүүн',
    en: 'East',
  },
  west: {
    mn: 'Баруун',
    en: 'West',
  },
};

export const UNIT_DOCUMENT_TABS = {
  overview: {
    mn: 'Ерөнхий мэдээлэл',
    en: 'Overview',
  },
  document: {
    mn: 'Документ',
    en: 'Document',
  },
  media: {
    mn: 'Медиа',
    en: 'Media',
  },
  contracts: {
    mn: 'Гэрээ',
    en: 'Contracts',
  },
  offers: {
    mn: 'Үнийн санал',
    en: 'Offers',
  },
};

export const UNIT_DOCUMENT_TABS_KEYS = Object.keys(UNIT_DOCUMENT_TABS).reduce(
  (acc, key) => {
    acc[key as keyof typeof UNIT_DOCUMENT_TABS] = key;
    return acc;
  },
  {} as Record<keyof typeof UNIT_DOCUMENT_TABS, string>,
);

export const UNIT_USAGE_ROOMS = {
  apartment: [
    { value: 'livingRoom', label: { en: 'Living room', mn: 'Зочны өрөө' } },
    { value: 'bedroom', label: { en: 'Bedroom', mn: 'Унтлагын өрөө' } },
    { value: 'kitchen', label: { en: 'Kitchen', mn: 'Гал тогоо' } },
    { value: 'bathroom', label: { en: 'Bathroom', mn: 'Ариун цэврийн өрөө' } },
    { value: 'diningArea', label: { en: 'Dining area', mn: 'Хоолний өрөө' } },
    { value: 'balcony', label: { en: 'Balcony', mn: 'Тагт' } },
    { value: 'laundry', label: { en: 'Laundry room', mn: 'Хувцас угаах өрөө' } },
    { value: 'storage', label: { en: 'Storage room', mn: 'Агуулах өрөө' } },
    { value: 'hallway', label: { en: 'Hallway', mn: 'Коридор' } },
    { value: 'workRoom', label: { en: 'Work room', mn: 'Ажлын өрөө' } }
  ],

  office: [
    { value: 'openWorkspace', label: { en: 'Open workspace', mn: 'Нээлттэй ажлын талбай' } },
    { value: 'privateOffice', label: { en: 'Private office', mn: 'Хувийн өрөө' } },
    { value: 'meetingRoom', label: { en: 'Meeting room', mn: 'Хурлын өрөө' } },
    { value: 'conferenceRoom', label: { en: 'Conference room', mn: 'Конференц өрөө' } },
    { value: 'breakRoom', label: { en: 'Break room', mn: 'Амрах өрөө' } },
    { value: 'reception', label: { en: 'Reception area', mn: 'Хүлээн авах хэсэг' } },
    { value: 'serverRoom', label: { en: 'Server room', mn: 'Серверийн өрөө' } },
    { value: 'supplyRoom', label: { en: 'Supply room', mn: 'Хангамжийн өрөө' } },
    { value: 'executiveOffice', label: { en: 'Executive office', mn: 'Удирдлагын өрөө' } }
  ],

  serviceArea: [
    { value: 'customerArea', label: { en: 'Customer area', mn: 'Үйлчлүүлэгчийн хэсэг' } },
    { value: 'staffRoom', label: { en: 'Staff room', mn: 'Ажилчдын өрөө' } },
    { value: 'utilityRoom', label: { en: 'Utility room', mn: 'Техникийн өрөө' } },
    { value: 'equipmentArea', label: { en: 'Equipment area', mn: 'Төхөөрөмжийн хэсэг' } },
    { value: 'cashierCounter', label: { en: 'Cashier counter', mn: 'Касс' } },
    { value: 'waitingArea', label: { en: 'Waiting area', mn: 'Хүлээлгийн хэсэг' } },
    { value: 'prepRoom', label: { en: 'Prep room', mn: 'Бэлтгэлийн өрөө' } },
    { value: 'backOffice', label: { en: 'Back office', mn: 'Дотоод оффис' } }
  ],

  parking: [
    { value: 'parkingSpot', label: { en: 'Parking spot', mn: 'Зогсоолын талбай' } },
    { value: 'evCharging', label: { en: 'EV charging spot', mn: 'Цахилгаан машины цэнэглэх цэг' } },
    { value: 'motorcycleParking', label: { en: 'Motorcycle parking', mn: 'Мотоциклийн зогсоол' } },
    { value: 'bicycleStorage', label: { en: 'Bicycle storage', mn: 'Дугуйн зогсоол' } },
    { value: 'controlBooth', label: { en: 'Control booth', mn: 'Хяналтын бүхээг' } },
    { value: 'loadingArea', label: { en: 'Loading area', mn: 'Ачилтын талбай' } }
  ],

  basement: [
    { value: 'storageRoom', label: { en: 'Storage room', mn: 'Агуулах' } },
    { value: 'boilerRoom', label: { en: 'Boiler room', mn: 'Зуухны өрөө' } },
    { value: 'mechanicalRoom', label: { en: 'Mechanical room', mn: 'Механикийн өрөө' } },
    { value: 'electricalRoom', label: { en: 'Electrical room', mn: 'Цахилгааны өрөө' } },
    { value: 'utilityCorridor', label: { en: 'Utility corridor', mn: 'Техникийн коридор' } },
    { value: 'coldRoom', label: { en: 'Cold room', mn: 'Хөргөлтийн өрөө' } },
    { value: 'workshop', label: { en: 'Workshop', mn: 'Цех' } }
  ],

  retail: [
    { value: 'salesFloor', label: { en: 'Sales floor', mn: 'Үзүүлэнгийн талбай' } },
    { value: 'checkout', label: { en: 'Checkout', mn: 'Касс' } },
    { value: 'displayArea', label: { en: 'Display area', mn: 'Үзүүлэнгийн хэсэг' } },
    { value: 'fittingRoom', label: { en: 'Fitting room', mn: 'Хувцас солих өрөө' } },
    { value: 'stockRoom', label: { en: 'Stock room', mn: 'Барааны агуулах' } },
    { value: 'backOffice', label: { en: 'Back office', mn: 'Дотоод өрөө' } },
    { value: 'receivingArea', label: { en: 'Receiving area', mn: 'Хүлээн авах хэсэг' } }
  ],

    school: [
    { value: 'classroom', label: { en: 'Classroom', mn: 'Анги танхим' } },
    { value: 'laboratory', label: { en: 'Laboratory', mn: 'Лаборатори' } },
    { value: 'library', label: { en: 'Library', mn: 'Номын сан' } },
    { value: 'gym', label: { en: 'Gym', mn: 'Биеийн тамирын заал' } },
    { value: 'cafeteria', label: { en: 'Cafeteria', mn: 'Хооллох өрөө' } },
    { value: 'fittingRoom', label: { en: 'Fitting room', mn: 'Хувцас солих өрөө' } },
    { value: 'office', label: { en: 'Office', mn: 'Оффис' } }
  ],

  kindergarten: [
    { value: 'classroom', label: { en: 'Classroom', mn: 'Анги танхим' } },
    { value: 'playroom', label: { en: 'Playroom', mn: 'Тоглоомын өрөө' } },
    { value: 'napRoom', label: { en: 'Nap room', mn: 'Унтлагын өрөө' } },
    { value: 'diningRoom', label: { en: 'Dining room', mn: 'Хоолны өрөө' } },
    { value: 'activityRoom', label: { en: 'Activity room', mn: 'Дасгалын өрөө' } },
    { value: 'fittingRoom', label: { en: 'Fitting room', mn: 'Хувцас солих өрөө' } },
    { value: 'office', label: { en: 'Office', mn: 'Оффис' } }
  ],

  factory: [
    { value: 'productionFloor', label: { en: 'Production floor', mn: 'Үйлдвэрлэлийн талбай' } },
    { value: 'warehouse', label: { en: 'Warehouse', mn: 'Агуулах' } },
    { value: 'office', label: { en: 'Office', mn: 'Оффис' } },
    { value: 'loadingDock', label: { en: 'Loading dock', mn: 'Ачилтын талбай' } },
    { value: 'breakRoom', label: { en: 'Break room', mn: 'Амрах өрөө' } }
  ],

  residential: [
    { value: 'livingRoom', label: { en: 'Living room', mn: 'Зочны өрөө' } },
    { value: 'bedroom', label: { en: 'Bedroom', mn: 'Унтлагын өрөө' } },
    { value: 'kitchen', label: { en: 'Kitchen', mn: 'Гал тогоо' } },
    { value: 'bathroom', label: { en: 'Bathroom', mn: 'Ариун цэврийн өрөө' } },
    { value: 'diningRoom', label: { en: 'Dining room', mn: 'Хоолны өрөө' } },
    { value: 'fittingRoom', label: { en: 'Fitting room', mn: 'Хувцас солих өрөө' } },
    { value: 'garage', label: { en: 'Garage', mn: 'Гараж' } },
    { value: 'office', label: { en: 'Office', mn: 'Оффис' } },
  ],

  hospital: [
    { value: 'patientRoom', label: { en: 'Patient room', mn: 'Өвчтөний өрөө' } },
    { value: 'operatingRoom', label: { en: 'Operating room', mn: 'Мэс заслын өрөө' } },
    { value: 'icu', label: { en: 'ICU', mn: 'Интенсивийн өрөө' } },
    { value: 'lab', label: { en: 'Laboratory', mn: 'Лаборатори' } },
    { value: 'pharmacy', label: { en: 'Pharmacy', mn: 'Эмийн сан' } },
    { value: 'reception', label: { en: 'Reception', mn: 'Хүлээн авах хэсэг' } }
  ],

  hotel: [
    { value: 'guestRoom', label: { en: 'Guest room', mn: 'Зочны өрөө' } },
    { value: 'suite', label: { en: 'Suite', mn: 'Люкс өрөө' } },
    { value: 'lobby', label: { en: 'Lobby', mn: 'Лобби' } },
    { value: 'restaurant', label: { en: 'Restaurant', mn: 'Ресторан' } },
    { value: 'conferenceRoom', label: { en: 'Conference room', mn: 'Хурлын өрөө' } },
    { value: 'gym', label: { en: 'Gym', mn: 'Биеийн тамирын заал' } },
    { value: 'spa', label: { en: 'Spa', mn: 'Спа' } }
  ]
};

export const UNIT_USAGE_SUBTYPES: Record<string, { value: string; label: { en: string; mn: string } }[]> = {
  apartment: [
    { value: 'standard', label: { en: 'Standard', mn: 'Стандарт' } },
    { value: 'comfort', label: { en: 'Comfort', mn: 'Комфорт' } },
    { value: 'premium', label: { en: 'Premium', mn: 'Премиум' } },
    { value: 'luxury', label: { en: 'Luxury', mn: 'Тансаг' } },
    { value: 'penthouse', label: { en: 'Penthouse', mn: 'Пентхаус' } }
  ],

  office: [
    { value: 'openSpace', label: { en: 'Open-space', mn: 'Нээлттэй' } },
    { value: 'coworking', label: { en: 'Coworking', mn: 'Ковёркинг' } },
    { value: 'private', label: { en: 'Private office', mn: 'Хувийн оффис' } },
    { value: 'executive', label: { en: 'Executive', mn: 'Удирдлагын' } },
    { value: 'premium', label: { en: 'Premium office', mn: 'Дээд зэрэглэлийн оффис' } },
    { value: 'meetingSuite', label: { en: 'Meeting-suite', mn: 'Хурал, уулзалтын блок' } }
  ],

  serviceArea: [
    { value: 'basic', label: { en: 'Basic service area', mn: 'Энгийн үйлчилгээний талбай' } },
    { value: 'standard', label: { en: 'Standard service area', mn: 'Стандарт үйлчилгээний талбай' } },
    { value: 'specialized', label: { en: 'Specialized', mn: 'Тусгай зориулалтын' } },
    { value: 'premium', label: { en: 'Premium service area', mn: 'Дээд зэрэглэлийн үйлчилгээний талбай' } }
  ],

  parking: [
    { value: 'standard', label: { en: 'Standard parking', mn: 'Стандарт зогсоол' } },
    { value: 'indoor', label: { en: 'Indoor parking', mn: 'Дотор зогсоол' } },
    { value: 'outdoor', label: { en: 'Outdoor parking', mn: 'Гадна зогсоол' } },
    { value: 'premium', label: { en: 'Premium parking', mn: 'Дээд зэрэглэлийн зогсоол' } },
    { value: 'ev', label: { en: 'EV charging', mn: 'Цэнэглэх зогсоол' } }
  ],

  basement: [
    { value: 'storage', label: { en: 'General storage', mn: 'Энгийн агуулах' } },
    { value: 'technical', label: { en: 'Technical', mn: 'Техникийн' } },
    { value: 'utility', label: { en: 'Utility', mn: 'Үйлчилгээний' } },
    { value: 'premium', label: { en: 'Premium basement', mn: 'Дээд зэрэглэлийн подвал' } }
  ],

  retail: [
    { value: 'kiosk', label: { en: 'Kiosk / Small retail', mn: 'Киоск / Жижиг дэлгүүр' } },
    { value: 'standard', label: { en: 'Standard retail', mn: 'Стандарт худалдаа' } },
    { value: 'boutique', label: { en: 'Boutique', mn: 'Бутик' } },
    { value: 'premium', label: { en: 'Premium retail', mn: 'Премиум худалдаа' } },
    { value: 'flagship', label: { en: 'Flagship store', mn: 'Тэргүүлэх дэлгүүр' } }
  ],

  school: [
    { value: 'primary', label: { en: 'Primary', mn: 'Бага' } },
    { value: 'secondary', label: { en: 'Secondary', mn: 'Дунд' } },
    { value: 'high', label: { en: 'High school', mn: 'Ахлах' } },
    { value: 'special', label: { en: 'Specialized', mn: 'Тусгай' } }
  ],

  kindergarten: [
    { value: 'standard', label: { en: 'Standard', mn: 'Стандарт' } },
    { value: 'preschool', label: { en: 'Preschool', mn: 'Сургуулийн өмнөх' } }
  ],

  factory: [
    { value: 'light', label: { en: 'Light industry', mn: 'Хөнгөн үйлдвэрлэл' } },
    { value: 'heavy', label: { en: 'Heavy industry', mn: 'Хүнд үйлдвэрлэл' } },
    { value: 'warehouse', label: { en: 'Warehouse', mn: 'Агуулах' } }
  ],

  residential: [
    { value: 'standard', label: { en: 'Standard', mn: 'Стандарт' } },
    { value: 'comfort', label: { en: 'Comfort', mn: 'Комфорт' } },
    { value: 'luxury', label: { en: 'Luxury', mn: 'Тансаг' } }
  ],

  hospital: [
    { value: 'general', label: { en: 'General', mn: 'Ерөнхий' } },
    { value: 'specialized', label: { en: 'Specialized', mn: 'Тусгай' } },
    { value: 'clinic', label: { en: 'Clinic', mn: 'Клиник' } }
  ],

  hotel: [
    { value: 'budget', label: { en: 'Budget', mn: 'Энгийн буудал' } },
    { value: 'standard', label: { en: 'Standard', mn: 'Стандарт буудал' } },
    { value: 'luxury', label: { en: 'Luxury', mn: 'Тансаг буудал' } },
    { value: 'resort', label: { en: 'Resort', mn: 'Амралтын буудал' } }
  ]
};

export const UNIT_EXTRA_OPTIONS = [
  { value: 'north', label: { en: 'North', mn: 'Хойд' } },
  { value: 'south', label: { en: 'South', mn: 'Урд' } },
  { value: 'east', label: { en: 'East', mn: 'Зүүн' } },
  { value: 'west', label: { en: 'West', mn: 'Баруун' } },

  { value: 'city', label: { en: 'City view', mn: 'Хотын үзэмж' } },
  { value: 'nature', label: { en: 'Nature view', mn: 'Байгалийн үзэмж' } },
  { value: 'mixed', label: { en: 'Mixed view', mn: 'Хосолсон харагдах байдал' } }
];