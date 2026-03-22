Project Overview (The "CareFlow Ecosystem")
Use this for your main portfolio or a "master" repository.

🏥 CareFlow: Integrated Elderly Management System
CareFlow is a full-stack healthcare ecosystem designed to bridge the gap between elderly care facilities, staff, and guardians. Originally built as an RDS/Elastic Beanstalk monolith, the system has been modernized into a decoupled microservices architecture on AWS to ensure high availability, scalability, and cost-efficiency.

🏗️ Architecture Evolution
Legacy: Monolithic app hosted on AWS Elastic Beanstalk (Node.js/Express) + Amazon RDS.

Modernized: Microservices via AWS Lambda, API Gateway, and Amazon S3, with Elastic Beanstalk retained for stable administrative services.

📱 Project Components
CareFlow Web: Next.js dashboard for Staff and Admins to manage inventory and health records.

CareFlow Mobile: Flutter app for Guardians to receive emergency alerts and manage subscriptions.

CareFlow Serverless: The backend logic handling image processing (S3) and event-driven tasks (Lambda).

CareFlow Web (Staff & Admin Dashboard)
Place this in your Next.js repository.

💻 CareFlow Web
The central nervous system for care facility operations. This dashboard allows healthcare providers to manage the day-to-day logistics of elderly care.

✨ Key Features
Emergency Trigger: Instant alert system for staff to notify guardians of critical events.

Inventory Management: Real-time tracking of medical supplies and facility resources.

Subscription Engine: Admin tools to manage service tiers and donation campaigns.

Health Record Management: Secure CRUD operations for patient medical history.

🛠️ Tech Stack
Frontend: Next.js (React), Tailwind CSS

Hosting: AWS Elastic Beanstalk

Database: Amazon RDS (PostgreSQL/MySQL)

Storage: Amazon S3 for staff documentation and medical reports.
