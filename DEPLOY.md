# Deploy ל-Render - הוראות שלב אחר שלב

## שלב 1: הכנת הפרויקט

1. וודא שכל הקבצים נשמרו ב-Git:
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

## שלב 2: יצירת חשבון ב-Render

1. גש ל-[Render.com](https://render.com)
2. הירשם עם GitHub (מומלץ) או עם אימייל
3. אשר את האימייל שלך

## שלב 3: חיבור הרפוזיטורי

1. לחץ על **"New +"** → **"Web Service"**
2. חבר את חשבון GitHub שלך (אם עוד לא)
3. בחר את הרפוזיטורי: **`rmfogel/-----------------------`**
4. לחץ **"Connect"**

## שלב 4: הגדרות השירות

Render אמור לזהות אוטומטית את ההגדרות מ-`render.yaml`, אבל אם לא:

### הגדרות בסיסיות:
- **Name:** `project-proposal-assistant` (או כל שם שתרצה)
- **Runtime:** Node
- **Branch:** `main`
- **Root Directory:** השאר ריק (או `.`)
- **Build Command:** `npm install`
- **Start Command:** `npm start`

### הגדרות מתקדמות:
- **Instance Type:** Free
- **Auto-Deploy:** Yes (מומלץ)

## שלב 5: הגדרת משתני סביבה (Environment Variables)

לחץ על **"Environment"** ב-Render והוסף:

### אופציה 1: אם אין לך את המפתח עדיין
אל תוסיף כלום עכשיו - המערכת תעבוד בלי מפתח, והמנהל יצטרך להזין אותו דרך ממשק הניהול.

### אופציה 2: אם יש לך מפתח API
```
Key: OPENAI_API_KEY
Value: sk-your-actual-api-key-here
```

**אופציונלי:**
```
Key: PORT
Value: 3000
```

## שלב 6: Persistent Disk (חשוב!)

כדי ששיחות וקבצים ישמרו:

1. בעמוד ההגדרות, גלול ל-**"Disks"**
2. לחץ **"Add Disk"**
3. הגדר:
   - **Name:** `data`
   - **Mount Path:** `/opt/render/project/src`
   - **Size:** 1 GB (חינמי)
4. לחץ **"Create Disk"**

## שלב 7: Deploy!

1. לחץ **"Create Web Service"** בתחתית
2. המתן 2-5 דקות ל-build וה-deploy
3. תראה לוגים בזמן אמת

## שלב 8: גישה לאתר

לאחר שה-deploy הצליח:

1. תקבל כתובת כמו: `https://project-proposal-assistant.onrender.com`
2. ממשק משתמש: `https://your-app.onrender.com`
3. ממשק מנהל: `https://your-app.onrender.com/admin.html`

## שלב 9: הגדרת מפתח API (אם לא עשית בשלב 5)

1. גש לממשק המנהל: `https://your-app.onrender.com/admin.html`
2. הזן סיסמה: `admin123`
3. הזן את מפתח ה-API של OpenAI
4. לחץ "שמור מפתח"

---

## 🔧 פתרון בעיות נפוצות

### השרת נכנס לשינה (Sleep)
- **בעיה:** בתוכנית החינמית, השרת נכנס לשינה אחרי 15 דקות
- **פתרון:** הכניסה הראשונה תקח 30-60 שניות להתעורר

### שיחות נמחקות
- **בעיה:** שכחת להגדיר Persistent Disk
- **פתרון:** עבור לשלב 6 והוסף disk

### שגיאות API
- **בעיה:** מפתח API לא תקין
- **פתרון:** בדוק שהמפתח מתחיל ב-`sk-` ושיש לך קרדיט

### הפרומפט לא מתעדכן
- **בעיה:** שינית את `system_prompt.txt` מקומית
- **פתרון:** 
```bash
git add system_prompt.txt
git commit -m "Update system prompt"
git push
```
Render יעשה auto-deploy אוטומטית

---

## 📊 ניטור

- **Logs:** `Dashboard → Logs` - כל הלוגים בזמן אמת
- **Metrics:** `Dashboard → Metrics` - שימוש ב-CPU/Memory
- **Events:** `Dashboard → Events` - היסטוריית deploys

---

## 🔄 עדכונים עתידיים

כל פעם שתעשה push ל-`main`, Render יעשה deploy אוטומטי:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

---

**סיימת! האתר שלך אמור להיות חי ב-Render! 🎉**

צור קשר אם יש בעיות.
