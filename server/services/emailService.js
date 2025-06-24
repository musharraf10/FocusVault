import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendVerificationEmail(user, token) {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: "Verify Your Email - Focus Vault",
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Focus Vault!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${user.name},</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Thank you for joining Focus Vault! To get started with your learning journey, 
              please verify your email address by clicking the button below.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: bold;
                        display: inline-block;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            
            <p style="color: #8B5CF6; word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px;">
              ${verificationUrl}
            </p>
            
            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              This link will expire in 24 hours. If you didn't create an account with Focus Vault, 
              you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Verification email sent to ${user.email}`);
    } catch (error) {
      console.error("Failed to send verification email:", error);
      throw error;
    }
  }

  async sendStudyReminder(user) {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: "It's Your Study Time! 📚 - Focus Vault",
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📚 Study Time Reminder</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">Hey ${user.name}! 👋</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              It's your preferred study time! Don't let your learning streak break. 
              Jump back into Focus Vault and continue your educational journey.
            </p>
            
            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #1976d2; margin: 0; font-weight: bold;">
                🔥 Current Streak: ${user.stats.currentStreak} days
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}" 
                 style="background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: bold;
                        display: inline-block;">
                Start Studying Now 🚀
              </a>
            </div>
            
            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              You can disable these reminders in your profile settings.
            </p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Study reminder sent to ${user.email}`);
    } catch (error) {
      console.error("Failed to send study reminder:", error);
      throw error;
    }
  }

  async sendPasswordResetEmail(user, token) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: "Reset Your Password - Focus Vault",
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Reset Your Password</h1>
          </div>
  
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${
              user.name || "there"
            },</h2>
  
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              We received a request to reset your Focus Vault password. If this was you, click the button below to reset it:
            </p>
  
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
                        color: white;
                        padding: 15px 30px;
                        text-decoration: none;
                        border-radius: 8px;
                        font-weight: bold;
                        display: inline-block;">
                Reset Password
              </a>
            </div>
  
            <p style="color: #666; line-height: 1.6;">
              If the button doesn't work, paste this URL into your browser:
            </p>
  
            <p style="color: #ef4444; word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px;">
              ${resetUrl}
            </p>
  
            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${user.email}`);
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      throw error;
    }
  }

  async sendCalendarNotification(user, todayEvents, tomorrowEvents) {
    const formatEventsList = (events) => {
      return events
        .map((event) => {
          const time = event.startTime ? ` at ${event.startTime}` : "";
          return `<li style="margin-bottom: 8px;">
          <strong>${event.title}</strong>${time}
          ${
            event.description
              ? `<br><span style="color: #666; font-size: 14px;">${event.description}</span>`
              : ""
          }
        </li>`;
        })
        .join("");
    };

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: "📅 Your Upcoming Events - Focus Vault",
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📅 Upcoming Events</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${
              user.name
            }! 👋</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Here are your upcoming events to help you stay organized and prepared.
            </p>
            
            ${
              todayEvents.length > 0
                ? `
              <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #2e7d32; margin: 0 0 15px 0;">📅 Today's Events</h3>
                <ul style="margin: 0; padding-left: 20px; color: #333;">
                  ${formatEventsList(todayEvents)}
                </ul>
              </div>
            `
                : ""
            }
            
            ${
              tomorrowEvents.length > 0
                ? `
              <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #f57c00; margin: 0 0 15px 0;">📅 Tomorrow's Events</h3>
                <ul style="margin: 0; padding-left: 20px; color: #333;">
                  ${formatEventsList(tomorrowEvents)}
                </ul>
              </div>
            `
                : ""
            }
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}/calendar" 
                 style="background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: bold;
                        display: inline-block;">
                View Full Calendar 📅
              </a>
            </div>
            
            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              You can manage your notification preferences in your profile settings.
            </p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Calendar notification sent to ${user.email}`);
    } catch (error) {
      console.error("Failed to send calendar notification:", error);
      throw error;
    }
  }
}

export default new EmailService();
