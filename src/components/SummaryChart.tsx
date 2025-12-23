// src/components/SummaryChart.tsx
'use client';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Card, Row, Col } from 'react-bootstrap';
import { useTheme } from './ThemeProvider';

// ลงทะเบียน Component ของ Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface Props {
  items: any[];
}

export default function SummaryChart({ items }: Props) {
  const { theme } = useTheme();

  // 1. เตรียมข้อมูลสำหรับ Doughnut Chart (สัดส่วนตามหมวดหมู่)
  const categoryCount: { [key: string]: number } = {};
  items.forEach(item => {
    categoryCount[item.category] = (categoryCount[item.category] || 0) + item.quantity;
  });

  const doughnutData = {
    labels: Object.keys(categoryCount),
    datasets: [
      {
        label: 'จำนวน (ชิ้น/แพ็ค)',
        data: Object.values(categoryCount),
        backgroundColor: [
          '#0d6efd', // Blue
          '#198754', // Green
          '#ffc107', // Yellow
          '#dc3545', // Red
          '#6f42c1', // Purple
          '#0dcaf0', // Cyan
        ],
        borderColor: theme === 'dark' ? '#343a40' : '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  // 2. เตรียมข้อมูลสำหรับ Bar Chart (5 อันดับสินค้าคงเหลือสูงสุด)
  const topItems = [...items].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  
  const barData = {
    labels: topItems.map(i => i.name),
    datasets: [
      {
        label: 'จำนวนคงเหลือสูงสุด 5 อันดับแรก',
        data: topItems.map(i => i.quantity),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: theme === 'dark' ? '#e9ecef' : '#212529'
        }
      },
      title: {
        display: false,
      },
    },
    scales: {
        y: {
            ticks: { color: theme === 'dark' ? '#adb5bd' : '#6c757d' },
            grid: { color: theme === 'dark' ? '#495057' : '#dee2e6' }
        },
        x: {
            ticks: { color: theme === 'dark' ? '#adb5bd' : '#6c757d' },
            grid: { display: false }
        }
    }
  };

  // Doughnut Options (เอา scale ออกเพราะเป็นวงกลม)
  const doughnutOptions = {
      ...chartOptions,
      scales: {}, // วงกลมไม่มีแกน X Y
      cutout: '60%', // ทำให้ตรงกลางกลวงสวยๆ
  }

  return (
    <Row className="g-4 mb-4">
      {/* กราฟวงกลม: สัดส่วนหมวดหมู่ */}
      <Col md={6} lg={4}>
        <Card className="h-100 shadow-sm border-0">
          <Card.Header className="bg-transparent fw-bold border-0 pt-3">
             📊 สัดส่วนคลังสินค้า (ตามหมวดหมู่)
          </Card.Header>
          <Card.Body className="d-flex align-items-center justify-content-center p-2">
            <div style={{ width: '100%', maxWidth: '300px' }}>
                {items.length > 0 ? (
                     <Doughnut data={doughnutData} options={doughnutOptions} />
                ) : (
                    <p className="text-center text-muted">ไม่มีข้อมูล</p>
                )}
            </div>
          </Card.Body>
        </Card>
      </Col>

      {/* กราฟแท่ง: สินค้า Top 5 */}
      <Col md={6} lg={8}>
        <Card className="h-100 shadow-sm border-0">
           <Card.Header className="bg-transparent fw-bold border-0 pt-3">
             🏆 สินค้าคงเหลือสูงสุด (Top 5)
          </Card.Header>
          <Card.Body>
            {items.length > 0 ? (
                <Bar data={barData} options={chartOptions} />
            ) : (
                <p className="text-center text-muted">ไม่มีข้อมูล</p>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}