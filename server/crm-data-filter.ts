/**
 * CRM Data Filter - Restricts Financial Data Access for CRT Users
 * Ensures Customer Relations Team sees only interaction-relevant data
 */

interface CRMDataFilterOptions {
  userRole: 'admin' | 'crm';
  includeFinancialData: boolean;
}

export class CRMDataFilter {
  /**
   * Filter representative data for CRM users - remove financial information
   */
  static filterRepresentativeData(representatives: any[], userRole: 'admin' | 'crm') {
    if (userRole === 'admin') {
      return representatives; // Admin sees all data
    }

    // CRM users - filter out financial data
    return representatives.map(rep => ({
      id: rep.id,
      fullName: rep.fullName,
      adminUsername: rep.adminUsername,
      phoneNumber: rep.phoneNumber,
      storeName: rep.storeName,
      telegramId: rep.telegramId,
      status: rep.status,
      // Remove financial fields
      // currentBalance: HIDDEN from CRM
      // totalRevenue: HIDDEN from CRM
      // monthlyCommission: HIDDEN from CRM
      
      // Add customer summary instead of raw customer list
      customerSummary: {
        totalActiveCustomers: rep.customers?.filter((c: any) => c.status === 'active').length || 0,
        totalCustomers: rep.customers?.length || 0,
        lastCustomerActivity: rep.customers?.[0]?.lastContact || null
      }
      // Remove raw customers array to prevent chaotic display
    }));
  }

  /**
   * Filter analytics data for CRM users
   */
  static filterAnalyticsData(analyticsData: any, userRole: 'admin' | 'crm') {
    if (userRole === 'admin') {
      return analyticsData;
    }

    // CRM users - focus on customer interaction metrics only
    return {
      ...analyticsData,
      // Remove financial insights
      totalRevenue: undefined,
      monthlyRevenue: undefined,
      revenueGrowth: undefined,
      
      // Keep customer-focused metrics
      totalCustomers: analyticsData.totalCustomers,
      activeCustomers: analyticsData.activeCustomers,
      customerSatisfaction: analyticsData.customerSatisfaction,
      
      // Filter business insights to remove financial details
      businessInsights: analyticsData.businessInsights?.filter((insight: any) => 
        !insight.description.includes('درآمد') && 
        !insight.description.includes('revenue') &&
        !insight.title.includes('مالی')
      ) || []
    };
  }

  /**
   * Filter performance reports for CRM - exclude financial metrics
   */
  static filterPerformanceData(performanceData: any, userRole: 'admin' | 'crm') {
    if (userRole === 'admin') {
      return performanceData;
    }

    // Remove financial performance indicators for CRM
    const filtered = { ...performanceData };
    
    if (filtered.businessImpact) {
      delete filtered.businessImpact.revenueContribution;
      delete filtered.businessImpact.revenuePerCustomer;
      delete filtered.businessImpact.avgTransactionValue;
    }

    if (filtered.representativeAnalysis) {
      filtered.representativeAnalysis = filtered.representativeAnalysis.map((rep: any) => {
        const { revenue, monthlyCommission, totalEarnings, ...crmRelevantData } = rep;
        return crmRelevantData;
      });
    }

    return filtered;
  }

  /**
   * Get appropriate data fields based on user role
   */
  static getAllowedFields(userRole: 'admin' | 'crm', dataType: string): string[] {
    const commonFields = ['id', 'fullName', 'adminUsername', 'phoneNumber', 'storeName', 'telegramId', 'status'];
    
    if (userRole === 'admin') {
      return [...commonFields, 'currentBalance', 'totalRevenue', 'monthlyCommission', 'customers'];
    }

    // CRM users get customer interaction fields only
    return [...commonFields, 'customerSummary', 'lastInteraction', 'notes'];
  }
}