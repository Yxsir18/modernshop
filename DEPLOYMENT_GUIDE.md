# ModernShop Deployment Guide

## Build Status: ✅ Successfully Built

Your application has been built successfully:
- **Frontend**: Built with Vite (941.56 kB)
- **Backend**: Built with esbuild (12.2 MB)
- **Output directory**: `dist/`

## Deployment Options

### Option 1: Railway (Recommended for Full Stack)

Railway is the best option for your monolithic server architecture as it handles both frontend and backend together.

#### Steps:

1. **Install Railway CLI**
   ```bash
   npm i -g railway
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize Project**
   ```bash
   railway init
   ```

4. **Deploy**
   ```bash
   railway up
   ```

5. **Set Environment Variables**
   Go to Railway dashboard → Settings → Variables and add:
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
   FRONTEND_URL=https://your-app.railway.app
   MERCHANT_UPI_ID=khanyasirraza1-1@okhdfcbank
   NODE_ENV=production
   PORT=3000
   HOST=0.0.0.0
   CORS_ORIGIN=https://your-app.railway.app
   ```

6. **Update Production URLs**
   After deployment, update `FRONTEND_URL` and `CORS_ORIGIN` with your actual Railway domain.

---

### Option 2: Vercel (Frontend Only) + Railway (Backend)

If you prefer Vercel for the frontend, you can deploy the backend separately on Railway.

#### Frontend on Vercel:

1. **Push to Git Repository**
   ```bash
   git init
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your Git repository
   - Configure:
     - **Framework Preset**: Other
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
     - **Install Command**: `npm install`

3. **Set Environment Variables** (for frontend config)
   ```
   VITE_API_URL=https://your-backend.railway.app
   ```

#### Backend on Railway:

Follow Option 1 steps above, but only deploy the backend. Update the frontend's `VITE_API_URL` to point to your Railway backend URL.

---

### Option 3: Docker Deployment

You can also deploy using Docker (Docker files are already included):

1. **Build Docker Images**
   ```bash
   docker-compose build
   ```

2. **Run Containers**
   ```bash
   docker-compose up -d
   ```

3. **Deploy to any cloud provider** (AWS, GCP, Azure, DigitalOcean, etc.)

---

## Post-Deployment Checklist

### 1. MongoDB Configuration
- Go to MongoDB Atlas Dashboard
- Network Access → IP Whitelist
- Add your deployment platform's IP ranges or allow access from anywhere (0.0.0.0/0)
- Verify database connection

### 2. Test Critical Flows
- ✅ User registration and login
- ✅ Product browsing and search
- ✅ Add to cart and checkout
- ✅ India-only delivery validation
- ✅ Admin panel access

### 3. Configure Custom Domain (Optional)
- Add custom domain in your deployment platform
- Update DNS records as instructed
- Update `FRONTEND_URL` and `CORS_ORIGIN` environment variables

---

## Troubleshooting

### Build Errors
- Ensure all dependencies are installed: `npm install`
- Check Node.js version (should be 18+)
- Verify environment variables are set correctly

### Runtime Errors
- Check deployment platform logs
- Verify MongoDB connection string
- Ensure all API keys are valid
- Check CORS configuration

### MongoDB Connection Issues
- Verify IP whitelist in MongoDB Atlas
- Check connection string format
- Ensure database user has correct permissions

---

## Security Notes

- ⚠️ Never commit `.env` file to Git
- 🔒 Use different secrets for production
- 🌐 Enable MongoDB Atlas IP whitelist
- 🔐 Use HTTPS in production
- 📦 Keep dependencies updated

---

## Support Resources

- Railway: [docs.railway.app](https://docs.railway.app)
- Vercel: [vercel.com/docs](https://vercel.com/docs)
- MongoDB Atlas: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
