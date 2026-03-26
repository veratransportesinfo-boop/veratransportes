const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: parseInt(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Send ride summary email to passenger
 * @param {object} rideDetails - Ride information
 * @param {string} recipientEmail - Passenger's email address
 */
const sendRideSummaryEmail = async (rideDetails, recipientEmail) => {
  const { origin, destination, distanceKm, price, rideId, passengerName, createdAt } = rideDetails;

  const formattedDate = new Date(createdAt).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ride Summary - Transportes App</title>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; letter-spacing: 1px; }
        .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
        .body { padding: 30px; }
        .greeting { font-size: 16px; color: #333; margin-bottom: 20px; }
        .ride-card { background: #f8f9ff; border: 1px solid #e0e4ff; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .ride-card h2 { margin: 0 0 16px; color: #667eea; font-size: 18px; }
        .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { color: #666; font-size: 14px; font-weight: 600; }
        .detail-value { color: #333; font-size: 14px; text-align: right; max-width: 60%; }
        .price-row { background: #667eea; border-radius: 6px; padding: 14px 16px; margin-top: 16px; }
        .price-row .detail-label { color: rgba(255,255,255,0.85); }
        .price-row .detail-value { color: white; font-size: 22px; font-weight: bold; }
        .route { display: flex; align-items: center; gap: 10px; margin: 16px 0; }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot-green { background: #22c55e; }
        .dot-red { background: #ef4444; }
        .line { width: 2px; height: 30px; background: #ddd; margin-left: 4px; }
        .route-point { font-size: 14px; color: #333; }
        .footer { background: #f4f4f4; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
        .footer a { color: #667eea; text-decoration: none; }
        .badge { display: inline-block; background: #fef3c7; color: #d97706; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Transportes App</h1>
          <p>Your ride has been successfully requested!</p>
        </div>
        <div class="body">
          <p class="greeting">Hi <strong>${passengerName || 'Passenger'}</strong>,</p>
          <p style="color: #555; font-size: 14px; line-height: 1.6;">
            Your ride request has been received and is pending confirmation. Here's a summary of your trip:
          </p>

          <div class="ride-card">
            <h2>Trip Details</h2>

            <div class="detail-row">
              <span class="detail-label">Ride ID</span>
              <span class="detail-value">#${rideId}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Origin</span>
              <span class="detail-value">${origin}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Destination</span>
              <span class="detail-value">${destination}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Distance</span>
              <span class="detail-value">${distanceKm} km</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Date &amp; Time</span>
              <span class="detail-value">${formattedDate}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Status</span>
              <span class="detail-value"><span class="badge">Pending</span></span>
            </div>

            <div class="price-row detail-row">
              <span class="detail-label">Total Price</span>
              <span class="detail-value">$${parseFloat(price).toFixed(2)}</span>
            </div>
          </div>

          <p style="color: #555; font-size: 13px; line-height: 1.6;">
            <strong>Price breakdown:</strong> $2.50 base fare + ($1.20 × ${distanceKm} km) = <strong>$${parseFloat(price).toFixed(2)}</strong>
          </p>

          <p style="color: #555; font-size: 13px; line-height: 1.6;">
            A driver will be assigned shortly. You will receive updates on your ride status.
          </p>
        </div>
        <div class="footer">
          <p>This email was sent by <strong>Transportes App</strong>. Please do not reply to this email.</p>
          <p>If you didn't request this ride, please contact us immediately.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
TRANSPORTES APP - Ride Confirmation

Hi ${passengerName || 'Passenger'},

Your ride request has been received!

TRIP DETAILS:
- Ride ID: #${rideId}
- Origin: ${origin}
- Destination: ${destination}
- Distance: ${distanceKm} km
- Date: ${formattedDate}
- Status: Pending
- Total Price: $${parseFloat(price).toFixed(2)}

Price breakdown: $2.50 base fare + ($1.20 x ${distanceKm} km) = $${parseFloat(price).toFixed(2)}

A driver will be assigned shortly.

Transportes App Team
  `;

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Transportes App" <${process.env.EMAIL_FROM}>`,
      to: recipientEmail,
      subject: `Ride Confirmed #${rideId} - From ${origin} to ${destination}`,
      text: textContent,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('Error sending email:', err.message);
    // Don't throw - email failure should not block ride creation
    return { success: false, error: err.message };
  }
};

module.exports = { sendRideSummaryEmail };
