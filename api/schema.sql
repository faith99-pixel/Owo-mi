CREATE DATABASE IF NOT EXISTS owomi;
USE owomi;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  walletBalance DECIMAL(15,2) DEFAULT 0,
  savingsBalance DECIMAL(15,2) DEFAULT 0,
  virtualAccountNumber VARCHAR(20) UNIQUE,
  virtualAccountBank VARCHAR(100) DEFAULT 'Wema Bank',
  bvn VARCHAR(11),
  isVerified BOOLEAN DEFAULT FALSE,
  financialScore INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  type ENUM('credit', 'debit') NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  category VARCHAR(50) DEFAULT 'TRANSFER',
  description TEXT,
  merchant VARCHAR(255),
  recipientId INT,
  senderId INT,
  reference VARCHAR(100) UNIQUE,
  status ENUM('pending', 'success', 'failed') DEFAULT 'success',
  balanceBefore DECIMAL(15,2),
  balanceAfter DECIMAL(15,2),
  source ENUM('wallet', 'savings', 'sms_import') DEFAULT 'wallet',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_date (userId, createdAt)
);

CREATE TABLE IF NOT EXISTS savings_goals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  targetAmount DECIMAL(15,2) NOT NULL,
  currentAmount DECIMAL(15,2) DEFAULT 0,
  emoji VARCHAR(10) DEFAULT '🎯',
  isLocked BOOLEAN DEFAULT FALSE,
  unlockDate DATE,
  interestRate DECIMAL(5,2) DEFAULT 10.00,
  status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completedAt TIMESTAMP NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
