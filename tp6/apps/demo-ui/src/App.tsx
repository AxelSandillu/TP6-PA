import React, { useState } from 'react';

export default function App() {
  const [customerId, setCustomerId] = useState('C-1234');
  const [planId, setPlanId] = useState('Plan Digital');
  const [simulateFailure, setSimulateFailure] = useState('none');
  const [activationId, setActivationId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('IDLE');
  const [history, setHistory] = useState<any[]>([]);

  const handleContratar = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('PENDING');
    setHistory([]);

    try {
      const response = await fetch('http://localhost:3000/activations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, planId, simulateFailure }),
      });
      const data = await response.json();
      setActivationId(data.activationId);

      // Simular seguimiento rápido del estado
      pollActivationStatus(data.activationId);
    } catch (error) {
      console.error('Error al contratar:', error);
      setStatus('FAILED');
    }
  };

  const pollActivationStatus = (id: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:3000/activations/${id}`);
        const data = await res.json();
        setStatus(data.status);
        setHistory(data.history || []);

        if (data.status === 'ACTIVE' || data.status === 'FAILED') {
          clearInterval(interval);
        }
      } catch (err) {
        console.error(err);
      }
    }, 1500);
  };

  return (
    <div
      style={{
        fontFamily: 'Arial, sans-serif',
        maxWidth: '800px',
        margin: '40px auto',
        padding: '20px',
      }}
    >
      <h2>POC - Activación de Servicios con Kafka</h2>

      <form
        onSubmit={handleContratar}
        style={{ background: '#f4f4f4', padding: '20px', borderRadius: '8px' }}
      >
        <div style={{ marginBottom: '10px' }}>
          <label>Customer ID: </label>
          <input
            type="text"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Plan ID: </label>
          <input
            type="text"
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Simular Fallo: </label>
          <select
            value={simulateFailure}
            onChange={(e) => setSimulateFailure(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          >
            <option value="none">Ninguno (Camino Feliz)</option>
            <option value="billing">Fallo en Facturación</option>
            <option value="provisioning">Fallo en Aprovisionamiento</option>
          </select>
        </div>
        <button
          type="submit"
          style={{
            background: '#007bff',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Contratar Plan
        </button>
      </form>

      <div style={{ marginTop: '30px' }}>
        <h3>
          Estado Actual:{' '}
          <span
            style={{
              color:
                status === 'ACTIVE'
                  ? 'green'
                  : status === 'FAILED'
                    ? 'red'
                    : 'orange',
            }}
          >
            {status}
          </span>
        </h3>
        {activationId && (
          <p>
            <strong>ID de Activación:</strong> {activationId}
          </p>
        )}

        <h4>Timeline de Eventos:</h4>
        <ul>
          {history.map((item, index) => (
            <li key={index} style={{ marginBottom: '8px' }}>
              <strong>{item.eventType}</strong> -{' '}
              <small>{new Date(item.at).toLocaleTimeString()}</small>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
