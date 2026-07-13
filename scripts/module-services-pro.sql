-- Module Services Professionnels – Axel Marketplace
-- Tables pour les fonctionnalités avancées vendeur
-- Indépendant du classement organique et d'Axel Ads

-- ============================================================
-- 1. VÉRIFICATION PROFESSIONNELLE
-- ============================================================
CREATE TABLE IF NOT EXISTS SellerVerification (
  id VARCHAR(50) PRIMARY KEY,
  shopId VARCHAR(50) NOT NULL UNIQUE,
  status ENUM('pending','approved','rejected','expired') NOT NULL DEFAULT 'pending',
  verificationType ENUM('individual','business') NOT NULL DEFAULT 'individual',
  idType VARCHAR(50),
  idNumber VARCHAR(255),
  businessRegNumber VARCHAR(255),
  taxId VARCHAR(255),
  documents JSON,
  verifiedBy INT,
  verifiedAt DATETIME,
  expiresAt DATETIME,
  rejectionReason TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_shopId (shopId),
  FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE CASCADE,
  FOREIGN KEY (verifiedBy) REFERENCES User(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 2. GESTION AVANCÉE DES PRODUITS – Variantes
-- ============================================================
CREATE TABLE IF NOT EXISTS ProductVariant (
  id INT AUTO_INCREMENT PRIMARY KEY,
  productId INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  value VARCHAR(100) NOT NULL,
  sku VARCHAR(100),
  price INT,
  stock INT DEFAULT 0,
  image VARCHAR(500),
  sortOrder INT DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_productId (productId),
  INDEX idx_sku (sku),
  FOREIGN KEY (productId) REFERENCES Product(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ProductVariantGroup (
  id INT AUTO_INCREMENT PRIMARY KEY,
  productId INT NOT NULL,
  type VARCHAR(50) NOT NULL COMMENT 'size, color, capacity, material, etc.',
  name VARCHAR(100) NOT NULL,
  sortOrder INT DEFAULT 0,
  INDEX idx_productId (productId),
  FOREIGN KEY (productId) REFERENCES Product(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ProductScheduledPublish (
  id INT AUTO_INCREMENT PRIMARY KEY,
  productId INT NOT NULL,
  scheduledAt DATETIME NOT NULL,
  publishedAt DATETIME,
  status ENUM('pending','published','cancelled') DEFAULT 'pending',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_productId (productId),
  INDEX idx_status (status),
  INDEX idx_scheduledAt (scheduledAt),
  FOREIGN KEY (productId) REFERENCES Product(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS StockAlert (
  id INT AUTO_INCREMENT PRIMARY KEY,
  productId INT NOT NULL,
  shopId VARCHAR(50) NOT NULL,
  threshold INT NOT NULL DEFAULT 5,
  notified TINYINT(1) DEFAULT 0,
  lastNotifiedAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_productId (productId),
  INDEX idx_shopId (shopId),
  FOREIGN KEY (productId) REFERENCES Product(id) ON DELETE CASCADE,
  FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 3. GESTION DES COMMANDES – Retours et remboursements
-- ============================================================
CREATE TABLE IF NOT EXISTS ReturnRequest (
  id VARCHAR(50) PRIMARY KEY,
  orderId VARCHAR(50) NOT NULL,
  productId INT NOT NULL,
  shopId VARCHAR(50) NOT NULL,
  userId INT NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('pending','approved','rejected','picked_up','received','refunded','cancelled') NOT NULL DEFAULT 'pending',
  refundAmount INT,
  refundMethod VARCHAR(50),
  documents JSON,
  notes TEXT,
  reviewedBy INT,
  reviewedAt DATETIME,
  refundedAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orderId (orderId),
  INDEX idx_shopId (shopId),
  INDEX idx_status (status),
  FOREIGN KEY (orderId) REFERENCES `Order`(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES Product(id) ON DELETE CASCADE,
  FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewedBy) REFERENCES User(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 4. GESTION DE LA BOUTIQUE – Paramètres avancés
-- ============================================================
CREATE TABLE IF NOT EXISTS ShopSettings (
  shopId VARCHAR(50) PRIMARY KEY,
  hours JSON COMMENT 'Business hours per day',
  socialLinks JSON COMMENT 'Social media links',
  deliveryPolicy TEXT,
  returnPolicy TEXT,
  contactInfo JSON COMMENT 'Additional contact info',
  seoDescription TEXT,
  seoKeywords VARCHAR(500),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 5. OUTILS MARKETING
-- ============================================================
CREATE TABLE IF NOT EXISTS PromoCode (
  id VARCHAR(50) PRIMARY KEY,
  shopId VARCHAR(50) NOT NULL,
  code VARCHAR(100) NOT NULL,
  discountType ENUM('percentage','fixed') NOT NULL DEFAULT 'percentage',
  discountValue INT NOT NULL,
  minPurchase INT DEFAULT 0,
  maxUses INT DEFAULT 0,
  usedCount INT DEFAULT 0,
  applicableProducts JSON,
  applicableCategories JSON,
  startDate DATETIME NOT NULL,
  endDate DATETIME NOT NULL,
  isActive TINYINT(1) DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_code_shop (shopId, code),
  INDEX idx_shopId (shopId),
  INDEX idx_code (code),
  INDEX idx_active (isActive),
  FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS FlashSale (
  id VARCHAR(50) PRIMARY KEY,
  shopId VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  discountPercent INT NOT NULL,
  startDate DATETIME NOT NULL,
  endDate DATETIME NOT NULL,
  isActive TINYINT(1) DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_shopId (shopId),
  INDEX idx_active_dates (isActive, startDate, endDate),
  FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS FlashSaleProduct (
  id INT AUTO_INCREMENT PRIMARY KEY,
  flashSaleId VARCHAR(50) NOT NULL,
  productId INT NOT NULL,
  UNIQUE KEY uk_fs_product (flashSaleId, productId),
  INDEX idx_productId (productId),
  FOREIGN KEY (flashSaleId) REFERENCES FlashSale(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES Product(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ProductPack (
  id VARCHAR(50) PRIMARY KEY,
  shopId VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  products JSON NOT NULL COMMENT 'Array of {productId, quantity}',
  packPrice INT NOT NULL,
  originalPrice INT NOT NULL,
  stock INT DEFAULT 0,
  image VARCHAR(500),
  isActive TINYINT(1) DEFAULT 1,
  startDate DATETIME,
  endDate DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_shopId (shopId),
  INDEX idx_active (isActive),
  FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS BogoOffer (
  id VARCHAR(50) PRIMARY KEY,
  shopId VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  buyQuantity INT NOT NULL DEFAULT 1,
  getQuantity INT NOT NULL DEFAULT 1,
  discountPercent INT NOT NULL DEFAULT 100 COMMENT '100 = free',
  applicableProducts JSON,
  startDate DATETIME NOT NULL,
  endDate DATETIME NOT NULL,
  isActive TINYINT(1) DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_shopId (shopId),
  INDEX idx_active (isActive),
  FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 6. COMMUNICATION CLIENT
-- ============================================================
CREATE TABLE IF NOT EXISTS SellerMessage (
  id VARCHAR(50) PRIMARY KEY,
  shopId VARCHAR(50) NOT NULL,
  userId INT NOT NULL,
  orderId VARCHAR(50),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  senderRole ENUM('seller','client') NOT NULL,
  isRead TINYINT(1) DEFAULT 0,
  readAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_shopId (shopId),
  INDEX idx_userId (userId),
  INDEX idx_orderId (orderId),
  INDEX idx_isRead (isRead),
  FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (orderId) REFERENCES `Order`(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS SellerMessageReply (
  id INT AUTO_INCREMENT PRIMARY KEY,
  messageId VARCHAR(50) NOT NULL,
  senderRole ENUM('seller','client') NOT NULL,
  message TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_messageId (messageId),
  FOREIGN KEY (messageId) REFERENCES SellerMessage(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS AutoReply (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shopId VARCHAR(50) NOT NULL,
  keyword VARCHAR(100) NOT NULL,
  replySubject VARCHAR(255),
  replyMessage TEXT NOT NULL,
  matchType ENUM('exact','contains','regex') DEFAULT 'contains',
  isActive TINYINT(1) DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_shopId (shopId),
  INDEX idx_keyword (keyword),
  FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS MessageTemplate (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shopId VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_shopId (shopId),
  FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 7. RAPPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS SellerReport (
  id VARCHAR(50) PRIMARY KEY,
  shopId VARCHAR(50) NOT NULL,
  type ENUM('daily','weekly','monthly','yearly','custom') NOT NULL,
  period VARCHAR(50) NOT NULL COMMENT 'e.g. 2026-07, 2026-W28, 2026-07-13',
  data JSON NOT NULL,
  pdfPath VARCHAR(500),
  generatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_shopId (shopId),
  INDEX idx_type_period (type, period),
  FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 8. API
-- ============================================================
CREATE TABLE IF NOT EXISTS ApiKey (
  id VARCHAR(50) PRIMARY KEY,
  shopId VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  keyHash VARCHAR(255) NOT NULL,
  keyPrefix VARCHAR(20) NOT NULL COMMENT 'First chars for identification',
  permissions JSON NOT NULL COMMENT 'Array of allowed scopes',
  allowedIps JSON,
  rateLimit INT DEFAULT 100 COMMENT 'Requests per minute',
  lastUsedAt DATETIME,
  expiresAt DATETIME,
  isActive TINYINT(1) DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_shopId (shopId),
  INDEX idx_keyPrefix (keyPrefix),
  FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ApiRequestLog (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  apiKeyId VARCHAR(50),
  shopId VARCHAR(50),
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  statusCode INT NOT NULL,
  ip VARCHAR(45),
  duration INT COMMENT 'Request duration in ms',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_apiKeyId (apiKeyId),
  INDEX idx_shopId (shopId),
  INDEX idx_createdAt (createdAt),
  FOREIGN KEY (apiKeyId) REFERENCES ApiKey(id) ON DELETE SET NULL,
  FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 9. INTELLIGENCE ARTIFICIELLE
-- ============================================================
CREATE TABLE IF NOT EXISTS AiRecommendation (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shopId VARCHAR(50) NOT NULL,
  productId INT,
  type ENUM('price','optimization','publishing','sales_forecast','detection') NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  data JSON NOT NULL,
  confidence FLOAT DEFAULT 0 COMMENT '0-100 confidence score',
  applied TINYINT(1) DEFAULT 0,
  appliedAt DATETIME,
  dismissed TINYINT(1) DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_shopId (shopId),
  INDEX idx_productId (productId),
  INDEX idx_type (type),
  INDEX idx_applied (applied),
  FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES Product(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS AiPricingHistory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shopId VARCHAR(50) NOT NULL,
  productId INT NOT NULL,
  oldPrice INT NOT NULL,
  recommendedPrice INT NOT NULL,
  appliedPrice INT,
  reason TEXT,
  confidence FLOAT,
  revenue_impact INT COMMENT 'Observed revenue change after applied',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_shopId (shopId),
  INDEX idx_productId (productId),
  FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES Product(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 10. NOTIFICATIONS VENDEUR
-- ============================================================
CREATE TABLE IF NOT EXISTS SellerNotification (
  id VARCHAR(50) PRIMARY KEY,
  shopId VARCHAR(50) NOT NULL,
  type ENUM('new_order','payment_received','low_stock','return_request','new_message','new_review','performance','system') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSON,
  isRead TINYINT(1) DEFAULT 0,
  readAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_shopId (shopId),
  INDEX idx_type (type),
  INDEX idx_isRead (isRead),
  INDEX idx_createdAt (createdAt),
  FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 11. SÉCURITÉ
-- ============================================================
CREATE TABLE IF NOT EXISTS SellerSecurity (
  shopId VARCHAR(50) PRIMARY KEY,
  twoFactorEnabled TINYINT(1) DEFAULT 0,
  twoFactorMethod ENUM('app','email','sms') DEFAULT 'app',
  twoFactorSecret VARCHAR(255),
  backupCodes JSON,
  sessionTimeout INT DEFAULT 60 COMMENT 'Minutes',
  ipWhitelist JSON,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS LoginLog (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  ip VARCHAR(45) NOT NULL,
  userAgent TEXT,
  country VARCHAR(10),
  city VARCHAR(100),
  device VARCHAR(50),
  success TINYINT(1) DEFAULT 1,
  failReason VARCHAR(255),
  sessionId VARCHAR(255),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_userId (userId),
  INDEX idx_createdAt (createdAt),
  INDEX idx_success (success),
  INDEX idx_sessionId (sessionId),
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ActionLog (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  shopId VARCHAR(50),
  userId INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  entityType VARCHAR(50) COMMENT 'product, order, campaign, etc.',
  entityId VARCHAR(50),
  details JSON,
  ip VARCHAR(45),
  userAgent TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_shopId (shopId),
  INDEX idx_userId (userId),
  INDEX idx_action (action),
  INDEX idx_entity (entityType, entityId),
  INDEX idx_createdAt (createdAt),
  FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE SET NULL,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS TeamMember (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shopId VARCHAR(50) NOT NULL,
  userId INT NOT NULL,
  role ENUM('manager','editor','support','analyst') NOT NULL DEFAULT 'editor',
  permissions JSON COMMENT 'Granular permissions override',
  status ENUM('active','invited','suspended','removed') DEFAULT 'active',
  invitedBy INT,
  invitedAt DATETIME,
  joinedAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_shop_user (shopId, userId),
  INDEX idx_shopId (shopId),
  INDEX idx_role (role),
  INDEX idx_status (status),
  FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (invitedBy) REFERENCES User(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
