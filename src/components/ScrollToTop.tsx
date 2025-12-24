'use client';
import { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { ArrowUp } from 'react-bootstrap-icons';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  return (
    <Button
      variant="primary"
      className={`position-fixed bottom-0 end-0 m-4 rounded-circle shadow-lg p-0 d-flex align-items-center justify-content-center ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ width: '50px', height: '50px', transition: 'opacity 0.3s', zIndex: 1050 }}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <ArrowUp size={24} />
    </Button>
  );
}