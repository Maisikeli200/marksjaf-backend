const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const crypto = require('crypto');
const { generateUUID } = require('../utils/uuid'); // Fix this line

const prisma = new PrismaClient();

// Initialize consultancy booking with Paystack payment
const initializeConsultancy = async (req, res, next) => {
  try {
    const { 
      consultancy_type, 
      custom_type, 
      description, 
      preferred_date, 
      preferred_time 
    } = req.body;
    
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Validate required fields
    if (!consultancy_type || !description || !preferred_date || !preferred_time) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get user details
    const user = await prisma.users.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Fixed amount for consultancy
    const consultancyAmount = 20000; // ₦20,000

    // Create the consultancy booking
    const booking = await prisma.consultancy_bookings.create({
      data: {
        id: generateUUID(), // Add manual UUID generation
        user_id: userId,
        consultancy_type: consultancy_type === 'other' ? custom_type : consultancy_type,
        description,
        session_datetime: new Date(`${preferred_date}T${preferred_time}`),
        amount: consultancyAmount,
        status: 'pending',
        payment_status: 'pending'
      }
    });

    // Initialize Paystack transaction
    const paystackData = {
      email: user.email,
      amount: consultancyAmount * 100, // Paystack expects amount in kobo
      reference: `CONS-${booking.id}-${Date.now()}`,
      callback_url: `${process.env.FRONTEND_URL}/checkout/callback?type=consultation`,
      metadata: {
        booking_id: booking.id,
        user_id: userId,
        consultancy_type: booking.consultancy_type,
        custom_fields: [
          {
            display_name: "Booking ID",
            variable_name: "booking_id",
            value: booking.id
          },
          {
            display_name: "Consultancy Type",
            variable_name: "consultancy_type",
            value: booking.consultancy_type
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

    // Update booking with payment reference
    await prisma.consultancy_bookings.update({
      where: { id: booking.id },
      data: {
        payment_reference: paystackData.reference
      }
    });

    res.status(200).json({
      success: true,
      message: 'Consultancy booking initialized successfully',
      data: {
        booking_id: booking.id,
        payment_url: paystackResponse.data.data.authorization_url,
        reference: paystackData.reference,
        amount: consultancyAmount
      }
    });

  } catch (error) {
    console.error('Error initializing consultancy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize consultancy booking',
      error: error.message
    });
  }
};

// Paystack webhook for consultancy payments
const consultancyWebhook = async (req, res) => {
  try {
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body;

    if (event.event === 'charge.success') {
      const { reference, amount, status } = event.data;
      
      // Find booking by payment reference
      const booking = await prisma.consultancy_bookings.findFirst({
        where: { payment_reference: reference }
      });

      if (!booking) {
        console.error('Booking not found for reference:', reference);
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Verify amount matches (convert from kobo to naira)
      const paidAmount = amount / 100;
      if (paidAmount !== booking.amount) {
        console.error('Amount mismatch:', { expected: booking.amount, received: paidAmount });
        return res.status(400).json({ error: 'Amount mismatch' });
      }

      // Update booking status
      await prisma.consultancy_bookings.update({
        where: { id: booking.id },
        data: {
          payment_status: 'paid',
          status: 'confirmed'
        }
      });

      console.log(`Consultancy booking ${booking.id} payment confirmed`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Consultancy webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// Get user's consultancy bookings
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const bookings = await prisma.consultancy_bookings.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings'
    });
  }
};

// Get single booking details
const getBookingDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const booking = await prisma.consultancy_bookings.findFirst({
      where: { 
        id: id,
        user_id: userId 
      },
      include: {
        users: {
          select: {
            first_name: true,    // Changed from firstName
            last_name: true,     // Changed from lastName
            email: true,
            phone_number: true   // Changed from phoneNumber
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking details'
    });
  }
};

// Verify consultancy payment
const verifyPayment = async (req, res, next) => {
  try {
    const { reference } = req.query;

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
      // Find and update booking
      const booking = await prisma.consultancy_bookings.findFirst({
        where: { payment_reference: reference }
      });

      if (booking && booking.payment_status !== 'paid') {
        await prisma.consultancy_bookings.update({
          where: { id: booking.id },
          data: {
            payment_status: 'paid',
            status: 'confirmed'
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          status: data.status,
          reference: data.reference,
          amount: data.amount / 100,
          booking: booking
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
};

module.exports = {
  initializeConsultancy,
  consultancyWebhook,
  getUserBookings,
  getBookingDetails,
  verifyPayment
};
