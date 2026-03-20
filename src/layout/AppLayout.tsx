import type { ReactNode } from 'react';
import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Breadcrumbs,
  Link,
  Badge,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import InventoryIcon from '@mui/icons-material/Inventory';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ChatIcon from '@mui/icons-material/Chat';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '@/auth/AuthContext';
import type { UserRole } from '@/types';

const DRAWER_WIDTH = 260;

interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { path: '/patients', label: 'Patients', icon: <PeopleIcon />, roles: ['doctor'] },
  { path: '/prescriptions', label: 'My Prescriptions', icon: <ReceiptIcon />, roles: ['doctor'] },
  { path: '/prescriptions/new', label: 'New Prescription', icon: <AddCircleIcon />, roles: ['doctor'] },
  { path: '/pharmacy/queue', label: 'Prescription Queue', icon: <ReceiptIcon />, roles: ['pharmacist'] },
  { path: '/inventory', label: 'Inventory', icon: <InventoryIcon />, roles: ['pharmacist', 'admin'] },
  { path: '/inventory/ai-dashboard', label: 'Inventory AI Dashboard', icon: <TrendingUpIcon />, roles: ['pharmacist', 'admin'] },
  { path: '/medications', label: 'Medication Catalog', icon: <LocalPharmacyIcon />, roles: ['pharmacist', 'admin'] },
  { path: '/chat', label: 'Messages', icon: <ChatIcon />, roles: ['doctor', 'pharmacist'] },
  { path: '/admin/users', label: 'User Management', icon: <AdminPanelSettingsIcon />, roles: ['admin'] },
];

export function AppLayout() {
  const [open, setOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const allowedItems = navItems.filter((item) => user && item.roles.includes(user.role));

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((seg, i) => {
    const path = '/' + pathSegments.slice(0, i + 1).join('/');
    const labelMap: Record<string, string> = {
      patients: 'Patients',
      prescriptions: 'Prescriptions',
      new: 'New Prescription',
      pharmacy: 'Pharmacy',
      queue: 'Queue',
      review: 'Review',
      inventory: 'Inventory',
      'ai-dashboard': 'AI Dashboard',
      medications: 'Medications',
      chat: 'Messages',
      admin: 'Admin',
      users: 'Users',
      dispense: 'Dispense',
    };
    return { path, label: labelMap[seg] || seg };
  });

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" onClick={() => setOpen(!open)} edge="start">
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Healthineer
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.name} ({user?.role})
          </Typography>
          <IconButton color="inherit" onClick={logout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            mt: 7,
            transition: (theme) =>
              theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
          },
        }}
      >
        <Box sx={{ overflow: 'auto', py: 2 }}>
          <List>
            {allowedItems.map((item) => (
              <ListItemButton
                key={item.path}
                selected={location.pathname.startsWith(item.path)}
                onClick={() => navigate(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
                {item.path === '/chat' && (
                  <Badge badgeContent={0} color="error" />
                )}
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 7, ml: open ? 0 : 0 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link
            component="button"
            variant="body2"
            onClick={() => navigate('/')}
            sx={{ cursor: 'pointer', textDecoration: 'none' }}
          >
            Home
          </Link>
          {breadcrumbs.map((b) => (
            <Link
              key={b.path}
              component="button"
              variant="body2"
              onClick={() => navigate(b.path)}
              sx={{ cursor: 'pointer', textDecoration: 'none' }}
            >
              {b.label}
            </Link>
          ))}
        </Breadcrumbs>
        <Outlet />
      </Box>
    </Box>
  );
}
