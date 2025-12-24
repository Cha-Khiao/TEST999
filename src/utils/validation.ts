export const isValidThaiPhoneNumber = (phone: string): boolean => {
    // Must be numbers only and exactly 10 digits
    return /^\d{10}$/.test(phone);
};

export const formatPhoneNumberInput = (value: string): string => {
    // Remove non-numeric characters
    const cleaned = value.replace(/\D/g, '');
    // Limit to 10 characters
    return cleaned.slice(0, 10);
};
