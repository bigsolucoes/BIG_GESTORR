export const formatCurrency = (
    value: number | undefined | null, 
    privacyModeEnabled: boolean | undefined, 
    currencySymbol: string = 'R$'
  ): string => {
    if (value === undefined || value === null) {
      return privacyModeEnabled ? `${currencySymbol} ••••••` : `${currencySymbol} 0,00`;
    }
    
    if (privacyModeEnabled) {
      return `${currencySymbol} ••••••`;
    }
    
    return `${currencySymbol} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  // You can add other formatter functions here if needed, e.g., formatDate
  export const formatDate = (dateString: string | undefined | null, options?: Intl.DateTimeFormatOptions): string => {
    if (!dateString) return '---';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Data Inválida';
      return date.toLocaleDateString('pt-BR', options || { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return 'Data Erro';
    }
  };