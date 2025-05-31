import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aegisLogger } from "./aegis-logger";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export function registerRoutes(app: Express): Server {
  const server = createServer(app);
  // Basic routes for system functionality
  
  // Stats endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت آمار" });
    }
  });

  // Representatives endpoints
  app.get("/api/representatives", async (req, res) => {
    try {
      const representatives = await storage.getRepresentatives();
      res.json(representatives);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت نمایندگان" });
    }
  });

  // Invoices endpoint
  app.get("/api/invoices", async (req, res) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت فاکتورها" });
    }
  });

  // JSON import endpoint with new pricing structure
  app.post("/api/import-json", upload.single('jsonFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "فایل JSON آپلود نشده است" });
      }

      const fileImport = await storage.createFileImport({
        fileName: req.file.originalname,
        status: 'processing'
      });

      try {
        const fileContent = req.file.buffer.toString('utf8');
        const jsonData = JSON.parse(fileContent);

        let representativeData;
        if (Array.isArray(jsonData)) {
          const tableObject = jsonData.find(item => 
            item && typeof item === 'object' && item.type === 'table' && Array.isArray(item.data)
          );
          representativeData = tableObject ? tableObject.data : jsonData;
        } else {
          representativeData = jsonData;
        }

        if (!representativeData || representativeData.length === 0) {
          throw new Error('داده‌های نماینده در فایل JSON یافت نشد');
        }

        let recordsProcessed = 0;
        let recordsSkipped = 0;
        const invoicesCreated = [];

        // Create batch for this import
        const batch = await storage.createInvoiceBatch({
          batchName: `JSON Import - ${new Date().toLocaleDateString('fa-IR')}`,
          fileName: req.file.originalname
        });

        for (const adminData of representativeData) {
          if (!adminData.admin_username) {
            recordsSkipped++;
            continue;
          }

          const adminUsername = adminData.admin_username.toString().trim();

          // Check if representative has activity
          const limitedVolumes = [
            parseFloat(adminData.limited_1_month_volume) || 0,
            parseFloat(adminData.limited_2_month_volume) || 0,
            parseFloat(adminData.limited_3_month_volume) || 0,
            parseFloat(adminData.limited_4_month_volume) || 0,
            parseFloat(adminData.limited_5_month_volume) || 0,
            parseFloat(adminData.limited_6_month_volume) || 0
          ];

          const unlimitedCounts = [
            parseInt(adminData.unlimited_1_month) || 0,
            parseInt(adminData.unlimited_2_month) || 0,
            parseInt(adminData.unlimited_3_month) || 0,
            parseInt(adminData.unlimited_4_month) || 0,
            parseInt(adminData.unlimited_5_month) || 0,
            parseInt(adminData.unlimited_6_month) || 0
          ];

          const hasLimited = limitedVolumes.some(vol => vol > 0);
          const hasUnlimited = unlimitedCounts.some(count => count > 0);

          if (!hasLimited && !hasUnlimited) {
            recordsSkipped++;
            continue;
          }

          // Get or create representative with new pricing structure
          let representative = await storage.getRepresentativeByAdminUsername(adminUsername);
          if (!representative) {
            representative = await storage.createRepresentative({
              fullName: adminUsername,
              adminUsername: adminUsername,
              // New default pricing structure as requested
              limitedPrice1Month: "900",
              limitedPrice2Month: "900", 
              limitedPrice3Month: "900",
              limitedPrice4Month: "1400",
              limitedPrice5Month: "1500",
              limitedPrice6Month: "1600",
              unlimitedPrice1Month: "40000",
              unlimitedPrice2Month: "80000",
              unlimitedPrice3Month: "120000",
              unlimitedPrice4Month: "160000",
              unlimitedPrice5Month: "200000",
              unlimitedPrice6Month: "240000"
            });
          }

          // Calculate invoice amount
          let totalAmount = 0;
          const invoiceItems = [];

          // Limited subscriptions (per GB pricing)
          if (hasLimited) {
            const limitedPrices = [
              representative.limitedPrice1Month,
              representative.limitedPrice2Month,
              representative.limitedPrice3Month,
              representative.limitedPrice4Month,
              representative.limitedPrice5Month,
              representative.limitedPrice6Month
            ];

            for (let i = 0; i < 6; i++) {
              const volume = limitedVolumes[i];
              const unitPrice = limitedPrices[i];
              
              if (volume > 0 && unitPrice) {
                const price = parseFloat(unitPrice) * volume;
                totalAmount += price;
                invoiceItems.push({
                  description: `اشتراک ${i + 1} ماهه حجمی`,
                  quantity: volume.toString(),
                  unitPrice: unitPrice,
                  totalPrice: price.toString(),
                  subscriptionType: 'limited',
                  durationMonths: i + 1
                });
              }
            }
          }

          // Unlimited subscriptions (fixed pricing per subscription)
          if (hasUnlimited) {
            const unlimitedPrices = [
              representative.unlimitedPrice1Month,
              representative.unlimitedPrice2Month,
              representative.unlimitedPrice3Month,
              representative.unlimitedPrice4Month,
              representative.unlimitedPrice5Month,
              representative.unlimitedPrice6Month
            ];

            for (let i = 0; i < 6; i++) {
              const count = unlimitedCounts[i];
              const unitPrice = unlimitedPrices[i];
              
              if (count > 0 && unitPrice) {
                const price = parseFloat(unitPrice) * count;
                totalAmount += price;
                invoiceItems.push({
                  description: `اشتراک ${i + 1} ماهه نامحدود`,
                  quantity: count.toString(),
                  unitPrice: unitPrice,
                  totalPrice: price.toString(),
                  subscriptionType: 'unlimited',
                  durationMonths: i + 1
                });
              }
            }
          }

          if (totalAmount > 0) {
            // Create invoice
            const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
            
            const invoice = await storage.createInvoice({
              invoiceNumber,
              representativeId: representative.id,
              batchId: batch.id,
              totalAmount: totalAmount.toString(),
              invoiceData: {
                items: invoiceItems,
                totalAmount,
                representative: representative.adminUsername
              }
            });

            // Create invoice items
            for (const item of invoiceItems) {
              await storage.createInvoiceItem({
                invoiceId: invoice.id,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                subscriptionType: item.subscriptionType,
                durationMonths: item.durationMonths
              });
            }

            invoicesCreated.push(invoice);
            recordsProcessed++;
          } else {
            recordsSkipped++;
          }
        }

        await storage.updateFileImport(fileImport.id, {
          status: 'completed',
          recordsProcessed,
          recordsSkipped
        });

        res.json({
          message: "فایل JSON با موفقیت پردازش شد",
          recordsProcessed,
          recordsSkipped,
          invoicesCreated: invoicesCreated.length
        });

      } catch (processingError) {
        await storage.updateFileImport(fileImport.id, {
          status: 'failed',
          errorDetails: processingError instanceof Error ? processingError.message : 'خطای نامشخص'
        });

        res.status(400).json({ 
          message: processingError instanceof Error ? processingError.message : 'خطا در پردازش فایل JSON' 
        });
      }

    } catch (error) {
      res.status(500).json({ message: "خطا در آپلود فایل JSON" });
    }
  });

  // System reset endpoint
  app.post("/api/system/reset", async (req, res) => {
    try {
      aegisLogger.critical('API', 'System reset initiated - clearing all data');
      await storage.clearAllData();
      aegisLogger.info('API', 'System reset completed successfully');
      
      res.json({ 
        success: true, 
        message: "سیستم با موفقیت بازنشانی شد",
        warning: "تمام داده‌ها پاک شدند"
      });
    } catch (error) {
      res.status(500).json({ message: "خطا در بازنشانی سیستم" });
    }
  });

  // Events and notifications
  app.get("/api/events", async (req, res) => {
    res.json([]);
  });

  app.get("/api/notifications", async (req, res) => {
    res.json([]);
  });

  // Settings endpoints
  app.get("/api/settings", async (req, res) => {
    res.json([]);
  });

  app.get("/api/api-keys/status", async (req, res) => {
    res.json({
      telegram: false,
      vertexAI: false,
      textToSpeech: false,
      sentiment: false
    });
  });

  // Invoice preview endpoints
  app.get("/api/invoice/preview/:templateId", async (req, res) => {
    try {
      const { templateId } = req.params;
      
      // Sample invoice data for preview
      const sampleInvoice = {
        invoiceNumber: "INV-2025-123456",
        representative: {
          fullName: "نمونه نماینده",
          adminUsername: "sample_admin",
          storeName: "فروشگاه نمونه موبایل",
          phoneNumber: "09123456789"
        },
        items: [
          {
            description: "اشتراک ۱ ماهه حجمی",
            quantity: "50",
            unitPrice: "900",
            totalPrice: "45000",
            subscriptionType: "limited",
            durationMonths: 1
          },
          {
            description: "اشتراک ۲ ماهه نامحدود", 
            quantity: "5",
            unitPrice: "80000",
            totalPrice: "400000",
            subscriptionType: "unlimited",
            durationMonths: 2
          }
        ],
        totalAmount: "445000",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date()
      };

      let previewHtml = "";
      
      switch (templateId) {
        case "modern_clean":
          previewHtml = generateModernCleanTemplate(sampleInvoice);
          break;
        case "classic_formal":
          previewHtml = generateClassicFormalTemplate(sampleInvoice);
          break;
        case "persian_optimized":
          previewHtml = generatePersianOptimizedTemplate(sampleInvoice);
          break;
        default:
          previewHtml = generateModernCleanTemplate(sampleInvoice);
      }

      res.send(previewHtml);
    } catch (error) {
      console.error('Invoice preview error:', error);
      res.status(500).send('<div style="text-align: center; padding: 20px; color: red;">خطا در نمایش پیش‌نمایش فاکتور</div>');
    }
  });

  return server;
}

