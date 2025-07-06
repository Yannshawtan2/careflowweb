# Nurse Dashboard - Patient Health Data Management

## Overview

The Nurse Dashboard is a comprehensive, modern, and responsive web application designed for nurses to manage elderly patient health data with a dual-access system. It provides real-time health monitoring, family communication, and clinical documentation capabilities.

## Core Features

### 🏥 Patient Management Dashboard
- **Search & Filter**: Advanced search capabilities by patient name, room number, or guardian
- **Care Level Filtering**: Filter patients by care level (low, medium, high)
- **Status Management**: Track patient status (active, discharged, transferred)
- **Real-time Statistics**: Live dashboard with patient counts, high-care alerts, and recent updates

### 👥 Dual-Section Patient Profiles

#### Family Visible Updates
- **Quick-entry Vitals**: Blood pressure, temperature, pulse, oxygen saturation
- **Mood Scale**: 1-5 scale with emoji indicators (😢😕😐🙂😊)
- **Appetite Tracking**: Poor/Fair/Good with color-coded indicators
- **Activity Participation**: Track patient engagement in activities
- **Medication Compliance**: Checkbox system for medication administration
- **General Notes**: Family-visible observations and updates

#### Clinical Notes Only
- **Assessment Types**: Daily, weekly, incident reports, care plan updates, medication reviews
- **Mental Status**: Cognitive and behavioral observations
- **Physical Assessment**: Mobility, skin condition, nutrition status
- **Pain Level**: 0-10 scale with visual progress indicator
- **Professional Observations**: Clinical notes and recommendations
- **Incident Reports**: Detailed documentation for critical events

### 🚨 Emergency Contact System
- **Multi-channel Communication**: Phone, SMS, and email options
- **Urgency Levels**: Low, Medium, High, and Critical priority settings
- **Quick Templates**: Pre-written messages for common scenarios
- **Guardian Information**: Direct access to emergency contacts
- **Real-time Logging**: All contact attempts are logged for audit trails

### 💾 Real-time Save Functionality
- **Auto-save Indicators**: Clear visual feedback during save operations
- **Dual-section Saving**: Independent save buttons for family and clinical sections
- **Data Persistence**: All updates are stored in Firebase with timestamps
- **Audit Trail**: Complete history of all health updates and clinical notes

## Technical Architecture

### Database Structure
```typescript
// Patient (stored in 'users' collection with role='guardian')
interface Patient {
  id: string
  name: string
  dateOfBirth: string
  roomNumber: string
  guardianId: string
  guardianName: string
  guardianPhone: string
  emergencyContact: string
  medicalHistory: string[]
  allergies: string[]
  medications: string[]
  careLevel: "low" | "medium" | "high"
  status: "active" | "discharged" | "transferred"
}

// Health Records (stored in 'healthRecords' collection)
interface HealthRecord {
  id: string
  patientId: string
  familyVisibleUpdates: FamilyVisibleUpdate[]
  clinicalNotes: ClinicalNote[]
  lastUpdated: string
}
```

### Key Components

#### 1. Patient Management Page (`/staffdashboard/patients`)
- **PatientCard**: Individual patient cards with health summaries
- **AddPatientModal**: Comprehensive patient registration form
- **PatientHealthModal**: Dual-section health update interface
- **EmergencyContactModal**: Guardian communication system

#### 2. Health Update System
- **Family Visible Updates**: Quick-entry forms for daily monitoring
- **Clinical Notes**: Professional assessment and documentation
- **Real-time Validation**: Form validation with user feedback
- **Data Loading**: Pre-populates forms with latest health data

#### 3. Emergency Contact API (`/api/emergency-contact`)
- **Contact Logging**: Records all emergency contact attempts
- **Multi-channel Support**: Extensible for SMS/email integration
- **Error Handling**: Comprehensive error management and user feedback

## User Interface Design

### Color Scheme
- **Primary Green**: `#A0C878` - Main brand color
- **Secondary Green**: `#8AB868` - Hover states
- **Background**: `#FAF6E9` - Warm, professional background
- **Borders**: `#DDEB9D` - Subtle border accents
- **Text**: `#2E7D32` - Dark green for headings

