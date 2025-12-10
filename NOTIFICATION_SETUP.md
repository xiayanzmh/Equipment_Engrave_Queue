# Push Notification System - Deployment & Testing Guide

## 🎯 Overview
This system sends push notifications to customers when their orders are completed using Firebase Cloud Messaging (FCM) and Cloud Functions.

## ⚙️ Prerequisites

Before deploying, you need to:

### 1. Get VAPID Key from Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `gen-lang-client-0550598157`
3. Go to **Project Settings** (gear icon) → **Cloud Messaging** tab
4. Scroll to **Web Push certificates**
5. Click **Generate key pair**
6. Copy the generated key

### 2. Update VAPID Key in Code

Open `utils/notificationService.ts` and replace:
```typescript
const VAPID_KEY = 'YOUR_VAPID_KEY_HERE';
```
with your actual VAPID key.

### 3. Upgrade to Firebase Blaze Plan

Cloud Functions require the Blaze (pay-as-you-go) plan:
1. Go to Firebase Console
2. Click **Upgrade** in the left sidebar
3. Select **Blaze** plan (you only pay for what you use)

---

## 🧪 Local Testing (RECOMMENDED FIRST)

### Step 1: Start Dev Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Step 2: Test In-App Notifications (Without FCM)

1. **Login as Customer**:
   - Go to http://localhost:5173
   - Sign in with Google/Apple

2. **Create a Test Order**:
   - Add some items to cart
   - Submit the order

3. **Switch to Backend** (in a new browser tab or incognito window):
   - Login with admin email: `thomashxyan@gmail.com`
   - You should see the backend interface

4. **Complete the Order**:
   - Find the test order in the backend
   - Change status from "Pending" → "Completed"

5. **Verify In-App Notification**:
   - Switch back to customer interface
   - You should see a notification in the bell icon (top-right)
   - Click the bell to see notification details

**Note**: Push notifications won't work locally without deploying Cloud Functions. In-app notifications should work immediately.

---

## 🚀 Deploy to Firebase

### Step 1: Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

This updates security rules for the new `notifications` and `user_tokens` collections.

### Step 2: Deploy Cloud Functions

```bash
firebase deploy --only functions
```

This deploys the `onOrderStatusChange` function that triggers when orders complete.

**Expected output**:
```
✔  functions[onOrderStatusChange(us-central1)] Successful create operation.
```

### Step 3: Deploy Frontend App

```bash
npm run build
firebase deploy --only hosting
```

---

## ✅ End-to-End Testing (After Deployment)

### Test Push Notifications

1. **Open Deployed App**: Visit your Firebase hosting URL
2. **Enable Notifications**:
   - Login as a customer
   - When prompted, click "Enable Notifications"
   - Allow browser notifications
3. **Create Order**: Add items and submit
4. **Complete Order**: Switch to backend (as admin) and mark order as complete
5. **Verify Notifications**:
   - ✅ **In-app**: Bell icon shows unread count
   - ✅ **Push**: Browser notification appears (even if tab is in background)
   - ✅ **Background**: Close all tabs, complete another order → notification should still appear

### Test Different Scenarios

- **Denied Permissions**: Deny notifications → should still get in-app notifications
- **Multiple Orders**: Complete multiple orders quickly → should get all notifications
- **Mark as Read**: Click notification → should mark as read
- **Cross-Device**: Login on different devices → each gets its own push notifications

---

## 🔍 Troubleshooting

### No Push Notifications?

1. **Check VAPID Key**: Make sure it's correctly added to `notificationService.ts`
2. **Check Browser**: FCM only works in Chrome, Firefox, Edge (not Safari)
3. **Check Service Worker**: Open DevTools → Application → Service Workers
4. **Check FCM Token**: Open DevTools → Console, look for "FCM Token obtained"
5. **Check Cloud Function Logs**:
   ```bash
   firebase functions:log
   ```

### In-App Notifications Not Showing?

1. **Check Firestore Rules**: Deploy rules with `firebase deploy --only firestore:rules`
2. **Check Browser Console**: Look for permission errors
3. **Check Firestore**: Go to Firebase Console → Firestore → `notifications` collection

### Cloud Function Not Triggering?

1. **Check Function Deployment**:
   ```bash
   firebase functions:list
   ```
2. **Check Function Logs**:
   ```bash
   firebase functions:log --only onOrderStatusChange
   ```
3. **Check Database Name**: Function uses `customer-orders` database

---

## 📊 Monitoring

### View Notification Analytics

- **Firebase Console** → **Cloud Messaging** → **Reports**
- Shows delivery rates, click rates, etc.

### View Function Metrics

- **Firebase Console** → **Functions** → Click function name
- Shows invocations, errors, execution time

---

## 💰 Cost Estimate

With normal usage (~100 orders/day):
- **Cloud Functions**: ~$0.01/day
- **Firestore**: ~$0.02/day
- **FCM**: Free (unlimited)

**Total**: < $1/month

---

## 🎉 What's Next?

Optional enhancements (currently skipped):
- [ ] Email notifications
- [ ] User notification preferences/settings
- [ ] Notification history page
- [ ] Notification sound customization

---

## Need Help?

Check the implementation plan at `.gemini/antigravity/brain/.../implementation_plan.md` for technical details.
