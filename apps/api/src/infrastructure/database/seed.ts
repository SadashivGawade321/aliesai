/**
 * AegisPay AI — Database Seed Script
 * Run: pnpm seed (from apps/api directory)
 */
import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aegispay';

async function seed() {
  console.log('🌱 Seeding AegisPay AI database...');
  await mongoose.connect(MONGODB_URI);

  const db = mongoose.connection.db!;

  // Clear existing data
  await db.collection('users').deleteMany({});
  await db.collection('orders').deleteMany({});
  await db.collection('escrow_accounts').deleteMany({});
  await db.collection('escrow_transactions').deleteMany({});
  await db.collection('trust_scores').deleteMany({});
  await db.collection('insurance_pool').deleteMany({});
  await db.collection('fraud_cases').deleteMany({});

  const hashedPassword = await bcrypt.hash('Admin@123456', 12);

  // ─── Seed Users ─────────────────────────────────────────────────────
  const users = await db.collection('users').insertMany([
    {
      firstName: 'Super', lastName: 'Admin',
      email: 'admin@aegispay.ai', password: hashedPassword,
      role: 'super_admin', status: 'active', emailVerified: true,
      createdAt: new Date(), updatedAt: new Date(),
    },
    {
      firstName: 'Arjun', lastName: 'Sharma',
      email: 'customer@aegispay.ai', password: hashedPassword,
      role: 'customer', status: 'active', emailVerified: true,
      phone: '+91 9876543210',
      createdAt: new Date(), updatedAt: new Date(),
    },
    {
      firstName: 'Priya', lastName: 'Merchants',
      email: 'merchant@aegispay.ai', password: hashedPassword,
      role: 'merchant', status: 'active', emailVerified: true,
      phone: '+91 9876543211',
      createdAt: new Date(), updatedAt: new Date(),
    },
    {
      firstName: 'Ravi', lastName: 'Driver',
      email: 'driver@aegispay.ai', password: hashedPassword,
      role: 'delivery_partner', status: 'active', emailVerified: true,
      phone: '+91 9876543212',
      createdAt: new Date(), updatedAt: new Date(),
    },
    {
      firstName: 'Admin', lastName: 'User',
      email: 'admin2@aegispay.ai', password: hashedPassword,
      role: 'admin', status: 'active', emailVerified: true,
      createdAt: new Date(), updatedAt: new Date(),
    },
  ]);

  const userIds = Object.values(users.insertedIds);
  const customerId = userIds[1];
  const merchantId = userIds[2];
  const driverId   = userIds[3];

  // ─── Seed Insurance Pool ─────────────────────────────────────────────
  await db.collection('insurance_pool').insertOne({
    poolId: 'main',
    totalBalance: 15420.50,
    totalContributions: 22000.00,
    totalClaims: 12,
    totalClaimsAmount: 6579.50,
    lossRatio: 0.299,
    transactionCount: 4400,
    createdAt: new Date(), updatedAt: new Date(),
  });

  // ─── Seed Trust Scores ───────────────────────────────────────────────
  await db.collection('trust_scores').insertMany([
    { userId: customerId, entityType: 'customer',          score: 88, totalOrders: 34,  successfulOrders: 32,  disputes: 1, refundsRequested: 2, fraudFlags: 0, lastCalculatedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
    { userId: merchantId, entityType: 'merchant',          score: 94, totalOrders: 156, successfulOrders: 150, disputes: 2, refundsRequested: 3, fraudFlags: 0, lastCalculatedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
    { userId: driverId,   entityType: 'delivery_partner',  score: 91, totalOrders: 289, successfulOrders: 285, disputes: 1, refundsRequested: 0, fraudFlags: 0, lastCalculatedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
  ]);

  // ─── Seed Orders + Escrow Accounts ──────────────────────────────────
  const orderConfigs = [
    {
      items: [{ name: 'Butter Chicken', quantity: 2, unitPrice: 280, totalPrice: 560 }, { name: 'Garlic Naan', quantity: 4, unitPrice: 50, totalPrice: 200 }],
      orderStatus: 'in_transit',
      escrowState: 'IN_TRANSIT',
      escrowId: 'ESC-DEMO-001',
      daysAgo: 0,
    },
    {
      items: [{ name: 'Chicken Biryani', quantity: 1, unitPrice: 350, totalPrice: 350 }, { name: 'Raita', quantity: 1, unitPrice: 60, totalPrice: 60 }],
      orderStatus: 'in_transit',
      escrowState: 'OTP_PENDING',
      escrowId: 'ESC-DEMO-002',
      daysAgo: 0,
      otpCode: '$2a$10$demo_otp_placeholder', // will be replaced when customer generates real OTP
    },
    {
      items: [{ name: 'Margherita Pizza', quantity: 1, unitPrice: 299, totalPrice: 299 }, { name: 'Pepsi', quantity: 2, unitPrice: 60, totalPrice: 120 }],
      orderStatus: 'delivered',
      escrowState: 'SETTLED',
      escrowId: 'ESC-DEMO-003',
      daysAgo: 1,
      settledAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      items: [{ name: 'Paneer Butter Masala', quantity: 2, unitPrice: 260, totalPrice: 520 }, { name: 'Roti', quantity: 6, unitPrice: 25, totalPrice: 150 }],
      orderStatus: 'delivered',
      escrowState: 'SETTLED',
      escrowId: 'ESC-DEMO-004',
      daysAgo: 2,
      settledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      items: [{ name: 'Dal Makhani', quantity: 1, unitPrice: 220, totalPrice: 220 }, { name: 'Jeera Rice', quantity: 1, unitPrice: 180, totalPrice: 180 }],
      orderStatus: 'cancelled',
      escrowState: 'REFUNDED',
      escrowId: 'ESC-DEMO-005',
      daysAgo: 3,
    },
  ];

  for (let i = 0; i < orderConfigs.length; i++) {
    const cfg = orderConfigs[i];
    const subtotal = cfg.items.reduce((s: number, it: any) => s + it.totalPrice, 0);
    const totalAmount = Math.round(subtotal + 40 + subtotal * 0.05);
    const insurance = Math.round(totalAmount * 0.005 * 100) / 100;
    const locked = totalAmount - insurance;

    const orderResult = await db.collection('orders').insertOne({
      orderNumber: `AGP-2024-${String(1000 + i).padStart(4, '0')}`,
      customerId,
      merchantId,
      deliveryPartnerId: driverId,
      orderType: 'food_delivery',
      status: cfg.orderStatus,
      items: cfg.items,
      subtotal,
      deliveryFee: 40,
      taxes: Math.round(subtotal * 0.05),
      discount: 0,
      totalAmount,
      deliveryAddress: {
        line1: `${i + 1} Marine Drive`,
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India',
      },
      createdAt: new Date(Date.now() - cfg.daysAgo * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    });

    await db.collection('escrow_accounts').insertOne({
      escrowId: cfg.escrowId,
      orderId: orderResult.insertedId,
      customerId,
      merchantId,
      deliveryPartnerId: driverId,
      totalAmount,
      lockedAmount: locked,
      releasedAmount: cfg.escrowState === 'SETTLED' ? locked : 0,
      refundedAmount: cfg.escrowState === 'REFUNDED' ? locked : 0,
      insuranceContribution: insurance,
      state: cfg.escrowState,
      settledAt: cfg.settledAt ?? null,
      otpCode: null,
      otpExpiresAt: null,
      otpVerifiedAt: null,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - cfg.daysAgo * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    });
  }

  // ─── Seed some extra historical orders ──────────────────────────────
  const histStatuses = ['delivered', 'delivered', 'delivered', 'cancelled', 'delivered'];
  const histItems = [
    [{ name: 'Masala Dosa', quantity: 2, unitPrice: 120, totalPrice: 240 }],
    [{ name: 'Veg Thali', quantity: 1, unitPrice: 280, totalPrice: 280 }],
    [{ name: 'Chicken Tikka', quantity: 1, unitPrice: 420, totalPrice: 420 }],
    [{ name: 'Chole Bhature', quantity: 2, unitPrice: 150, totalPrice: 300 }],
    [{ name: 'Fish Curry', quantity: 1, unitPrice: 380, totalPrice: 380 }, { name: 'Rice', quantity: 1, unitPrice: 80, totalPrice: 80 }],
  ];
  for (let i = 0; i < histStatuses.length; i++) {
    const items = histItems[i];
    const subtotal = items.reduce((s, it) => s + it.totalPrice, 0);
    const totalAmount = Math.round(subtotal + 40 + subtotal * 0.05);
    await db.collection('orders').insertOne({
      orderNumber: `AGP-2024-${String(2000 + i).padStart(4, '0')}`,
      customerId,
      merchantId,
      deliveryPartnerId: driverId,
      orderType: 'food_delivery',
      status: histStatuses[i],
      items,
      subtotal,
      deliveryFee: 40,
      taxes: Math.round(subtotal * 0.05),
      discount: 0,
      totalAmount,
      deliveryAddress: { line1: '5 Park Street', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', country: 'India' },
      createdAt: new Date(Date.now() - (i + 5) * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    });
  }

  console.log('\n✅ Seeding complete!');
  console.log('\n📋 Test Accounts:');
  console.log('  Super Admin: admin@aegispay.ai / Admin@123456');
  console.log('  Customer:    customer@aegispay.ai / Admin@123456');
  console.log('  Merchant:    merchant@aegispay.ai / Admin@123456');
  console.log('  Driver:      driver@aegispay.ai / Admin@123456');
  console.log('  Admin:       admin2@aegispay.ai / Admin@123456');
  console.log('\n🔒 Active Escrows Seeded:');
  console.log('  ESC-DEMO-001 → IN_TRANSIT (customer can generate OTP)');
  console.log('  ESC-DEMO-002 → OTP_PENDING (customer can generate OTP)');
  console.log('  ESC-DEMO-003 → SETTLED');
  console.log('  ESC-DEMO-004 → SETTLED');
  console.log('  ESC-DEMO-005 → REFUNDED');

  await mongoose.disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });
