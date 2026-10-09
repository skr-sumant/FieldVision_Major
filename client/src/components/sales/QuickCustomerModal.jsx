import React, { useState } from 'react';
import { Store, User, Phone, MapPin, PlusCircle, CheckCircle2 } from 'lucide-react';
import { addCustomer } from '../../services/db';

export default function QuickCustomerModal({ isOpen, onClose, onCustomerCreated }) {
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('Kirana Store');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!shopName) return;

    const created = addCustomer({
      shopName,
      ownerName: ownerName || 'Store Owner',
      phone: phone || '9800000000',
      address: address || 'Market Area',
      category
    });

    onCustomerCreated(created);
    onClose();

    setShopName('');
    setOwnerName('');
    setPhone('');
    setAddress('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Store size={20} color="#3b82f6" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Register New Customer Shop</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Shop / Retailer Business Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Shree Balaji Traders"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label>Owner Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Rajesh Gupta"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Contact Phone</label>
              <input
                type="tel"
                className="form-control"
                placeholder="9823011221"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Category</label>
            <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="Kirana Store" style={{ background: '#0f172a' }}>Kirana Store</option>
              <option value="FMCG Supermarket" style={{ background: '#0f172a' }}>FMCG Supermarket</option>
              <option value="Pharmacy" style={{ background: '#0f172a' }}>Pharmacy & Medicals</option>
              <option value="Wholesale Distributor" style={{ background: '#0f172a' }}>Wholesale Distributor</option>
            </select>
          </div>

          <div className="form-group">
            <label>Location Address</label>
            <input
              type="text"
              className="form-control"
              placeholder="Station Road Market, Mumbai"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
            <CheckCircle2 size={16} /> Save & Select Customer
          </button>
        </form>
      </div>
    </div>
  );
}