// Template generation functions
function generateModernCleanTemplate(invoice: any): string {
  return `
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>پیش‌نمایش فاکتور - مدرن</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Vazirmatn', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; min-height: 100vh; }
        .invoice-container { max-width: 800px; margin: 0 auto; background: white; border-radius: 15px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #10b981 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 10px; }
        .header p { font-size: 16px; opacity: 0.9; }
        .content { padding: 30px; }
        .invoice-info { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
        .info-section h3 { color: #4f46e5; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
        .info-item { margin-bottom: 10px; display: flex; justify-content: space-between; }
        .label { color: #6b7280; font-weight: 500; }
        .value { color: #111827; font-weight: 600; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .items-table th { background: #f8fafc; color: #374151; padding: 15px; text-align: right; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
        .items-table td { padding: 15px; border-bottom: 1px solid #f3f4f6; }
        .items-table tr:hover { background: #f8fafc; }
        .total-section { background: linear-gradient(135deg, #f8fafc 0%, #e5e7eb 100%); padding: 20px; border-radius: 10px; margin-top: 20px; }
        .total-amount { font-size: 24px; font-weight: 700; color: #059669; text-align: center; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; color: #6b7280; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <h1>MarFanet</h1>
          <p>سیستم مدیریت نمایندگان V2Ray</p>
        </div>
        <div class="content">
          <div class="invoice-info">
            <div class="info-section">
              <h3>اطلاعات فاکتور</h3>
              <div class="info-item">
                <span class="label">شماره فاکتور:</span>
                <span class="value">${invoice.invoiceNumber}</span>
              </div>
              <div class="info-item">
                <span class="label">تاریخ صدور:</span>
                <span class="value">${new Date().toLocaleDateString('fa-IR')}</span>
              </div>
              <div class="info-item">
                <span class="label">مهلت پرداخت:</span>
                <span class="value">${invoice.dueDate.toLocaleDateString('fa-IR')}</span>
              </div>
            </div>
            <div class="info-section">
              <h3>اطلاعات نماینده</h3>
              <div class="info-item">
                <span class="label">نام:</span>
                <span class="value">${invoice.representative.fullName}</span>
              </div>
              <div class="info-item">
                <span class="label">نام کاربری:</span>
                <span class="value">${invoice.representative.adminUsername}</span>
              </div>
              <div class="info-item">
                <span class="label">فروشگاه:</span>
                <span class="value">${invoice.representative.storeName || 'نامشخص'}</span>
              </div>
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>شرح خدمات</th>
                <th>تعداد/حجم</th>
                <th>قیمت واحد</th>
                <th>مبلغ کل</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map((item: any) => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity} ${item.subscriptionType === 'limited' ? 'گیگابایت' : 'عدد'}</td>
                  <td>${Number(item.unitPrice).toLocaleString('fa-IR')} تومان</td>
                  <td>${Number(item.totalPrice).toLocaleString('fa-IR')} تومان</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total-section">
            <div class="total-amount">
              مبلغ کل قابل پرداخت: ${Number(invoice.totalAmount).toLocaleString('fa-IR')} تومان
            </div>
          </div>
        </div>
        <div class="footer">
          <p>این فاکتور به صورت خودکار تولید شده است - MarFanet CRM System</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateClassicFormalTemplate(invoice: any): string {
  return `
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>پیش‌نمایش فاکتور - کلاسیک</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Vazir:wght@300;400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Vazir', Arial, sans-serif; background: #f5f5f5; padding: 20px; }
        .invoice-container { max-width: 800px; margin: 0 auto; background: white; border: 2px solid #1f2937; }
        .header { background: #1f2937; color: white; padding: 25px; text-align: center; border-bottom: 3px solid #d97706; }
        .header h1 { font-size: 26px; font-weight: 700; margin-bottom: 8px; }
        .header p { font-size: 14px; }
        .content { padding: 25px; }
        .invoice-info { display: table; width: 100%; margin-bottom: 25px; }
        .info-column { display: table-cell; width: 50%; vertical-align: top; padding: 0 15px; }
        .info-section h3 { color: #1f2937; font-size: 16px; margin-bottom: 12px; border-bottom: 1px solid #d97706; padding-bottom: 3px; font-weight: 600; }
        .info-item { margin-bottom: 8px; }
        .label { color: #374151; font-weight: 500; display: inline-block; width: 100px; }
        .value { color: #111827; font-weight: 600; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; border: 2px solid #1f2937; }
        .items-table th { background: #f3f4f6; color: #1f2937; padding: 12px; text-align: right; font-weight: 600; border: 1px solid #d1d5db; }
        .items-table td { padding: 12px; border: 1px solid #d1d5db; }
        .items-table tr:nth-child(even) { background: #f9fafb; }
        .total-section { border: 2px solid #1f2937; background: #f3f4f6; padding: 15px; margin-top: 20px; text-align: center; }
        .total-amount { font-size: 20px; font-weight: 700; color: #1f2937; }
        .footer { background: #f3f4f6; padding: 15px; text-align: center; color: #6b7280; border-top: 2px solid #1f2937; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <h1>MarFanet</h1>
          <p>سیستم مدیریت نمایندگان V2Ray - فاکتور رسمی</p>
        </div>
        <div class="content">
          <div class="invoice-info">
            <div class="info-column">
              <div class="info-section">
                <h3>مشخصات فاکتور</h3>
                <div class="info-item">
                  <span class="label">شماره:</span>
                  <span class="value">${invoice.invoiceNumber}</span>
                </div>
                <div class="info-item">
                  <span class="label">تاریخ:</span>
                  <span class="value">${new Date().toLocaleDateString('fa-IR')}</span>
                </div>
                <div class="info-item">
                  <span class="label">سررسید:</span>
                  <span class="value">${invoice.dueDate.toLocaleDateString('fa-IR')}</span>
                </div>
              </div>
            </div>
            <div class="info-column">
              <div class="info-section">
                <h3>مشخصات نماینده</h3>
                <div class="info-item">
                  <span class="label">نام:</span>
                  <span class="value">${invoice.representative.fullName}</span>
                </div>
                <div class="info-item">
                  <span class="label">کد:</span>
                  <span class="value">${invoice.representative.adminUsername}</span>
                </div>
                <div class="info-item">
                  <span class="label">فروشگاه:</span>
                  <span class="value">${invoice.representative.storeName || '-'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>ردیف</th>
                <th>شرح خدمات</th>
                <th>مقدار</th>
                <th>قیمت واحد (تومان)</th>
                <th>مبلغ کل (تومان)</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map((item: any, index: number) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.description}</td>
                  <td>${item.quantity} ${item.subscriptionType === 'limited' ? 'GB' : 'عدد'}</td>
                  <td>${Number(item.unitPrice).toLocaleString('fa-IR')}</td>
                  <td>${Number(item.totalPrice).toLocaleString('fa-IR')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total-section">
            <div class="total-amount">
              جمع کل: ${Number(invoice.totalAmount).toLocaleString('fa-IR')} تومان
            </div>
          </div>
        </div>
        <div class="footer">
          <p>فاکتور الکترونیکی MarFanet - تاریخ تولید: ${new Date().toLocaleString('fa-IR')}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generatePersianOptimizedTemplate(invoice: any): string {
  return `
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>پیش‌نمایش فاکتور - فارسی</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sahel:wght@300;400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Sahel', Arial, sans-serif; background: linear-gradient(45deg, #f0fdf4 0%, #fcfdf7 100%); padding: 25px; line-height: 1.8; }
        .invoice-container { max-width: 850px; margin: 0 auto; background: white; border-radius: 20px; box-shadow: 0 15px 35px rgba(5,150,105,0.1); border: 2px solid #d1fae5; overflow: hidden; }
        .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 35px; text-align: center; position: relative; }
        .header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="2" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect x="0" y="0" width="100" height="100" fill="url(%23pattern)"/></svg>'); }
        .header h1 { font-size: 32px; font-weight: 700; margin-bottom: 12px; position: relative; z-index: 1; }
        .header p { font-size: 18px; opacity: 0.95; position: relative; z-index: 1; }
        .content { padding: 35px; }
        .persian-ornament { text-align: center; margin: 20px 0; color: #059669; font-size: 24px; }
        .invoice-info { display: grid; grid-template-columns: 1fr 1fr; gap: 35px; margin-bottom: 35px; }
        .info-section { background: #f0fdf4; padding: 25px; border-radius: 15px; border-right: 4px solid #059669; }
        .info-section h3 { color: #064e3b; font-size: 20px; margin-bottom: 18px; font-weight: 700; text-align: center; }
        .info-item { margin-bottom: 12px; padding: 8px 0; border-bottom: 1px dotted #a7f3d0; }
        .label { color: #047857; font-weight: 600; display: inline-block; width: 120px; }
        .value { color: #064e3b; font-weight: 700; font-size: 16px; }
        .items-table { width: 100%; border-collapse: collapse; margin: 25px 0; border-radius: 15px; overflow: hidden; box-shadow: 0 8px 16px rgba(5,150,105,0.08); }
        .items-table th { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 18px; text-align: right; font-weight: 700; font-size: 16px; }
        .items-table td { padding: 18px; border-bottom: 1px solid #d1fae5; background: white; }
        .items-table tr:nth-child(even) td { background: #f0fdf4; }
        .items-table tr:hover td { background: #ecfdf5; }
        .total-section { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 25px; border-radius: 15px; margin-top: 25px; text-align: center; border: 2px solid #a7f3d0; }
        .total-amount { font-size: 28px; font-weight: 700; color: #047857; margin-bottom: 10px; }
        .total-text { color: #059669; font-size: 18px; font-weight: 600; }
        .footer { background: #f0fdf4; padding: 25px; text-align: center; color: #047857; border-top: 2px solid #d1fae5; font-size: 14px; }
        .decorative-line { width: 100px; height: 3px; background: linear-gradient(90deg, #059669, #10b981); margin: 15px auto; border-radius: 2px; }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <h1>مارفانت</h1>
          <p>سیستم هوشمند مدیریت نمایندگان شبکه خصوصی مجازی</p>
        </div>
        <div class="content">
          <div class="persian-ornament">❋ ❋ ❋</div>
          
          <div class="invoice-info">
            <div class="info-section">
              <h3>مشخصات صورتحساب</h3>
              <div class="info-item">
                <span class="label">شماره فاکتور:</span>
                <span class="value">${invoice.invoiceNumber}</span>
              </div>
              <div class="info-item">
                <span class="label">تاریخ صدور:</span>
                <span class="value">${new Date().toLocaleDateString('fa-IR')}</span>
              </div>
              <div class="info-item">
                <span class="label">مهلت پرداخت:</span>
                <span class="value">${invoice.dueDate.toLocaleDateString('fa-IR')}</span>
              </div>
            </div>
            <div class="info-section">
              <h3>مشخصات مشتری</h3>
              <div class="info-item">
                <span class="label">نام و نام خانوادگی:</span>
                <span class="value">${invoice.representative.fullName}</span>
              </div>
              <div class="info-item">
                <span class="label">نام کاربری سیستم:</span>
                <span class="value">${invoice.representative.adminUsername}</span>
              </div>
              <div class="info-item">
                <span class="label">نام فروشگاه:</span>
                <span class="value">${invoice.representative.storeName || 'تعریف نشده'}</span>
              </div>
            </div>
          </div>
          
          <div class="decorative-line"></div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>شرح خدمات ارائه شده</th>
                <th>مقدار مصرفی</th>
                <th>نرخ واحد (تومان)</th>
                <th>مبلغ کل (تومان)</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map((item: any) => `
                <tr>
                  <td style="font-weight: 600;">${item.description}</td>
                  <td>${item.quantity} ${item.subscriptionType === 'limited' ? 'گیگابایت' : 'اشتراک'}</td>
                  <td>${Number(item.unitPrice).toLocaleString('fa-IR')}</td>
                  <td style="font-weight: 700; color: #047857;">${Number(item.totalPrice).toLocaleString('fa-IR')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total-section">
            <div class="total-text">مبلغ کل قابل پرداخت</div>
            <div class="total-amount">${Number(invoice.totalAmount).toLocaleString('fa-IR')} تومان</div>
          </div>
          
          <div class="decorative-line"></div>
        </div>
        <div class="footer">
          <p>این صورتحساب به صورت خودکار از سیستم مارفانت تولید گردیده است</p>
          <p>تاریخ و زمان تولید: ${new Date().toLocaleString('fa-IR')}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}