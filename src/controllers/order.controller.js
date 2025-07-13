const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const crypto = require('crypto');
const { generateUUID } = require('../utils/uuid');

const prisma = new PrismaClient();

// Add this function at the top level, after imports
const emitOrderNotification = async (orderId) => {
  try {
    // Get complete order details for notification
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        users: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            phone_number: true
          }
        },
        order_items: {
          include: {
            items: {
              select: {
                name: true,
                price: true
              }
            }
          }
        },
        delivery_addresses: {
          select: {
            address: true,
            city: true,
            state: true,
            zip_code: true
          }
        }
      }
    })

    if (order && global.io) {
      const notificationData = {
        orderId: order.id,
        customerName: `${order.users.first_name} ${order.users.last_name}`,
        customerEmail: order.users.email,
        customerPhone: order.users.phone_number,
        orderType: order.order_type,
        totalAmount: order.total_amount,
        items: order.order_items.map(item => ({
          name: item.items.name,
          quantity: item.quantity,
          price: item.unit_price
        })),
        deliveryAddress: order.delivery_addresses ? {
          address: order.delivery_addresses.address,
          city: order.delivery_addresses.city,
          state: order.delivery_addresses.state,
          zipCode: order.delivery_addresses.zip_code
        } : null,
        timestamp: new Date().toISOString(),
        specialRequests: order.special_requests || null
      }

      // Emit to all connected desktop clients
      global.io.emit('new_online_order', notificationData)
      console.log('📱 Order notification sent to desktop app:', order.id)
    }
  } catch (error) {
    console.error('Error emitting order notification:', error)
  }
}

