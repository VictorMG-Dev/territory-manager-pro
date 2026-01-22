
CREATE DATABASE IF NOT EXISTS territory_manager;
USE territory_manager;

CREATE TABLE IF NOT EXISTS congregations (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    inviteCode VARCHAR(8) UNIQUE NOT NULL,
    createdBy VARCHAR(255),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    uid VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    photoURL TEXT,
    congregationId VARCHAR(255),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (congregationId) REFERENCES congregations(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS territories (
    id VARCHAR(255) PRIMARY KEY,
    userId VARCHAR(255),
    congregationId VARCHAR(255),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    observations TEXT,
    status ENUM('green', 'yellow', 'red') DEFAULT 'green',
    size ENUM('small', 'medium', 'large') DEFAULT 'medium',
    lastWorkedDate DATETIME,
    lastWorkedBy VARCHAR(255),
    daysSinceWork INT DEFAULT 0,
    geolocation JSON,
    images JSON,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(uid) ON DELETE SET NULL,
    FOREIGN KEY (congregationId) REFERENCES congregations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS work_records (
    id VARCHAR(255) PRIMARY KEY,
    territoryId VARCHAR(255),
    date DATETIME NOT NULL,
    publisherName VARCHAR(255),
    notes TEXT,
    photos JSON,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (territoryId) REFERENCES territories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS territory_groups (
    id VARCHAR(255) PRIMARY KEY,
    congregationId VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(50),
    territoryIds JSON,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (congregationId) REFERENCES congregations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS weekly_plans (
    id VARCHAR(255) PRIMARY KEY,
    groupId VARCHAR(255),
    startDate DATETIME NOT NULL,
    days JSON,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (groupId) REFERENCES territory_groups(id) ON DELETE CASCADE
);
