# TechCreator Portfolio & Project Marketplace

A modern, full-stack portfolio and project marketplace website built with React, TypeScript, and Supabase. Features secure document delivery, project management, and a complete admin dashboard.

## 🌟 Key Features

### Frontend
- **Modern React Application** with TypeScript and Tailwind CSS
- **Responsive Design** that works on all devices
- **Dark Mode Support** with system preference detection
- **Project Showcase** with filtering and search capabilities
- **Secure Checkout Process** with UPI payment integration
- **Contact Forms** with project request management

### Backend & Database
- **Supabase Integration** for authentication and database
- **Row Level Security (RLS)** for data protection
- **Real-time Updates** with Supabase subscriptions
- **File Storage** with Supabase Storage for project documents

### Admin Dashboard
- **Complete Project Management** - Add, edit, delete projects
- **Document Management** - Upload and organize project documents by review stages
- **Order Management** - Track customer orders and payments
- **Inquiry Management** - Handle customer inquiries and project requests
- **Project Request System** - Convert inquiries to projects
- **Document Delivery** - Secure, time-limited download links

### Security Features
- **Secure Document Downloads** with email verification
- **Time-limited Access** with configurable expiration
- **Download Tracking** and audit trails
- **Email-specific Authorization** - links only work for authorized emails
- **Production-Ready URLs** - download links work from anywhere, not dependent on development servers

### Email System
- **Brevo Integration** for transactional emails
- **EmailJS Fallback** for reliability
- **Order Confirmations** with detailed information
- **Document Delivery Notifications** with secure download links
- **Project Request Notifications** for admin

## 🚀 Production Deployment

### Critical: Secure Download Links
The secure download system is designed to work in production environments:

- **Universal Access**: Download links work from any location, any device
- **No Server Dependency**: Links are not dependent on local development servers
- **Production URLs**: All email links use the production domain (`https://techcreator-portfolio.netlify.app`)
- **Time-Limited Security**: Links expire after 72 hours by default
- **Email Verification**: Each link is tied to the customer's email address

### Environment Variables
Create a `.env` file with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Email Service (Brevo)
VITE_BREVO_API_KEY=your_brevo_api_key
```

### Deployment Steps

1. **Deploy to Netlify** (or your preferred hosting platform)
2. **Update Production URL** in `src/utils/email.ts` and `src/utils/secureDownloads.ts`
3. **Configure Environment Variables** in your hosting platform
4. **Set up Supabase** with the provided migrations
5. **Configure Brevo** for email delivery

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Brevo account (for email services)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd techcreator-portfolio
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your actual values
```

4. **Start the development server**
```bash
npm run dev
```

### Database Setup

The project includes Supabase migrations in the `supabase/migrations/` directory. These will set up:

- Projects table with RLS policies
- Orders and inquiries tables
- Project documents with review stages
- Secure download tokens system
- Project requests and status tracking

### Email Configuration

1. **Brevo Setup**:
   - Create account at https://app.brevo.com/
   - Get API key from settings
   - Validate sender email address
   - Add API key to environment variables

2. **EmailJS Fallback**:
   - Configured as backup email service
   - Uses existing service configuration

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── admin/          # Admin dashboard components
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components (Navbar, Footer)
│   └── projects/       # Project-related components
├── context/            # React Context providers
├── pages/              # Page components
│   ├── admin/          # Admin dashboard pages
│   └── ...             # Public pages
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
│   ├── email.ts        # Email service integration
│   ├── secureDownloads.ts  # Secure download system
│   └── storage.ts      # File storage utilities
└── lib/                # External library configurations
```

## 🔐 Security Features

### Secure Document Delivery
- **Time-limited Links**: Configurable expiration (default: 72 hours)
- **Email Verification**: Links only work for authorized email addresses
- **Download Limits**: Configurable maximum downloads per link
- **Audit Trail**: All download attempts are logged
- **Universal Access**: Links work from any location, not tied to development servers

### Row Level Security
- All database tables use Supabase RLS
- Users can only access their own data
- Admin functions require authentication
- Public data is properly filtered

### Authentication
- Supabase Auth integration
- Email/password authentication
- Admin role management
- Protected routes for admin functions

## 📧 Email System

### Transactional Emails
- **Order Confirmations**: Sent immediately after purchase
- **Document Delivery**: Secure download links with instructions
- **Project Requests**: Admin notifications for new inquiries
- **Status Updates**: Automated notifications for request status changes

### Email Templates
- Professional HTML templates with responsive design
- Consistent branding and styling
- Clear call-to-action buttons
- Mobile-friendly layouts

## 🎨 Design System

### Color Palette
- Primary: Blue (#3B82F6)
- Secondary: Slate (#64748B)
- Success: Green (#10B981)
- Warning: Amber (#F59E0B)
- Error: Red (#EF4444)

### Typography
- Font Family: Inter
- Responsive font sizes
- Consistent line heights
- Proper contrast ratios

### Components
- Consistent spacing (8px grid system)
- Hover states and transitions
- Loading states and feedback
- Error handling and validation

## 🚀 Performance

### Optimization Features
- Code splitting with React.lazy
- Image optimization with proper sizing
- Efficient database queries with indexes
- Caching strategies for static content

### Bundle Size
- Tree shaking for unused code
- Dynamic imports for admin features
- Optimized dependencies

## 🧪 Testing

### Manual Testing Checklist
- [ ] Project browsing and filtering
- [ ] Checkout process with UPI payment
- [ ] Admin login and dashboard access
- [ ] Project management (CRUD operations)
- [ ] Document upload and management
- [ ] Secure download link generation
- [ ] Email delivery (order confirmations, document delivery)
- [ ] Mobile responsiveness
- [ ] Dark mode functionality

## 📱 Mobile Support

- Fully responsive design
- Touch-friendly interface
- Mobile-optimized navigation
- Proper viewport configuration
- Fast loading on mobile networks

## 🔧 Maintenance

### Regular Tasks
- Monitor email delivery rates
- Clean up expired download tokens
- Review and update project content
- Check for security updates
- Monitor database performance

### Backup Strategy
- Supabase automatic backups
- Regular database exports
- Environment variable documentation
- Code repository maintenance

## 📞 Support

For technical support or questions:
- Email: mohanselenophile@gmail.com
- Response time: Within 24 hours

## 📄 License

This project is proprietary software. All rights reserved.

---

**Note**: This is a production-ready application with enterprise-level security features. The secure download system ensures that customer documents are delivered safely and reliably, regardless of server status or location.