// Initialize Paystack transaction
const initializeOrder = async (req, res, next) => {
  try {
    const { items, delivery_address_id, order_type } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Validate stock and calculate total from database prices
    let calculatedTotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const dbItem = await prisma.items.findUnique({
        where: { id: item.item_id }
      });

      if (!dbItem) {
        return res.status(400).json({
          success: false,
          message: `Item with ID ${item.item_id} not found`
        });
      }

      if (dbItem.stock_quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${dbItem.name}. Available: ${dbItem.stock_quantity}, Requested: ${item.quantity}`
        });
      }

      const itemTotal = dbItem.price * item.quantity;
      calculatedTotal += itemTotal;

      validatedItems.push({
        item_id: item.item_id,
        quantity: item.quantity,
        price: dbItem.price,
        name: dbItem.name
      });
    }

    // Add delivery fee for delivery orders
    // Set delivery fee to 0 since delivery is free
    const deliveryFee = 0;
    const totalAmount = calculatedTotal + deliveryFee; // Changed from 'subtotal' to 'calculatedTotal'

    // Get user details
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        delivery_addresses: {
          where: { id: delivery_address_id }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (order_type === 'delivery' && (!user.delivery_addresses || user.delivery_addresses.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address not found'
      });
    }

    // Generate UUID for new order
    const orderId = generateUUID();

    // Create pending order
    const order = await prisma.orders.create({
      data: {
        id: orderId,
        user_id: userId,
        delivery_address_id: order_type === 'delivery' ? delivery_address_id : null,
        order_type,
        status: 'pending',
        payment_status: 'pending',
        total_amount: totalAmount,
        order_items: {
          create: validatedItems.map(item => ({
            id: generateUUID(), // Generate UUID for each order item
            item_id: item.item_id,
            quantity: item.quantity,
            unit_price: item.price,
            subtotal: item.price * item.quantity
          }))
        }
      },
      include: {
        order_items: {
          include: {
            items: true
          }
        }
      }
    });

    // Initialize Paystack transaction
    const paystackData = {
      email: user.email,
      amount: totalAmount * 100, // Paystack expects amount in kobo
      reference: `ORD-${order.id}-${Date.now()}`,
      callback_url: `${process.env.FRONTEND_URL}/checkout/callback?type=order`,
      metadata: {
        order_id: order.id,
        user_id: userId,
        custom_fields: [
          {
            display_name: "Order ID",
            variable_name: "order_id",
            value: order.id
          }
        ]
      }
    };

    const paystackResponse = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      paystackData,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!paystackResponse.data.status) {
      throw new Error('Failed to initialize Paystack transaction');
    }

    // Update order with payment reference
    await prisma.orders.update({
      where: { id: order.id },
      data: {
        payment_reference: paystackData.reference
      }
    });

    res.status(200).json({
      success: true,
      data: {
        order_id: order.id,
        payment_url: paystackResponse.data.data.authorization_url,
        reference: paystackData.reference,
        amount: totalAmount
      }
    });

  } catch (error) {
    console.error('Order initialization error:', error);
    next(error);
  }
};

// Enhanced Paystack webhook with proper security
const paystackWebhook = async (req, res, next) => {
  try {
    // Verify the webhook signature
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
                  .update(JSON.stringify(req.body))
                  .digest('hex');

    const signature = req.headers['x-paystack-signature'];

    if (hash !== signature) {
      console.log('Invalid webhook signature');
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    const event = req.body;
    
    // Verify the event is from Paystack by making an API call
    if (event.event === 'charge.success') {
      const reference = event.data.reference;
      
      // Verify transaction with Paystack API
      const verificationResponse = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const verificationData = verificationResponse.data;
      
      if (!verificationData.status || verificationData.data.status !== 'success') {
        console.log('Transaction verification failed:', verificationData);
        return res.status(400).json({
          success: false,
          message: 'Transaction verification failed'
        });
      }

      // Find the order by reference (FIXED: using payment_reference)
      const order = await prisma.orders.findFirst({
        where: { payment_reference: reference }
      });

      if (!order) {
        console.log('Order not found for reference:', reference);
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Verify amount matches
      const expectedAmount = Math.round(order.total_amount * 100); // Convert to kobo
      const paidAmount = verificationData.data.amount;
      
      if (expectedAmount !== paidAmount) {
        console.log('Amount mismatch:', { expected: expectedAmount, paid: paidAmount });
        return res.status(400).json({
          success: false,
          message: 'Amount mismatch'
        });
      }

      // Update order status in a transaction (FIXED: Added proper transaction wrapper)
      await prisma.$transaction(async (tx) => {
        // Update order
        await tx.orders.update({
          where: { id: order.id },
          data: {
            payment_status: 'completed',
            status: 'confirmed',
            paid_at: new Date()
          }
        });

        // Update stock quantities
        const orderItems = await tx.order_items.findMany({
          where: { order_id: order.id },
          include: { items: true }
        });

        for (const orderItem of orderItems) {
          await tx.items.update({
            where: { id: orderItem.item_id },
            data: {
              stock_quantity: {
                decrement: orderItem.quantity
              }
            }
          });
        }
      });

      // 🔔 EMIT NOTIFICATION TO DESKTOP APP (FIXED: Moved outside transaction)
      await emitOrderNotification(order.id);

      console.log('Payment confirmed for order:', order.id);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    next(error);
  }
};

// Verify payment (optional endpoint for manual verification)
const verifyPayment = async (req, res, next) => {
  try {
    const { reference } = req.params;

    const paystackResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const { data } = paystackResponse.data;

    if (data.status === 'success') {
      // Find and update order
      const order = await prisma.orders.findFirst({
        where: { payment_reference: reference }
      });

      if (order && order.payment_status !== 'completed') {
        await prisma.orders.update({
          where: { id: order.id },
          data: {
            payment_status: 'completed',  // Changed from 'paid' to 'completed'
            status: 'confirmed'
          }
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        status: data.status,
        reference: data.reference,
        amount: data.amount / 100
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    next(error);
  }
};

// Add UUID validation function
const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Get order details
const getOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Validate UUID format
    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      })
    }

    const order = await prisma.orders.findFirst({
      where: {
        id: id, // Keep as string since it's a UUID
        user_id: userId
      },
      include: {
        order_items: {
          include: {
            items: true // Changed from 'item' to 'items'
          }
        },
        delivery_addresses: true // Changed from 'delivery_address' to 'delivery_addresses'
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      order: order
    });

  } catch (error) {
    console.error('Get order error:', error);
    next(error);
  }
};

// Get all orders for a user with pagination and filtering
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id
    const { 
      page = 1, 
      limit = 10, 
      status, 
      payment_status, 
      search 
    } = req.query

    const offset = (parseInt(page) - 1) * parseInt(limit)
    
    // Build where clause
    const whereClause = {
      user_id: userId
    }
    
    if (status) {
      whereClause.status = status
    }
    
    if (payment_status) {
      whereClause.payment_status = payment_status
    }
    
    if (search) {
      whereClause.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { payment_reference: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get total count
    const totalCount = await prisma.orders.count({
      where: whereClause
    })

    // Get orders with pagination
    const orders = await prisma.orders.findMany({
      where: whereClause,
      include: {
        order_items: {
          include: {
            items: {
              select: {
                id: true,
                name: true,
                price: true
              }
            }
          }
        },
        delivery_addresses: true
      },
      orderBy: {
        created_at: 'desc'
      },
      skip: offset,
      take: parseInt(limit)
    })

    const totalPages = Math.ceil(totalCount / parseInt(limit))

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages
      }
    })
  } catch (error) {
    console.error('Error fetching user orders:', error)
    res.status(500).json({ 
      message: 'Failed to fetch orders',
      error: error.message 
    })
  }
}

// Add this function to the existing controller
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    // Find order and verify ownership + status
    const order = await prisma.orders.findFirst({
      where: { 
        id: id,
        user_id: userId,
        status: 'pending' // Only allow cancellation of pending orders
      },
      include: { order_items: true }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or cannot be cancelled. Only pending orders can be cancelled.'
      });
    }

    // Update order status
    const updatedOrder = await prisma.orders.update({
      where: { id: id },
      data: {
        status: 'cancelled',
        notes: reason ? `Cancellation reason: ${reason}` : 'Order cancelled by user',
        updated_at: new Date()
      }
    });

    // Restore stock quantities
    for (const item of order.order_items) {
      await prisma.items.update({
        where: { id: item.item_id },
        data: {
          stock_quantity: {
            increment: item.quantity
          }
        }
      });
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  }
};

// Update the module.exports
module.exports = {
  initializeOrder,
  paystackWebhook,
  verifyPayment,
  getOrder,
  getUserOrders,
  cancelOrder // Add this
}