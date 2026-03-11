import { Response } from 'express';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import { UserProfile, IUserProfile } from '../models/UserProfile';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';

// Maximum file size in bytes (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_PROFILE = 20;

// Valid file types
const VALID_FILE_TYPES = ['cv', 'portfolio', 'certificate'] as const;
type ValidFileType = typeof VALID_FILE_TYPES[number];

// Email transporter (same config as in emailService)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export class ProfileController {
  // GET PROFILE
  async getProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'Invalid user ID format' });
      }

      let profile = await UserProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) });

      if (!profile) {
        profile = new UserProfile({
          userId: new mongoose.Types.ObjectId(userId),
          bio: '',
          skills: [],
          experience: [],
          education: [],
          files: []
        });
        await profile.save();
      }

      res.json({ profile });
    } catch (error) {
      console.error(' Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  //UPDATE PROFILE
  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'Invalid user ID format' });
      }

      const { bio, skills, experience, education } = req.body;

      // Validate input types
      if (bio !== undefined && typeof bio !== 'string') {
        return res.status(400).json({ error: 'Bio must be a string' });
      }

      if (skills !== undefined && !Array.isArray(skills)) {
        return res.status(400).json({ error: 'Skills must be an array' });
      }

      if (experience !== undefined && !Array.isArray(experience)) {
        return res.status(400).json({ error: 'Experience must be an array' });
      }

      if (education !== undefined && !Array.isArray(education)) {
        return res.status(400).json({ error: 'Education must be an array' });
      }

      // Validate experience items if provided
      if (experience) {
        for (const exp of experience) {
          if (!exp.title || !exp.company || !exp.years) {
            return res.status(400).json({
              error: 'Each experience must have title, company, and years'
            });
          }
        }
      }

      // Validate education items if provided
      if (education) {
        for (const edu of education) {
          if (!edu.degree || !edu.institution || !edu.year) {
            return res.status(400).json({
              error: 'Each education must have degree, institution, and year'
            });
          }
        }
      }

      const profile = await UserProfile.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        {
          bio: bio || '',
          skills: skills || [],
          experience: experience || [],
          education: education || []
        },
        {
          new: true,
          upsert: true,
          runValidators: true
        }
      );

      // Send email to admin (fire and forget) 
      this.sendProfileUpdateEmail(userId, profile).catch(err => {
        console.error('Failed to send profile update email:', err);
      });

      res.json({ profile });
    } catch (error) {
      console.error(' Update profile error:', error);

      if (error instanceof mongoose.Error.ValidationError) {
        return res.status(400).json({ error: error.message });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  //  UPLOAD FILE
  async uploadFile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'Invalid user ID format' });
      }

      const { name, type, url, size } = req.body;

      // Validate required fields
      if (!name || !type || !url || size === undefined) {
        return res.status(400).json({
          error: 'Missing required fields: name, type, url, and size are required'
        });
      }

      // Validate file type
      if (!VALID_FILE_TYPES.includes(type as ValidFileType)) {
        return res.status(400).json({
          error: `Invalid file type. Must be one of: ${VALID_FILE_TYPES.join(', ')}`
        });
      }

      // Validate file name
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'File name must be a non-empty string' });
      }

      // Accept both http and data URLs
      if (typeof url !== 'string' || (!url.startsWith('http') && !url.startsWith('data:'))) {
        return res.status(400).json({ error: 'Invalid URL format' });
      }

      // Validate file size
      if (typeof size !== 'number' || size <= 0) {
        return res.status(400).json({ error: 'File size must be a positive number' });
      }

      if (size > MAX_FILE_SIZE) {
        return res.status(413).json({
          error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
        });
      }

      // Check total files count
      const currentProfile = await UserProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) });
      if (currentProfile && currentProfile.files.length >= MAX_FILES_PER_PROFILE) {
        return res.status(400).json({
          error: `Maximum number of files reached (${MAX_FILES_PER_PROFILE}).`
        });
      }

      // Create new file object
      const newFile = {
        _id: new mongoose.Types.ObjectId(),
        name: name.trim(),
        type,
        url,
        size,
        uploadedAt: new Date()
      };

      // Add file to profile
      const profile = await UserProfile.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        { $push: { files: newFile } },
        {
          new: true,
          upsert: true,
          runValidators: true
        }
      );

      res.json({ profile });
    } catch (error) {
      console.error(' Upload file error:', error);

      if (error instanceof mongoose.Error.ValidationError) {
        return res.status(400).json({ error: error.message });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // DELETE FILE 
  async deleteFile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'Invalid user ID format' });
      }

      const { fileId } = req.params;

      if (!fileId) {
        return res.status(400).json({ error: 'File ID is required' });
      }

      if (!mongoose.Types.ObjectId.isValid(fileId)) {
        return res.status(400).json({ error: 'Invalid file ID format' });
      }

      const profile = await UserProfile.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        { $pull: { files: { _id: new mongoose.Types.ObjectId(fileId) } } },
        { new: true }
      );

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      res.json({ profile });
    } catch (error) {
      console.error(' Delete file error:', error);

      if (error instanceof Error && error.name === 'BSONError') {
        return res.status(400).json({ error: 'Invalid file ID format' });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET SINGLE FILE
  async getFile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'Invalid user ID format' });
      }

      const { fileId } = req.params;

      if (!fileId) {
        return res.status(400).json({ error: 'File ID is required' });
      }

      if (!mongoose.Types.ObjectId.isValid(fileId)) {
        return res.status(400).json({ error: 'Invalid file ID format' });
      }

      const profile = await UserProfile.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        'files._id': new mongoose.Types.ObjectId(fileId)
      });

      if (!profile) {
        return res.status(404).json({ error: 'File not found' });
      }

      const file = profile.files.find(f => f._id.toString() === fileId);
      res.json({ file });
    } catch (error) {
      console.error(' Get file error:', error);

      if (error instanceof Error && error.name === 'BSONError') {
        return res.status(400).json({ error: 'Invalid file ID format' });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // EMAIL HELPER METHODS 

  /**
   * Sends an email to the admin with the updated profile information
   * and attaches any uploaded files (if they are stored as data URLs).
   */
  private async sendProfileUpdateEmail(userId: string, profile: IUserProfile) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email credentials not configured – skipping profile update email');
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found for profile update email');
      return;
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'voidstonestudio@gmail.com';
    const subject = `Profile Updated: ${user.firstName} ${user.lastName}`;

    // Prepare file attachments from base64 data URLs
    const attachments: any[] = [];
    let totalAttachmentSize = 0;
    const MAX_ATTACHMENT_TOTAL_SIZE = 20 * 1024 * 1024; // 20MB limit

    for (const file of profile.files) {
      if (file.url && file.url.startsWith('data:')) {
        try {
          // Parse data URL: "data:[<mediatype>][;base64],<data>"
          const matches = file.url.match(/^data:([^;]+);base64,(.+)$/);
          if (!matches) {
            console.warn(`Skipping file ${file.name}: invalid data URL format`);
            continue;
          }
          const mimeType = matches[1];
          const base64Data = matches[2];
          const fileBuffer = Buffer.from(base64Data, 'base64');
          const fileSize = fileBuffer.length;

          if (totalAttachmentSize + fileSize > MAX_ATTACHMENT_TOTAL_SIZE) {
            console.warn(`Skipping attachment for ${file.name}: total size would exceed limit`);
            continue;
          }

          attachments.push({
            filename: file.name,
            content: fileBuffer,
            contentType: mimeType,
          });
          totalAttachmentSize += fileSize;
        } catch (err) {
          console.error(`Error processing file ${file.name} for attachment:`, err);
        }
      } else {
        console.warn(`File ${file.name} has non-data URL (${file.url}) – cannot attach`);
      }
    }

    if (attachments.length > 0) {
      console.log(`Attaching ${attachments.length} files (total ${(totalAttachmentSize / 1024 / 1024).toFixed(2)} MB)`);
    }

    const html = this.getProfileUpdateEmailTemplate(user, profile);

    try {
      const mailOptions: any = {
        from: `"Voidstone Studio" <${process.env.EMAIL_USER}>`,
        to: adminEmail,
        subject,
        html,
      };
      if (attachments.length > 0) {
        mailOptions.attachments = attachments;
      }
      await transporter.sendMail(mailOptions);
      console.log(`Profile update email sent to admin for user ${user.email} with ${attachments.length} attachments`);
    } catch (error) {
      console.error('Error sending profile update email:', error);
    }
  }

  /**
   * Generates a clean, professional HTML email template for profile updates.
   * Uses a minimal design without colored emojis.
   */
  private getProfileUpdateEmailTemplate(user: any, profile: IUserProfile): string {
    const skillsList = profile.skills.map(s => `<li style="margin-bottom: 4px;">${s}</li>`).join('');

    const experienceRows = profile.experience.map(exp => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${exp.title}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${exp.company}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${exp.years}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${exp.description || ''}</td>
      </tr>
    `).join('');

    const educationRows = profile.education.map(edu => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${edu.degree}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${edu.institution}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${edu.year}</td>
      </tr>
    `).join('');

    const filesList = profile.files.map(f => `
      <li style="margin-bottom: 4px;">${f.name} (${f.type}) – ${(f.size / 1024).toFixed(1)} KB</li>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            background-color: #f4f4f7;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          }
          .header {
            background: #1a1a1a;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-weight: 500;
            font-size: 28px;
            letter-spacing: 1px;
          }
          .content {
            padding: 40px 30px;
          }
          .section {
            margin-bottom: 30px;
          }
          .section h2 {
            color: #333333;
            font-size: 20px;
            font-weight: 600;
            border-bottom: 2px solid #eeeeee;
            padding-bottom: 8px;
            margin-top: 0;
            margin-bottom: 20px;
          }
          .bio {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 8px;
            color: #555555;
            line-height: 1.6;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
          }
          th {
            text-align: left;
            padding: 10px;
            background: #f2f2f2;
            font-weight: 600;
            color: #444;
          }
          td {
            padding: 10px;
            color: #555;
          }
          ul {
            margin: 0;
            padding-left: 20px;
          }
          li {
            color: #555;
          }
          .footer {
            background: #f9f9f9;
            padding: 20px;
            text-align: center;
            color: #777777;
            font-size: 13px;
          }
          .note {
            margin-top: 20px;
            font-style: italic;
            color: #888;
            border-top: 1px solid #eee;
            padding-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>PROFILE UPDATE</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px; color: #333; margin-bottom: 30px;">
              <strong>${user.firstName} ${user.lastName}</strong> (${user.email}) has updated their profile.
            </p>

            <div class="section">
              <h2>Bio</h2>
              <div class="bio">${profile.bio || 'No bio provided.'}</div>
            </div>

            <div class="section">
              <h2>Skills</h2>
              ${skillsList ? `<ul>${skillsList}</ul>` : '<p>No skills listed.</p>'}
            </div>

            <div class="section">
              <h2>Experience</h2>
              ${experienceRows ? `
                <table>
                  <thead>
                    <tr><th>Title</th><th>Company</th><th>Years</th><th>Description</th></tr>
                  </thead>
                  <tbody>${experienceRows}</tbody>
                </table>
              ` : '<p>No experience listed.</p>'}
            </div>

            <div class="section">
              <h2>Education</h2>
              ${educationRows ? `
                <table>
                  <thead>
                    <tr><th>Degree</th><th>Institution</th><th>Year</th></tr>
                  </thead>
                  <tbody>${educationRows}</tbody>
                </table>
              ` : '<p>No education listed.</p>'}
            </div>

            <div class="section">
              <h2>Files</h2>
              ${filesList ? `<ul>${filesList}</ul>` : '<p>No files uploaded.</p>'}
              <p class="note">The files are attached to this email (if size permits).</p>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Voidstone Studio. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}