-- ============================================================
-- AXEL MARKETPLACE — Module de Classement Organique v2
-- Nouvelles tables pour le moteur de score organique
-- ============================================================

-- Suivi des événements produit (vues, clics, favoris, panier, achats)
CREATE TABLE IF NOT EXISTS ProductEvent (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  productId INT NOT NULL,
  event ENUM('view','click','favorite','cart_add','purchase') NOT NULL,
  userId INT,
  sessionId VARCHAR(255),
  ip VARCHAR(45),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_productId (productId),
  INDEX idx_event (event),
  INDEX idx_createdAt (createdAt),
  INDEX idx_productEvent (productId, event, createdAt),
  FOREIGN KEY (productId) REFERENCES Product(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Activité vendeur (temps de réponse, annulations, disponibilité)
CREATE TABLE IF NOT EXISTS SellerActivity (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shopId VARCHAR(50) NOT NULL,
  avgResponseTime INT DEFAULT 0 COMMENT 'Temps moyen de réponse en secondes',
  cancellationRate FLOAT DEFAULT 0 COMMENT 'Taux d\'annulation (0-1)',
  availability FLOAT DEFAULT 1.0 COMMENT 'Taux de disponibilité (0-1)',
  totalOrders INT DEFAULT 0,
  completedOrders INT DEFAULT 0,
  lastActiveAt DATETIME,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_shopId (shopId),
  INDEX idx_shopId (shopId),
  FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Rapports de fraude
CREATE TABLE IF NOT EXISTS FraudReport (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  productId INT NOT NULL,
  reportedBy INT,
  reason VARCHAR(255) NOT NULL,
  details TEXT,
  score INT DEFAULT 0 COMMENT 'Score de fraude 0-100',
  status ENUM('pending','investigating','confirmed','rejected') DEFAULT 'pending',
  actionTaken VARCHAR(255),
  reviewedBy INT,
  reviewedAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_productId (productId),
  INDEX idx_status (status),
  INDEX idx_createdAt (createdAt),
  FOREIGN KEY (productId) REFERENCES Product(id) ON DELETE CASCADE,
  FOREIGN KEY (reportedBy) REFERENCES User(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewedBy) REFERENCES User(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Cache des scores organiques (pour performances)
CREATE TABLE IF NOT EXISTS OrganicScoreCache (
  productId INT PRIMARY KEY,
  totalScore FLOAT NOT NULL DEFAULT 0,
  relevanceScore FLOAT DEFAULT 0,
  qualityScore FLOAT DEFAULT 0,
  freshnessScore FLOAT DEFAULT 0,
  availabilityScore FLOAT DEFAULT 0,
  priceScore FLOAT DEFAULT 0,
  sellerReputationScore FLOAT DEFAULT 0,
  performanceScore FLOAT DEFAULT 0,
  activityScore FLOAT DEFAULT 0,
  userExperienceScore FLOAT DEFAULT 0,
  calculatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  expiresAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_totalScore (totalScore DESC),
  INDEX idx_expiresAt (expiresAt),
  FOREIGN KEY (productId) REFERENCES Product(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Colonnes supplémentaires pour Product (qualité annonce, UX, fraude)
ALTER TABLE Product
  ADD COLUMN IF NOT EXISTS hasVideo TINYINT(1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hasFeatures TINYINT(1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hasTechnicalInfo TINYINT(1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS isDuplicate TINYINT(1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS isSpam TINYINT(1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hasCopiedContent TINYINT(1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hasInaccurateInfo TINYINT(1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hasMisleadingContent TINYINT(1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS isVerifiedListing TINYINT(1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hasAuthenticPhotos TINYINT(1) DEFAULT 0;

-- Colonnes supplémentaires pour Shop
ALTER TABLE Shop
  ADD COLUMN IF NOT EXISTS sellerVerified TINYINT(1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS responseTime INT DEFAULT 0;

-- Vue matérialisée simplifiée pour le classement (optimisation)
CREATE OR REPLACE VIEW OrganicProductView AS
SELECT
  p.id,
  p.name,
  p.brand,
  p.category,
  p.price,
  p.rating,
  p.reviews,
  p.inStock,
  p.image,
  p.images,
  p.description,
  p.createdAt,
  p.updatedAt,
  p.shopId,
  p.hasVideo,
  p.hasFeatures,
  p.hasTechnicalInfo,
  p.isDuplicate,
  p.isSpam,
  p.hasCopiedContent,
  p.hasInaccurateInfo,
  p.hasMisleadingContent,
  p.isVerifiedListing,
  p.hasAuthenticPhotos,
  s.name as shop_name,
  s.slug as shop_slug,
  s.logo as shop_logo,
  s.rating as shop_rating,
  s.reviews as shop_reviews,
  s.totalSales as shop_totalSales,
  s.sellerVerified as shop_sellerVerified,
  s.createdAt as shop_createdAt,
  COALESCE(osc.totalScore, 0) as organicScore,
  osc.calculatedAt as scoreCalculatedAt
FROM Product p
LEFT JOIN Shop s ON s.id = p.shopId
LEFT JOIN OrganicScoreCache osc ON osc.productId = p.id AND osc.expiresAt > NOW();

-- Données initiales SellerActivity pour les boutiques existantes
INSERT IGNORE INTO SellerActivity (shopId, totalOrders, completedOrders, availability)
SELECT id, totalSales, totalSales, 1.0 FROM Shop;
