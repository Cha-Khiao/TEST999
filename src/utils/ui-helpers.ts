
export const getCategoryColor = (category: string) => {
    switch (category) {
        case 'อาหารและน้ำดื่ม': return 'success';
        case 'ยาและเวชภัณฑ์': return 'danger';
        case 'เครื่องนุ่งห่ม': return 'info';
        case 'ของใช้ทั่วไป': return 'primary';
        case 'อุปกรณ์การนอน': return 'warning';
        default: return 'secondary';
    }
};

export const getStatusColor = (status: string) => {
    switch (status) {
        case 'COMPLETED': return 'success';
        case 'PENDING': return 'warning';
        case 'CANCELLED': return 'danger';
        default: return 'secondary';
    }
};