### Responsive Design
- **Mobile-First**: Optimized for tablet and mobile use
- **Grid Layout**: Responsive card grid system
- **Touch-Friendly**: Large touch targets for mobile devices
- **Progressive Enhancement**: Works on all device sizes

### Accessibility Features
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Color Contrast**: WCAG AA compliant color combinations
- **Focus Management**: Clear focus indicators and logical tab order

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- Firebase project with Firestore database
- Next.js 14+ application

### Environment Variables
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK
FIREBASE_ADMIN_SDK=your_service_account_json
```

### Database Setup
1. Create Firestore collections:
   - `users` (for patients with role='guardian')
   - `healthRecords` (for patient health data)
   - `emergencyContacts` (for contact logs)

2. Set up Firestore security rules for data protection

### Component Installation
```bash
# Install required dependencies
npm install lucide-react @radix-ui/react-tabs @radix-ui/react-select
npm install @radix-ui/react-checkbox @radix-ui/react-progress
npm install sonner recharts

# Copy component files to your project
cp -r components/patients/ your-project/components/
cp -r app/staffdashboard/ your-project/app/
```

## Usage Guide

### Adding a New Patient
1. Navigate to `/staffdashboard/patients`
2. Click "Add Patient" button
3. Fill in patient information:
   - Basic details (name, DOB, room number)
   - Guardian information (name, phone, emergency contact)
   - Medical information (history, allergies, medications)
4. Set care level and status
5. Save patient record

### Updating Patient Health
1. Click "Update Health" on any patient card
2. Choose between "Family Visible Updates" or "Clinical Notes Only"
3. Fill in the appropriate forms
4. Save updates (real-time feedback provided)

### Emergency Contact
1. Click "Emergency" button on patient card
2. Select contact method (phone, SMS, email)
3. Choose urgency level
4. Write or select a message template
5. Send emergency contact

## Security & Privacy

### Data Protection
- **HIPAA Compliance**: Designed with healthcare privacy in mind
- **Role-based Access**: Staff-only access to patient data
- **Audit Logging**: Complete trail of all data modifications
- **Secure API**: Protected endpoints with proper validation

### Access Control
- **Authentication Required**: All routes require valid session
- **Staff Authorization**: Only authorized staff can access patient data
- **Session Management**: Secure session handling and timeout

## Future Enhancements

### Planned Features
- **Push Notifications**: Real-time alerts for critical updates
- **SMS Integration**: Direct SMS sending via Twilio or similar service
- **Email Integration**: Automated email notifications to guardians
- **Mobile App**: Native mobile application for field use
- **Voice Notes**: Audio recording for quick updates
- **Photo Upload**: Image capture for wound tracking and documentation

### Integration Possibilities
- **EHR Systems**: Integration with existing electronic health records
- **Pharmacy Systems**: Medication management integration
- **Lab Results**: Automated lab result import and display
- **Insurance**: Billing and insurance claim integration
- **Telemedicine**: Video consultation integration

## Support & Maintenance

### Troubleshooting
- **Data Loading Issues**: Check Firebase connection and permissions
- **Save Failures**: Verify network connection and form validation
- **Emergency Contact**: Ensure API endpoint is accessible

### Performance Optimization
- **Lazy Loading**: Components load on demand
- **Caching**: Firebase data caching for faster access
- **Image Optimization**: Optimized images for faster loading
- **Bundle Splitting**: Code splitting for better performance

## Contributing

### Development Guidelines
- Follow TypeScript best practices
- Use consistent naming conventions
- Add proper error handling
- Include comprehensive tests
- Document all new features

### Code Style
- Use functional components with hooks
- Implement proper TypeScript interfaces
- Follow React best practices
- Use consistent formatting with Prettier

---

**Note**: This system is designed for healthcare environments and should be used in compliance with local healthcare regulations and privacy laws. Always ensure proper training and authorization before deploying in a clinical setting. 