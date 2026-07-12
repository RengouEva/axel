-- Axelle Marketplace - Schéma SQL complet
-- À exécuter sur un nouveau serveur MySQL avant de lancer l'application

CREATE TABLE IF NOT EXISTS User (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'client',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS Category (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  icon VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS Country (
  id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  flag VARCHAR(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS City (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  countryId VARCHAR(10) NOT NULL,
  x INT NOT NULL DEFAULT 0,
  y INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS District (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  cityId VARCHAR(20) NOT NULL,
  x INT NOT NULL DEFAULT 0,
  y INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS Shop (
  id VARCHAR(50) PRIMARY KEY,
  sellerId INT NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  logo VARCHAR(500) DEFAULT '/images/shops/default.svg',
  coverImage VARCHAR(500) DEFAULT '/images/shops/default-cover.svg',
  countryId VARCHAR(10) NOT NULL,
  cityId VARCHAR(20) NOT NULL,
  districtId VARCHAR(20) NOT NULL,
  address VARCHAR(500),
  category VARCHAR(100) DEFAULT '',
  rating FLOAT DEFAULT 0,
  totalSales INT DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  FOREIGN KEY (sellerId) REFERENCES User(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS Product (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price INT NOT NULL,
  monthlyPrice INT NOT NULL DEFAULT 0,
  rating FLOAT DEFAULT 0,
  reviews INT DEFAULT 0,
  inStock TINYINT(1) DEFAULT 1,
  promotion TINYINT(1) DEFAULT 0,
  description TEXT,
  image VARCHAR(500) NOT NULL,
  images TEXT,
  creditRates TEXT,
  slug VARCHAR(255) NOT NULL UNIQUE,
  shopId VARCHAR(50),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_brand (brand),
  INDEX idx_slug (slug),
  INDEX idx_shopId (shopId),
  FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS Orders (
  id VARCHAR(50) PRIMARY KEY,
  date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending',
  total INT NOT NULL,
  userId INT NOT NULL,
  shippingName VARCHAR(255),
  shippingEmail VARCHAR(255),
  shippingPhone VARCHAR(50),
  shippingAddress TEXT,
  countryId VARCHAR(10),
  cityId VARCHAR(20),
  districtId VARCHAR(20),
  deliveryMethod VARCHAR(50),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_userId (userId),
  INDEX idx_status (status),
  INDEX idx_createdAt (createdAt),
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS OrderItem (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderId VARCHAR(50) NOT NULL,
  productId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  price INT NOT NULL,
  INDEX idx_orderId (orderId),
  INDEX idx_productId (productId),
  FOREIGN KEY (orderId) REFERENCES Orders(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES Product(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS Plan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  price INT NOT NULL,
  durationDays INT NOT NULL,
  maxBoosts INT DEFAULT 0,
  hasPremiumBadge TINYINT(1) DEFAULT 0,
  hasVerifiedBadge TINYINT(1) DEFAULT 0,
  hasFeaturedBadge TINYINT(1) DEFAULT 0,
  boostPrice INT DEFAULT 0,
  isActive TINYINT(1) DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ShopSubscription (
  id VARCHAR(50) PRIMARY KEY,
  shopId VARCHAR(50) NOT NULL,
  planId INT NOT NULL,
  startDate DATETIME NOT NULL,
  endDate DATETIME NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  autoRenew TINYINT(1) DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_shopId (shopId),
  INDEX idx_status (status),
  FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE CASCADE,
  FOREIGN KEY (planId) REFERENCES Plan(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ProductBoost (
  id VARCHAR(50) PRIMARY KEY,
  productId INT NOT NULL,
  shopId VARCHAR(50),
  startDate DATETIME NOT NULL,
  endDate DATETIME NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_productId (productId),
  INDEX idx_shopId (shopId),
  INDEX idx_status (status),
  FOREIGN KEY (productId) REFERENCES Product(id) ON DELETE CASCADE,
  FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS Transaction (
  id VARCHAR(50) PRIMARY KEY,
  shopId VARCHAR(50),
  userId INT,
  amount INT NOT NULL,
  currency VARCHAR(10) DEFAULT 'XAF',
  type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  reference VARCHAR(255),
  metadata TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_shopId (shopId),
  INDEX idx_status (status),
  INDEX idx_createdAt (createdAt),
  FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE SET NULL,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ShopBadge (
  id VARCHAR(50) PRIMARY KEY,
  shopId VARCHAR(50) NOT NULL,
  type VARCHAR(50) NOT NULL,
  label VARCHAR(255) NOT NULL,
  color VARCHAR(50) NOT NULL,
  icon VARCHAR(100),
  assignedBy VARCHAR(50) DEFAULT 'system',
  assignedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  expiresAt DATETIME,
  INDEX idx_shopId (shopId),
  INDEX idx_type (type),
  FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS TaxRate (
  id INT AUTO_INCREMENT PRIMARY KEY,
  countryId VARCHAR(10) NOT NULL UNIQUE,
  rate FLOAT NOT NULL,
  label VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS DeliveryPerson (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  avatar VARCHAR(500),
  countryId VARCHAR(10) NOT NULL,
  cityId VARCHAR(20) NOT NULL,
  districtId VARCHAR(20) NOT NULL,
  available TINYINT(1) DEFAULT 1,
  rating FLOAT DEFAULT 0,
  kycStatus VARCHAR(50) DEFAULT 'pending',
  missionsCount INT DEFAULT 0,
  coordinates TEXT,
  userId INT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cityId (cityId),
  INDEX idx_available (available),
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS DeliveryMission (
  id VARCHAR(50) PRIMARY KEY,
  orderId VARCHAR(50) NOT NULL UNIQUE,
  deliveryPersonId VARCHAR(50),
  countryId VARCHAR(10) NOT NULL,
  cityId VARCHAR(20) NOT NULL,
  districtId VARCHAR(20) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  pickupAddress TEXT,
  deliveryAddress TEXT,
  customerName VARCHAR(255),
  customerPhone VARCHAR(50),
  assignedAt DATETIME,
  completedAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_deliveryPersonId (deliveryPersonId),
  INDEX idx_status (status),
  INDEX idx_cityId (cityId),
  FOREIGN KEY (deliveryPersonId) REFERENCES DeliveryPerson(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ProductStock (
  id INT AUTO_INCREMENT PRIMARY KEY,
  productId INT NOT NULL,
  countryId VARCHAR(10) NOT NULL,
  cityId VARCHAR(20) NOT NULL,
  districtId VARCHAR(20) NOT NULL,
  quantity INT DEFAULT 0,
  INDEX idx_productId (productId),
  FOREIGN KEY (productId) REFERENCES Product(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS Favorite (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  productId INT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_product (userId, productId),
  INDEX idx_userId (userId),
  INDEX idx_productId (productId),
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES Product(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ContactMessage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read TINYINT(1) DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_read (read),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS CreditRequest (
  id VARCHAR(50) PRIMARY KEY,
  userId INT NOT NULL,
  productId INT NOT NULL,
  shopId VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  amountRequested INT NOT NULL,
  creditDuration INT NOT NULL,
  monthlyPayment INT NOT NULL,
  creditRate FLOAT DEFAULT 0,
  reviewedBy INT,
  reviewNotes TEXT,
  reviewedAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_userId (userId),
  INDEX idx_status (status),
  INDEX idx_shopId (shopId),
  INDEX idx_createdAt (createdAt),
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES Product(id) ON DELETE CASCADE,
  FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewedBy) REFERENCES User(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS Guarantor (
  id VARCHAR(50) PRIMARY KEY,
  creditRequestId VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  countryId VARCHAR(10) NOT NULL,
  cityId VARCHAR(20) NOT NULL,
  districtId VARCHAR(20) NOT NULL,
  address VARCHAR(500),
  idType VARCHAR(50) NOT NULL,
  idDocument VARCHAR(500),
  relationship VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_creditRequestId (creditRequestId),
  FOREIGN KEY (creditRequestId) REFERENCES CreditRequest(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Données de base
INSERT IGNORE INTO Category (name, slug, icon) VALUES
  ('Téléphones', 'telephones', 'Smartphone'),
  ('Ordinateurs', 'ordinateurs', 'Laptop'),
  ('TV & Audio', 'tv-audio', 'Tv'),
  ('Électroménager', 'electromenager', 'Refrigerator'),
  ('Mode', 'mode', 'Shirt'),
  ('Beauté', 'beaute', 'Sparkles'),
  ('Maison', 'maison', 'Home'),
  ('Sport', 'sport', 'Trophy'),
  ('Auto-Moto', 'auto-moto', 'Car'),
  ('Immobilier', 'immobilier', 'Building2'),
  ('Services', 'services', 'ShoppingCart'),
  ('Autres', 'autres', 'Grid3X3');

INSERT IGNORE INTO Country (id, name, flag) VALUES
  ('CM', 'Cameroun', '🇨🇲'),
  ('CI', 'Côte d''Ivoire', '🇨🇮'),
  ('SN', 'Sénégal', '🇸🇳'),
  ('GA', 'Gabon', '🇬🇦');

INSERT IGNORE INTO City (id, name, countryId, x, y) VALUES
  ('DLA', 'Douala', 'CM', 210, 180),
  ('YDE', 'Yaoundé', 'CM', 230, 150),
  ('ABJ', 'Abidjan', 'CI', 195, 210),
  ('DKR', 'Dakar', 'SN', 170, 240),
  ('LBV', 'Libreville', 'GA', 230, 165);

INSERT IGNORE INTO District (id, name, cityId, x, y) VALUES
  ('DLA-BS', 'Bonabéri', 'DLA', 210, 185),
  ('DLA-AK', 'Akwa', 'DLA', 215, 180),
  ('DLA-DE', 'Deido', 'DLA', 220, 178),
  ('DLA-BO', 'Bonapriso', 'DLA', 213, 182),
  ('DLA-CT', 'Centre Ville', 'DLA', 210, 180),
  ('YDE-CT', 'Centre', 'YDE', 230, 150),
  ('YDE-MV', 'Mvog-Mbi', 'YDE', 235, 148),
  ('YDE-BI', 'Biyem Assi', 'YDE', 228, 155),
  ('ABJ-PL', 'Plateau', 'ABJ', 195, 210),
  ('ABJ-CO', 'Cocody', 'ABJ', 200, 205),
  ('DKR-CT', 'Centre', 'DKR', 170, 240),
  ('LBV-CT', 'Centre', 'LBV', 230, 165),
  ('DLA-NY', 'Nyalla', 'DLA', 225, 175),
  ('ABJ-YO', 'Yopougon', 'ABJ', 190, 215);

INSERT IGNORE INTO TaxRate (countryId, rate, label) VALUES
  ('CM', 19.25, 'TVA Cameroun'),
  ('CI', 18, 'TVA Côte d''Ivoire'),
  ('SN', 18, 'TVA Sénégal'),
  ('GA', 18, 'TVA Gabon');
