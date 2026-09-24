-- ============================================
-- Migration: Add payment tracking columns to orders table
-- Run this ONLY if you already have an existing foodie_delight database
-- (from before Razorpay was added) and want to keep your existing data.
--
-- If you're setting up fresh, you don't need this — schema.sql already
-- includes these columns.
--
-- Run with:
--   mysql -u root -p foodie_delight < database/migration_add_payment.sql
-- or paste into MySQL Workbench with "USE foodie_delight;" first.
-- ============================================

USE foodie_delight;

ALTER TABLE orders
    ADD COLUMN payment_method ENUM('cod', 'online') NOT NULL DEFAULT 'cod' AFTER delivery_address,
    ADD COLUMN payment_status ENUM('pending', 'paid', 'failed') NOT NULL DEFAULT 'pending' AFTER payment_method,
    ADD COLUMN razorpay_order_id VARCHAR(100) DEFAULT NULL AFTER payment_status,
    ADD COLUMN razorpay_payment_id VARCHAR(100) DEFAULT NULL AFTER razorpay_order_id;
