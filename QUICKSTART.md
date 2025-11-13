# הוראות התקנה והפעלה מהירות

## התקנה
```powershell
npm install
```

## הפעלה
```powershell
npm start
```

## כתובות
- **ממשק משתמש:** http://localhost:3000
- **ממשק מנהל:** http://localhost:3000/admin.html

## סיסמת מנהל
`admin123`

## הגדרה ראשונית
1. היכנס לממשק המנהל
2. הזן מפתח API של OpenAI
3. לחץ "שמור מפתח"
4. עבור לממשק המשתמש והתחל לעבוד

## קבלת מפתח API
https://platform.openai.com/api-keys

---

## אחסון נתונים

### פיתוח מקומי:
- השיחות נשמרות בתיקייה `chats/` כקבצי JSON
- מפתח ה-API נשמר בקובץ `api_key.txt`
- הקבצים נוצרים אוטומטית והנתונים נטענים בכל הפעלה מחדש
- לגיבוי, העתק את התיקייה `chats/`

### Production (Render):
- השיחות נשמרות ב-`/opt/render/project/src/chats` (Persistent Disk)
- מפתח ה-API רק ממשתנה סביבה `OPENAI_API_KEY`
- **חובה:** הגדר Persistent Disk ב-Render כדי שהשיחות לא ימחקו!

---

## דיבוג שיחות חסרות

אם בממשק המנהל לא רואים שיחות, בדוק ב-Logs:
```
=== מאתחל אחסון ===
סביבה: production
נתיב תיקיית צ'אטים: /opt/render/project/src/chats
מנסה לטעון שיחות מהתיקייה: /opt/render/project/src/chats
נמצאו X קבצים בתיקייה
✓ סה"כ נטענו X שיחות מהדיסק
```

אם רואים `0 שיחות`, הבעיה היא:
1. לא הוגדר Persistent Disk
2. הנתיב שגוי (לא `/opt/render/project/src`)
3. השיחות טרם נשמרו (צור שיחה חדשה)
