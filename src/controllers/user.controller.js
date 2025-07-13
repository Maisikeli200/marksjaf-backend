const { PrismaClient } = require('@prisma/client');
const { generateUUID } = require('../utils/uuid');
const prisma = new PrismaClient();

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, phoneNumber } = req.body;

    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        email: updatedUser.email,
        phoneNumber: updatedUser.phone_number
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// Create new address
const createAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { street_address, apartment_number, city, state, zip_code, phoneNumber, is_default } = req.body;

    // If this is set as default, unset other default addresses
    if (is_default) {
      await prisma.delivery_addresses.updateMany({
        where: { user_id: userId },
        data: { is_primary: false }
      });
    }

    // Combine street_address and apartment_number into address field
    const fullAddress = apartment_number ? `${street_address}, ${apartment_number}` : street_address;
    
    // Generate UUID for new address
    const addressId = generateUUID();

    const newAddress = await prisma.delivery_addresses.create({
      data: {
        id: addressId,
        user_id: userId,
        address: fullAddress,
        city,
        state,
        postal_code: zip_code,
        phone_number: phoneNumber,
        is_primary: is_default || false
      }
    });

    res.json({
      success: true,
      message: 'Address created successfully',
      address: {
        id: newAddress.id,
        street_address: newAddress.address,
        city: newAddress.city,
        state: newAddress.state,
        zip_code: newAddress.postal_code,
        phoneNumber: newAddress.phone_number,
        is_default: newAddress.is_primary
      }
    });
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create address'
    });
  }
};

// Update existing address
const updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id; //  Keep as UUID string
    const { street_address, apartment_number, city, state, zip_code, phoneNumber, is_default } = req.body;

    // Verify the address belongs to the user
    const existingAddress = await prisma.delivery_addresses.findFirst({
      where: {
        id: addressId, //  Use UUID string directly
        user_id: userId
      }
    });

    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // If this is set as default, unset other default addresses
    if (is_default) {
      await prisma.delivery_addresses.updateMany({
        where: {
          user_id: userId,
          id: { not: addressId }
        },
        data: { is_primary: false } //  Use correct database field
      });
    }

    //  Combine street_address and apartment_number like in createAddress
    const fullAddress = apartment_number ? `${street_address}, ${apartment_number}` : street_address;

    const updatedAddress = await prisma.delivery_addresses.update({
      where: { id: addressId },
      data: {
        address: fullAddress,        //  Map street_address to address
        city,
        state,
        postal_code: zip_code,       //  Map zip_code to postal_code
        phone_number: phoneNumber,
        is_primary: is_default || false //  Map is_default to is_primary
      }
    });

    res.json({
      success: true,
      message: 'Address updated successfully',
      address: {
        id: updatedAddress.id,
        street_address: updatedAddress.address,  //  Map back to frontend format
        city: updatedAddress.city,
        state: updatedAddress.state,
        zip_code: updatedAddress.postal_code,    //  Map back to frontend format
        phoneNumber: updatedAddress.phone_number,
        is_default: updatedAddress.is_primary    //  Map back to frontend format
      }
    });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update address'
    });
  }
};

module.exports = {
  updateProfile,
  createAddress,
  updateAddress
};