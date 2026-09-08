import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Sidebar.css';

const navLinkClass = ({ isActive }) => 'sidebar__link' + (isActive ? ' sidebar__link--active' : '');

export default function Sidebar({ isOpen, onNavigate }) {
  const { isAdmin } = useAuth();

  return (
    <nav className={'sidebar' + (isOpen ? ' sidebar--open' : '')}>
      <div className="sidebar__brand">Zongo Supermarket</div>

      <div className="sidebar__section">
        <NavLink to="/dashboard" end className={navLinkClass} onClick={onNavigate}>Dashboard</NavLink>
        <NavLink to="/employees" className={navLinkClass} onClick={onNavigate}>Employees</NavLink>
        <NavLink to="/sales-orders" className={navLinkClass} onClick={onNavigate}>Sales Orders</NavLink>
        <NavLink to="/returns" className={navLinkClass} onClick={onNavigate}>Returns</NavLink>
      </div>

      {isAdmin && (
        <>
          <div className="sidebar__section">
            <div className="sidebar__section-title">Trading</div>
            <NavLink to="/customers" className={navLinkClass} onClick={onNavigate}>Customers</NavLink>
            <NavLink to="/purchase-orders" className={navLinkClass} onClick={onNavigate}>Purchase Orders</NavLink>
            <NavLink to="/payments" className={navLinkClass} onClick={onNavigate}>Payments</NavLink>
          </div>

          <div className="sidebar__section">
            <div className="sidebar__section-title">Finance</div>
            <NavLink to="/finance/deposits" className={navLinkClass} onClick={onNavigate}>Deposits</NavLink>
            <NavLink to="/finance/expenses" className={navLinkClass} onClick={onNavigate}>Expenses</NavLink>
            <NavLink to="/finance/other-income" className={navLinkClass} onClick={onNavigate}>Other Income</NavLink>
            <NavLink to="/finance/debits" className={navLinkClass} onClick={onNavigate}>Debits</NavLink>
            <NavLink to="/finance/profit-and-loss" className={navLinkClass} onClick={onNavigate}>Profit &amp; Loss</NavLink>
            <NavLink to="/finance/targets" className={navLinkClass} onClick={onNavigate}>Targets</NavLink>
            <NavLink to="/finance/product-totals" className={navLinkClass} onClick={onNavigate}>Product Totals</NavLink>
          </div>

          <div className="sidebar__section">
            <div className="sidebar__section-title">Admin</div>
            <NavLink to="/analytics" className={navLinkClass} onClick={onNavigate}>Analytics</NavLink>
            <NavLink to="/admin/users" className={navLinkClass} onClick={onNavigate}>User Accounts</NavLink>
          </div>
        </>
      )}
    </nav>
  );
}
