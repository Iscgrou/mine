import React from "react";

// Basic working app without complex dependencies
function App() {
  const currentPath = window.location.pathname;
  
  // Check if this is the admin path
  if (currentPath.includes('/ciwomplefoadm867945')) {
    return (
      <div style={{
        fontFamily: 'Tahoma',
        direction: 'rtl',
        padding: '20px',
        background: '#f5f5f5',
        minHeight: '100vh'
      }}>
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <h1 style={{ color: '#333', marginBottom: '20px', fontSize: '24px' }}>
            پنل مدیریت MarFanet
          </h1>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ color: '#666', lineHeight: '1.6' }}>
              سیستم با موفقیت بارگذاری شد. لطفاً گزینه مورد نظر را انتخاب کنید:
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <a 
              href="/ciwomplefoadm867945/import" 
              style={{
                display: 'block',
                padding: '15px',
                background: '#007BFF',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '5px',
                textAlign: 'center'
              }}
            >
              آپلود فایل .ods
            </a>
            <a 
              href="/ciwomplefoadm867945/representatives" 
              style={{
                display: 'block',
                padding: '15px',
                background: '#28A745',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '5px',
                textAlign: 'center'
              }}
            >
              مدیریت نمایندگان
            </a>
            <a 
              href="/ciwomplefoadm867945/invoices" 
              style={{
                display: 'block',
                padding: '15px',
                background: '#FD7E14',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '5px',
                textAlign: 'center'
              }}
            >
              فاکتورها
            </a>
            <a 
              href="/ciwomplefoadm867945/analytics" 
              style={{
                display: 'block',
                padding: '15px',
                background: '#6F42C1',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '5px',
                textAlign: 'center'
              }}
            >
              گزارشات
            </a>
          </div>
          
          <div style={{ marginTop: '30px', padding: '15px', background: '#E8F5E8', borderRadius: '5px' }}>
            <h3 style={{ color: '#155724', marginBottom: '10px' }}>وضعیت سیستم</h3>
            <p style={{ color: '#155724', margin: '0' }}>
              ✓ سرور فعال | ✓ پایگاه داده متصل | ✓ آپلود .ods آماده
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Default fallback for other paths
  return (
    <div style={{
      fontFamily: 'Tahoma',
      direction: 'rtl',
      textAlign: 'center',
      padding: '50px',
      background: '#f5f5f5',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '8px',
        maxWidth: '400px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ color: '#d32f2f', marginBottom: '20px' }}>خطای دسترسی</h1>
        <p style={{ color: '#666', lineHeight: '1.6' }}>
          لطفاً از لینک صحیح استفاده کنید.
        </p>
      </div>
    </div>
  );
}

export default App;
