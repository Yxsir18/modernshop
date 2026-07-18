# ModernShop Deployment Instructions

## Build Status: ✅ Completed

The application has been successfully built for production:
- Frontend: Built with Vite (941.56 kB)
- Backend: Built with esbuild (341.9 kB)
- Output directory: `dist/`

## Deployment Options

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push to Git Repository**
   ```bash
   git init
   git add .
   git commit -m "Production build ready"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your Git repository
   - Configure project settings:
     - **Framework Preset**: Other
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
     - **Install Command**: `npm install`

3. **Set Environment Variables**
   In Vercel dashboard → Settings → Environment Variables, add:
   ```
   MONGODB_URI=mongodb+srv://khanyasirraza1_db_user:4CExhVl3vj6Ki182@cluster0.qj5n724.mongodb.net/?appName=Cluster0
   CLOUDINARY_URL=cloudinary://984236136516365:VqHNOaFY2Z2NqLVq1Cmv_prI7TA@dbxncsqa5
   CLOUDINARY_CLOUD_NAME=dbxncsqa5
   CLOUDINARY_API_KEY=984236136516365
   CLOUDINARY_API_SECRET=VqHNOaFY2Z2NqLVq1Cmv_prI7TA
   REDIS_URL=rediss://default:gQAAAAAAAct7AAIgcDI0OGFiNGM5NjE5NjU0ZWI4OWFjMDQyNDAyMTVlNzFjNw@live-lion-117627.upstash.io:6379
   JWT_ACCESS_SECRET=83579b2df1f843d3e7fa1a34229eaea00c3900bcda020006b1853ce478d2a807
   JWT_REFRESH_SECRET=69122dab6dd5976bd37cf81a5f10f3a38cd88f8743098d3132e7af58aef746f5
   JWT_ACCESS_TTL=15m
   JWT_REFRESH_TTL=30d
   SESSION_SECRET=yasirkhan
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=khanyasirraza1@gmail.com
   SMTP_PASS=wvsq tqmc hdmo stbo
   SMTP_FROM="ModernShop" <khanyasirraza1@gmail.com>
   FRONTEND_URL=https://your-domain.vercel.app
   MERCHANT_UPI_ID=khanyasirraza1-1@okhdfcbank
   NODE_ENV=production
   PORT=3000
   HOST=0.0.0.0
   CORS_ORIGIN=https://your-domain.vercel.app
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Follow the prompts** to configure your project

## Post-Deployment Steps

### 1. MongoDB Atlas Configuration
- Go to MongoDB Atlas Dashboard
- Network Access → IP Whitelist
- Add Vercel's IP ranges or allow access from anywhere (0.0.0.0/0)
- Verify database connection

### 2. Update Production URLs
After deployment, update these environment variables in Vercel:
- `FRONTEND_URL`: Change to your actual Vercel domain
- `CORS_ORIGIN`: Change to your actual Vercel domain

### 3. Test Critical Flows
- User registration and login
- Product browsing and search
- Add to cart and checkout
- India-only delivery validation
- Admin panel access

### 4. Configure Custom Domain (Optional)
- In Vercel dashboard → Settings → Domains
- Add your custom domain
- Update DNS records as instructed

## Troubleshooting

### Build Errors
- Ensure all dependencies are installed: `npm install`
- Check Node.js version (should be 18+)
- Verify environment variables are set correctly

### Runtime Errors
- Check Vercel deployment logs
- Verify MongoDB connection string
- Ensure all API keys are valid
- Check CORS configuration

### MongoDB Connection Issues
- Verify IP whitelist in MongoDB Atlas
- Check connection string format
- Ensure database user has correct permissions

## Security Notes
- Never commit `.env` file to Git
- Use different secrets for production
- Enable MongoDB Atlas IP whitelist
- Use HTTPS in production
- Keep dependencies updated

## Support
For issues, check:
- Vercel deployment logs
- MongoDB Atlas logs
- Application console logs
- Network tab in browser dev tools
