-- ============================================
-- Foodie Delight - MySQL Database Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS foodie_delight;
USE foodie_delight;

-- ---------------------------------------------
-- USERS TABLE (customers + admin, role based)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    address VARCHAR(255) DEFAULT NULL,
    role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------
-- MENU ITEMS TABLE
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    image VARCHAR(255) DEFAULT NULL,
    is_featured TINYINT(1) DEFAULT 0,
    is_available TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ---------------------------------------------
-- ORDERS TABLE
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
    delivery_address VARCHAR(255) DEFAULT NULL,
    payment_method ENUM('cod', 'online') NOT NULL DEFAULT 'cod',
    payment_status ENUM('pending', 'paid', 'failed') NOT NULL DEFAULT 'pending',
    razorpay_order_id VARCHAR(100) DEFAULT NULL,
    razorpay_payment_id VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------------------------
-- ORDER ITEMS TABLE (line items per order)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    menu_item_id INT DEFAULT NULL,
    item_name VARCHAR(150) NOT NULL,
    item_price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL
);

-- ---------------------------------------------
-- CONTACT MESSAGES TABLE
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SEED DATA
-- ============================================

-- NOTE: The admin account is NOT inserted here because passwords must be
-- bcrypt-hashed at creation time. After running this schema, create the
-- admin account by running:  npm run seed:admin
-- (it reads ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD from your .env file)

-- Menu items (from the original static site data)
INSERT INTO menu_items (name, description, price, category, image, is_featured) VALUES
('Margherita Pizza', 'Classic pizza with tomato sauce, mozzarella, and basil', 199.00, 'pizza', 'img/food/p1.jpg', 1),
('Pepperoni Pizza', 'Pizza topped with pepperoni and mozzarella cheese', 299.00, 'pizza', 'img/category/pizza.jpg', 0),
('Cheeseburger', 'Juicy beef burger with cheese, lettuce, and tomato', 149.00, 'burger', 'img/food/b1.jpg', 1),
('Chicken Burger', 'Grilled chicken breast with special sauce', 159.00, 'burger', 'img/category/burger.jpg', 0),
('Club Sandwich', 'Triple-decker sandwich with turkey, bacon, and vegetables', 199.00, 'sandwich', 'img/food/s1.jpg', 1),
('Veggie Sandwich', 'Fresh vegetables with hummus and sprouts', 99.00, 'sandwich', 'img/category/sandwich.jpg', 0);
