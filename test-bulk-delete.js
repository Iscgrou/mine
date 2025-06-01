// TDD Test for Bulk Delete Fix
// This test should fail before the fix and pass after

const test = async () => {
  try {
    // Test bulk delete endpoint
    const response = await fetch('/api/invoices/delete-all', {
      method: 'DELETE'
    });
    
    const result = await response.json();
    
    if (response.ok && result.message) {
      console.log('✓ Bulk delete works correctly');
      return true;
    } else {
      console.log('✗ Bulk delete failed');
      return false;
    }
  } catch (error) {
    console.log('✗ Error in bulk delete:', error.message);
    return false;
  }
};

// Run test
test();