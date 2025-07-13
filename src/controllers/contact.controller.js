const { sendContactEmail } = require('../utils/email');

class ContactController {
  // Send contact email
  async sendContactMessage(req, res) {
    try {
      const { name, email, phone, subject, message } = req.body;

      // Validate required fields
      if (!name || !email || !message) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and message are required'
        });
      }

      // Send email to business
      await sendContactEmail({
        from: email,
        name,
        phone,
        subject: subject || 'New Contact Form Submission',
        message
      });

      res.status(200).json({
        success: true,
        message: 'Your message has been sent successfully. We will get back to you soon!'
      });
    } catch (error) {
      console.error('Contact form error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send message. Please try again later.'
      });
    }
  }

  // Get WhatsApp contact info
  async getWhatsAppInfo(req, res) {
    try {
      const whatsappNumber = '+2348032549466';
      const whatsappLink = `https://wa.me/2348032549466`;
      
      res.status(200).json({
        success: true,
        data: {
          number: whatsappNumber,
          link: whatsappLink,
          message: 'Hello! I would like to know more about Marksjaf services.'
        }
      });
    } catch (error) {
      console.error('WhatsApp info error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get WhatsApp information'
      });
    }
  }

  // Generate WhatsApp link with custom message
  async generateWhatsAppLink(req, res) {
    try {
      const { message } = req.body;
      const whatsappNumber = '2348032549466';
      const defaultMessage = 'Hello! I would like to know more about Marksjaf services.';
      const finalMessage = message || defaultMessage;
      
      const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(finalMessage)}`;
      
      res.status(200).json({
        success: true,
        data: {
          link: whatsappLink,
          number: `+${whatsappNumber}`,
          message: finalMessage
        }
      });
    } catch (error) {
      console.error('WhatsApp link generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate WhatsApp link'
      });
    }
  }
}

module.exports = new ContactController();